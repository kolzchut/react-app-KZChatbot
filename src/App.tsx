import { useEffect, useState, useRef, useCallback } from "react";
import { Errors, Message, MessageType, Answer } from "@/types";
import {
  Messages,
  Popover,
  PopoverContent,
  Footer,
  ClosePopover,
  ScrollWidget,
} from "@/components";
import { pushAnalyticsEvent } from "@/lib/analytics";
import { v4 as uuidv4 } from "uuid";
import { HttpError } from "./lib/HttpError";
import { useMobile } from "@/lib/useMobile";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openChat, closeChat, selectIsChatOpen } from "@/store/slices/chatSlice";
import { selectQuestion, setQuestion, resetQuestion } from "@/store/slices/questionSlice";

function App() {
  const dispatch = useAppDispatch();
  const isChatOpen = useAppSelector(selectIsChatOpen);
  const question = useAppSelector(selectQuestion);

  const [globalConfigObject, setGlobalConfigObject] = useState<
    typeof window.KZChatbotConfig | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const initialErrors: Errors = {
    description: "",
  };
  const [errors, setErrors] = useState<Errors>(initialErrors);
  const [messages, setMessages] = useState<Message[]>([]);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollWidget, setShowScrollWidget] = useState(false);
  const isMobile = useMobile();

  // Add useEffect to control body scrolling
  useEffect(() => {
    if (isMobile && isChatOpen) {
      // Prevent scrolling on the body when chat is open on mobile
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scrolling when chat is closed
      document.body.style.overflow = '';
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isChatOpen]);

  // Add sleep utility function
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getAnswer = async (question: string): Promise<Answer | void> => {
    const isProduction = import.meta.env.MODE === "production";

    if (!isProduction) {
      await sleep(3000);
    }

    const url = isProduction
      ? `${globalConfigObject?.restPath}/kzchatbot/v0/question`
      : "/api/kzchatbot/v0/question";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: question,
        uuid: globalConfigObject?.uuid || "",
        referrer: globalConfigObject?.referrer || ""
      }),
    });


    const data = await response.json();
    if (!response.ok) {
      pushAnalyticsEvent(
        "error_received",
        response.status + ": " + data.message,
      );
      throw new HttpError(data.message, response.status);
    }
    return data;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (question === "" || !question.trim()) {
      return false;
    }
    
    setIsLoading(true);
    let isFirstQuestion = true;

    if (
      !question ||
      !globalConfigObject ||
      !globalConfigObject?.uuid ||
      globalConfigObject.chatbotIsShown !== true ||
      !globalConfigObject.slugs
    ) {
      return null;
    }

    try {
      pushAnalyticsEvent("question_asked");
      setMessages((prevMessages) => {
        prevMessages.map((item) => {
          if (item.type !== MessageType.StartBot) {
            isFirstQuestion = false;
          }
        });

        const newMessages: Message[] = [
          ...prevMessages,
          {
            id: uuidv4(),
            content: question,
            type: MessageType.User,
            isFirstQuestion,
          },
        ];

        return newMessages;
      });

      const answer = await getAnswer(question);
      if (!answer?.llmResult) throw new Error();

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: answer.conversationId,
          content: answer.llmResult,
          type: MessageType.Bot,
          links: answer.docs,
        },
      ]);
      setShowInput(false);
      pushAnalyticsEvent("answer_received");
    } catch (error) {
      let content: string;
      let type: MessageType;
      if (error instanceof HttpError) {
        content = error.message;
        type = error.httpCode === 403 ? MessageType.Warning : MessageType.Error;
      } else {
        content = globalConfigObject?.slugs.general_error;
        type = MessageType.Error;
      }
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: uuidv4(),
          content,
          type,
        },
      ]);
      console.error(error);
    } finally {
      dispatch(resetQuestion());
      setIsLoading(false);
      setErrors(initialErrors);
    }
  };

  // const hasMessages = useCallback(() => {
  //   return messages.some((message) => message.type === MessageType.User);
  // }, [messages]);

  // const handleChatSetIsOpen = useCallback((isOpen: boolean) => {
  //   if (!isOpen && !hasMessages()) {
  //     pushAnalyticsEvent("closed_unused");
  //   } else if (isOpen) {
  //     pushAnalyticsEvent("opened");
  //   }
  //   dispatch(isOpen ? openChat() : closeChat());
  // }, [dispatch, hasMessages]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior,
      });
    }
  }, []);

  const scrollToAnswer = useCallback(() => {
    if (messageContainerRef.current) {
      const lastMessage = messageContainerRef.current.lastElementChild;
      if (lastMessage) {
        lastMessage.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  const handleScroll = () => {
    if (messageContainerRef.current) {
      const { scrollHeight, scrollTop, clientHeight } =
        messageContainerRef.current;
      setShowScrollWidget(scrollHeight - scrollTop > clientHeight + 100);
    }
  };

  useEffect(() => {
    if (
      errors.description ||
      (messages.length &&
        messages[messages.length - 1].type === MessageType.User)
    ) {
      scrollToBottom("instant");
    }
  }, [scrollToBottom, errors, messages]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (
      messages.length &&
      lastMessage.liked === undefined &&
      [MessageType.Bot, MessageType.Warning, MessageType.Error].includes(
        lastMessage.type,
      )
    ) {
      scrollToAnswer();
    }
  }, [messages, scrollToAnswer]);

  useEffect(() => {
    if (window.KZChatbotConfig) {
      const initMessages =
        window.KZChatbotConfig.questionsPermitted > 0
          ? [
            {
              id: uuidv4(),
              content:
                window.KZChatbotConfig?.slugs.welcome_message_first || "",
              type: MessageType.StartBot,
            },
          ]
          : [
            {
              id: uuidv4(),
              content:
                window.KZChatbotConfig?.slugs.questions_daily_limit || "",
              type: MessageType.StartBot,
            },
          ];
      setMessages(initMessages);
      setGlobalConfigObject(window.KZChatbotConfig);
    }
  }, [setMessages, globalConfigObject]);

  return (
    <Popover isChatOpen={isChatOpen}>
      {/* Overlay to block background clicks on mobile when chat is open */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 39, // Lower z-index to ensure it's below the popover content
            background: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
            touchAction: "none", // Prevent touch events from passing through
            pointerEvents: "auto", // Ensure clicks are captured
          }}
          onClick={(e) => {
            e.stopPropagation();
            dispatch(openChat());
            // handleChatSetIsOpen(false); // Close chat when clicking on overlay
          }}
        />
      )}
      <PopoverContent
        style={{
          direction: "rtl",
          margin: "0",
          marginBottom: isMobile ? "0" : "-2.5vh",
          width: isMobile ? "100vw" : "70vh",
          minWidth: isMobile ? "none" : "400px",
          maxWidth: isMobile ? "none" : "500px",
          height: isMobile ? "100vh" : "96vh",
          maxHeight: isMobile ? "none" : "800px",
          overflow: "hidden",
          position: isMobile ? "fixed" : "fixed",
          top: isMobile ? "0" : "auto",
          right: isMobile ? "0" : "auto",
          bottom: isMobile ? "0" : "1rem",
          left: isMobile ? "0" : "1rem",
          zIndex: 50,
          padding: 0,
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          borderRadius: isMobile ? "0" : "8px",
        }}
      >
        <ClosePopover
          handleChatSetIsOpen={() => {
            dispatch(closeChat());
          }}
          globalConfigObject={globalConfigObject}
        />
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f2f6fa",
          overflow: "hidden"
        }}>
          <Messages
            setMessages={setMessages}
            messages={messages}
            isLoading={isLoading}
            ref={messageContainerRef}
            onScroll={handleScroll}
            globalConfigObject={globalConfigObject}
            errors={errors}
            setErrors={setErrors}
            initialErrors={initialErrors}
          />
          <ScrollWidget
          scrollToBottom={scrollToBottom}
          showScrollWidget={showScrollWidget}
        />
          <Footer
            isLoading={isLoading}
            showInput={showInput}
            handleSubmit={handleSubmit}
            setShowInput={setShowInput}
            globalConfigObject={globalConfigObject}
            errors={errors}
            setErrors={setErrors}
            messages={messages}
            isChatOpen={isChatOpen}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default App;
