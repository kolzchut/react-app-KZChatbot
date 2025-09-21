import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Errors, Message, MessageType, Answer } from "@/types";
import { HttpError } from "../../lib/HttpError";
import { pushAnalyticsEvent } from "@/lib/analytics";
import { useMobile } from "@/lib/useMobile";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openChat, closeChat, selectIsChatOpen } from "@/store/slices/chatSlice";
import { selectQuestion, selectQuestionSource, resetQuestion } from "@/store/slices/questionSlice";
import {
  Messages,
  Popover,
  PopoverContent,
  Footer,
  ClosePopover,
} from "@/components";
import WebiksFooter from "./webiksFooter/WebiksFooter";
import "./chatbot.css";


const Chatbot = () => {
  const dispatch = useAppDispatch();
  const isChatOpen = useAppSelector(selectIsChatOpen);
  const question = useAppSelector(selectQuestion);
  const questionSource = useAppSelector(selectQuestionSource);

  const [globalConfigObject, setGlobalConfigObject] = useState<
    typeof window.KZChatbotConfig | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const initialErrors: Errors = useMemo(() => ({
    description: "",
  }), []);
  const [errors, setErrors] = useState<Errors>(initialErrors);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasAskedQuestions, setHasAskedQuestions] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobile();

  useEffect(() => {
    if (isChatOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isChatOpen]);

    useEffect(() => {
    if (globalConfigObject?.autoOpen) {
      pushAnalyticsEvent("opened", null, "auto-opened");
      dispatch(openChat());
    }
  }, [globalConfigObject, dispatch]);

  const handleCloseChat = () => {
    if (!hasAskedQuestions) {
      pushAnalyticsEvent("closed_unused");
    }
    dispatch(closeChat());
    setHasAskedQuestions(false); // Reset for next session
  };

  const getAnswer = useCallback(async (question: string): Promise<Answer | void> => {
    const isProduction = import.meta.env.MODE === "production";

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
  }, [globalConfigObject]);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
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
      pushAnalyticsEvent("question_asked", null, questionSource || "popup");
      setHasAskedQuestions(true);
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
  }, [question, globalConfigObject, questionSource, dispatch, initialErrors, getAnswer]);

  // Handle questions from embed widget
  useEffect(() => {
    if (question && question.trim() && questionSource === "embed") {
      handleSubmit(new Event('submit') as React.FormEvent<HTMLFormElement>);
    }
  }, [question, questionSource, handleSubmit]);

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
      <div className="chatbot-overlay" />
      <PopoverContent className={`chatbot-popover-content ${isMobile ? "mobile" : "desktop"}`}>
        <ClosePopover
          handleChatSetIsOpen={handleCloseChat}
          globalConfigObject={globalConfigObject}
        />
        <div className="chatbot-popover-main">
          <Messages
            setMessages={setMessages}
            messages={messages}
            isLoading={isLoading}
            ref={messageContainerRef}
            globalConfigObject={globalConfigObject}
            errors={errors}
            setErrors={setErrors}
            initialErrors={initialErrors}
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
          <WebiksFooter />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default Chatbot;
