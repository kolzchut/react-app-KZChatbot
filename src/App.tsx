import { useEffect, useState, useRef, useCallback } from "react";
import HelpIcon from "@/assets/help.svg";
import CloseIcon from "@/assets/close.svg";
import { Message, MessageType, Answer } from "@/types";
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

function App() {
  const [globalConfigObject, setGlobalConfigObject] = useState<
    typeof window.KZChatbotConfig | null
  >(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollWidget, setShowScrollWidget] = useState(false);

  const getAnswer = async (question: string): Promise<Answer> => {
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
    return data;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    let isFirstQuestion = true;
    event.preventDefault();
    setIsLoading(true);
    const form = event.target as HTMLFormElement;
    const input = form.elements.namedItem("question") as HTMLInputElement;
    const value = input.value;

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
      if (!answer.llmResult) throw new Error("No answer"); //TODO show error message

      setIsLoading(false);
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
      console.error(error);
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

  const handleScroll = () => {
    if (messageContainerRef.current) {
      const { scrollHeight, scrollTop, clientHeight } =
        messageContainerRef.current;
      setShowScrollWidget(scrollHeight - scrollTop > clientHeight + 100);
    }
  };

  useEffect(() => {
    if (messages.length < 3) return;
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (window.KZChatbotConfig) {
      setGlobalConfigObject(window.KZChatbotConfig);
      setMessages([
        {
          id: uuidv4(),
          content: globalConfigObject?.slugs.welcome_message_first || "",
          type: MessageType.StartBot,
        },
        {
          id: uuidv4(),
          content:
            "אפשר לשאול כל שאלה על זכויות, בשפה חופשית. כדאי לציין מאפיינים כלליים רלוונטיים כמו מגדר, גיל, משך ההעסקה וכדומה, כדי לקבל תשובות מתאימות. חשוב: הצ'אט לא חסוי. אין למסור בו מידע מזהה כמו שם, כתובת או מידע רפואי רגיש. המידע נאסף לצורך שיפור השירות.",
          type: MessageType.StartBot,
        },
        {
          id: uuidv4(),
          content:
            "אנחנו בתקופת הרצה. הצ'אט יכול לטעות, ו'כל זכות' לא אחראית לתשובות שלו. כדאי לבדוק את המידע גם בעמוד המתאים ב'כל זכות'. הקישור יופיע בסוף התשובה.",
          type: MessageType.StartBot,
        },
      ]);
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
          slugs={globalConfigObject?.slugs}
        />
      </PopoverContent>
    </Popover>
  );
}

export default App;
