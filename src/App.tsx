import { useEffect, useState, useRef, useCallback } from "react";
import HelpIcon from "@/assets/help.svg";
import CloseIcon from "@/assets/close.svg";
import { Errors, Message, MessageType, Answer } from "@/types";
import {
  Messages,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Footer,
  ClosePopover,
  ScrollWidget,
} from "@/components";
import { pushAnalyticsEvent } from "@/lib/analytics";
import { v4 as uuidv4 } from "uuid";
import { HttpError } from "./lib/HttpError";
import { useMobile } from "@/lib/useMobile";

function App() {
  const [globalConfigObject, setGlobalConfigObject] = useState<
    typeof window.KZChatbotConfig | null
  >(null);
  const [chatIsOpen, chatSetIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [question, setQuestion] = useState<string>("");
  const initialErrors: Errors = {
    description: "",
  };
  const [errors, setErrors] = useState<Errors>(initialErrors);
  const [messages, setMessages] = useState<Message[]>([]);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollWidget, setShowScrollWidget] = useState(false);
  const isMobile = useMobile();

  const getAnswer = async (question: string): Promise<Answer | void> => {
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
    if (question === "") {
      return false;
    }

    setIsLoading(true);
    const form = event.target as HTMLFormElement;
    const input = form.elements.namedItem("question") as HTMLInputElement;
    const value = input.value;
    let isFirstQuestion = true;

    if (
      !value ||
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
            content: value,
            type: MessageType.User,
            isFirstQuestion,
          },
        ];

        return newMessages;
      });

      input.value = "";
      const answer = await getAnswer(value);
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
      setQuestion("");
      setIsLoading(false);
      setErrors(initialErrors);
    }
  };

  const hasMessages = () => {
    return messages.some((message) => message.type === MessageType.User);
  };

  const handleChatSetIsOpen = (isOpen: boolean) => {
    if (!isOpen && !hasMessages()) {
      pushAnalyticsEvent("closed_unused");
    } else if (isOpen) {
      pushAnalyticsEvent("opened");
    }
    chatSetIsOpen(isOpen);
  };

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
              {
                id: uuidv4(),
                content:
                  window.KZChatbotConfig?.slugs.welcome_message_second || "",
                type: MessageType.StartBot,
              },
              {
                id: uuidv4(),
                content:
                  window.KZChatbotConfig?.slugs.welcome_message_third || "",
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
    <Popover
      open={chatIsOpen}
      onOpenChange={(open) => handleChatSetIsOpen(open)}
    >
      <PopoverTrigger
		id="kzchatbot-trigger"
		className={`rounded-full bg-cta h-16 w-16 relative block z-50`}
        title={
          chatIsOpen
            ? globalConfigObject?.slugs.close_chat_icon
            : globalConfigObject?.slugs.open_chat_icon
        }
      >
        <div className="flex flex-col items-center">
          <img src={chatIsOpen ? CloseIcon : HelpIcon} alt="" />
          <span
            className={`text-xs font-bold ${chatIsOpen ? "leading-4" : "leading-normal"} text-cta-foreground`}
          >
            {chatIsOpen
              ? globalConfigObject?.slugs.close_chat_icon
              : globalConfigObject?.slugs.chat_icon}
          </span>
          <p className={"sr-only"}>
            {chatIsOpen ? "" : globalConfigObject?.slugs.chat_description}
          </p>
        </div>
      </PopoverTrigger>
      <PopoverContent
        style={{
          direction: "rtl",
          marginLeft: "0.75rem",
          width: !isMobile ? "500px" : "",
          height: !isMobile ? "789px" : "",
          maxHeight: "85vh",
          overflow: "visible",
          position: "relative",
        }}
      >
        <ClosePopover
          handleChatSetIsOpen={handleChatSetIsOpen}
          globalConfigObject={globalConfigObject}
        />
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
          question={question}
          setQuestion={setQuestion}
          errors={errors}
          setErrors={setErrors}
          messages={messages}
          chatIsOpen={chatIsOpen}
        />
      </PopoverContent>
    </Popover>
  );
}

export default App;
