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
import { v4 as uuidv4 } from "uuid";
import { HttpError } from "./lib/HttpError";

function App() {
  const [globalConfigObject, setGlobalConfigObject] = useState<
    typeof window.KZChatbotConfig | null
  >(null);
  const [isOpen, setIsOpen] = useState(false);
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
      globalConfigObject.chatbotIsShown !== "1" ||
      !globalConfigObject.slugs
    ) {
      return null;
    }

    try {
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
      if (!answer?.llmResult) throw new Error("No answer"); //TODO show error message

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
    } catch (error) {
      if (error instanceof HttpError) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: uuidv4(),
            content: error.message,
            type:
              error.httpCode === 403 ? MessageType.StartBot : MessageType.Error,
          },
        ]);
      }
      console.error(error);
    } finally {
      setQuestion("");
      setIsLoading(false);
    }
  };

  const scrollToBottom = useCallback(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior: "smooth",
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
    scrollToBottom();
  }, [scrollToBottom, errors]);

  useEffect(() => {
    if (
      messages.length &&
      messages[messages.length - 1].liked === undefined &&
      messages[messages.length - 1].type === MessageType.Bot
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
    <Popover open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <PopoverTrigger className="rounded-full bg-cta h-16 w-16 relative block">
        <div className="flex flex-col items-center">
          <img src={isOpen ? CloseIcon : HelpIcon} alt="TODO: change-me" />
          <span
            className={`text-xs font-bold ${isOpen ? "leading-4" : "leading-normal"} text-cta-foreground`}
          >
            {isOpen
              ? globalConfigObject?.slugs.close_chat_icon
              : globalConfigObject?.slugs.chat_icon}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        style={{
          direction: "rtl",
          marginLeft: "0.75rem",
        }}
      >
        <ClosePopover setIsOpen={setIsOpen} />
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
        />
      </PopoverContent>
    </Popover>
  );
}

export default App;
