import "./App.css";
import { useState } from "react";
import HelpIcon from "@/assets/help.svg";
import CloseIcon from "@/assets/close.svg";
import { Message, MessageType, ButtonType } from "@/types";
import {
  Messages,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Footer,
  ClosePopover,
} from "@/components";

const welcomeMessages: Message[] = [
  {
    id: 1,
    content:
      "שלום! הצ'אט החכם של 'כל זכות' פועל בעזרת בינה מלאכותית ויכול למצוא לך תשובות מתוך 'כל זכות' מהר ובקלות.",
    type: MessageType.StartBot,
  },
  {
    id: 2,
    content:
      "אפשר לשאול כל שאלה על זכויות, בשפה חופשית. כדאי לציין מאפיינים כלליים רלוונטיים כמו מגדר, גיל, משך ההעסקה וכדומה, כדי לקבל תשובות מתאימות. חשוב: הצ'אט לא חסוי. אין למסור בו מידע מזהה כמו שם, כתובת או מידע רפואי רגיש. המידע נאסף לצורך שיפור השירות.",
    type: MessageType.StartBot,
  },
  {
    id: 3,
    content:
      "אנחנו בתקופת הרצה. הצ'אט יכול לטעות, ו'כל זכות' לא אחראית לתשובות שלו. כדאי לבדוק את המידע גם בעמוד המתאים ב'כל זכות'. הקישור יופיע בסוף התשובה.",
    type: MessageType.StartBot,
  },
];

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [pressedRatingButton, setPressedRatingButton] =
    useState<ButtonType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [messages, setMessages] = useState<Message[]>(welcomeMessages);

  const handleRatingButtonClick = (buttonType: ButtonType) => {
    setPressedRatingButton(
      pressedRatingButton === buttonType ? null : buttonType,
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    let isFirstQuestion = true;
    event.preventDefault();
    setIsLoading(true);
    const form = event.target as HTMLFormElement;
    const input = form.elements.namedItem("question") as HTMLInputElement;
    const value = input.value;
    if (value) {
      setMessages((prevMessages) => {
        prevMessages.map((item) => {
          if (item.type !== MessageType.StartBot) {
            isFirstQuestion = false;
          }
        });

        const newMessages: Message[] = [
          {
            id: prevMessages.length + 1,
            content: value,
            type: MessageType.User,
            isFirstQuestion,
          },
        ];

        if (!isFirstQuestion) {
          newMessages.unshift(...prevMessages);
        }

        return newMessages;
      });
      input.value = "";

      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsLoading(false);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          content: "מתחת לגיל 16: שכר המינימום השעתי הוא 23.7",
          type: MessageType.Bot,
          links: [
            {
              title: "תשלום שכר לבני נוער (זכות)",
              url: "",
            },
            {
              title: "שכר מינימום לנוער",
              url: "",
            },
          ],
        },
      ]);
    }
    setShowInput(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <PopoverTrigger className="rounded-full bg-cta h-16 w-16 relative block">
        <div className="flex flex-col items-center">
          <img src={isOpen ? CloseIcon : HelpIcon} alt="TODO: change-me" />
          <span
            className={`text-xs font-bold ${isOpen ? "leading-4" : "leading-normal"} text-cta-foreground`}
          >
            {isOpen ? "סגירה" : "כל שאלה"}
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
          messages={messages}
          handleRatingButtonClick={handleRatingButtonClick}
          pressedRatingButton={pressedRatingButton}
          isLoading={isLoading}
        />
        <Footer
          isLoading={isLoading}
          showInput={showInput}
          handleSubmit={handleSubmit}
          setShowInput={setShowInput}
        />
      </PopoverContent>
    </Popover>
  );
}

export default App;
