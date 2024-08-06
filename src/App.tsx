import "./App.css";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Fragment, useEffect, useState } from "react";
import HelpIcon from "@/assets/help.svg";
import CloseIcon from "@/assets/close.svg";
import MinimizeIcon from "@/assets/minimize.svg";
import PaperPlaneIcon from "@/assets/paper-plane.svg";
import TypingIndicator from "./components/TypingIndicator";
import Rating, { ButtonType } from "./components/Rating";

enum MessageType {
  StartBot = "startBot",
  Bot = "bot",
  User = "user",
}

interface Message {
  id: number;
  content: string;
  type: MessageType;
  links?: { title: string; url: string }[];
  isFirstQuestion?: boolean;
}

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
        <div className="flex justify-end px-1 pt-1 mb-[3px]">
          <button onClick={() => setIsOpen(false)}>
            <img src={MinimizeIcon} alt="TODO: add alt" />
          </button>
        </div>
        <div className="px-3 flex-1 overflow-auto">
          {messages.map((message) => (
            <Fragment key={message.id}>
              {message.isFirstQuestion === false && (
                <hr className="h-[1px] border-line left-3 relative w-[calc(100%_+_1.5rem)] my-3" />
              )}
              <div
                className={`text-sm p-3 mb-2 ${
                  [MessageType.StartBot, MessageType.Bot].includes(message.type)
                    ? "bg-message-bot-background text-message-bot-foreground rounded-[10px_10px_10px_0] mr-6"
                    : "bg-message-user-background text-message-user-foreground rounded-[10px_10px_0_10px] ml-[3.8rem]"
                }`}
              >
                {message.content}
              </div>

              {message.type === MessageType.Bot && (
                <>
                  {message.links && (
                    <div className="bg-message-bot-background text-message-bot-foreground border-r-4 border-message-user-background pr-[5px] py-2 mb-[6px]">
                      <span className="text-sm font-bold text-input-placholder mb-1 inline-block">
                        כדאי לבקר בעמודים האלה:
                      </span>
                      <ul className="list-inside">
                        {message.links.map((link, index) => (
                          <li
                            key={index}
                            className="text-sm mb-1 list-image-[url(assets/arrow-left.svg)]"
                          >
                            <a
                              href={link.url}
                              target="_blank"
                              className="text-sm mr-[2px] text-input-placholder"
                            >
                              {link.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Rating
                    pressedRatingButton={pressedRatingButton}
                    handleRatingButtonClick={handleRatingButtonClick}
                  />
                </>
              )}
            </Fragment>
          ))}
          {isLoading && <TypingIndicator />}
        </div>
        {!isLoading && (
          <div className="px-3">
            {showInput ? (
              <>
                <div className="flex justify-end items-center text-links-foreground text-sm mb-2">
                  <a href="TODO: add link" target="_blank">
                    תנאי שימוש
                  </a>
                  <span className="px-2 "> | </span>
                  <a href="TODO: add link" target="_blank">
                    איך לדבר עם הבוט?
                  </a>
                </div>
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center flex-col pb-2"
                >
                  <Input
                    type="text"
                    name="question"
                    placeholder="מה רצית לשאול?"
                    submitElement={
                      <img src={PaperPlaneIcon} alt="TODO: change-me" />
                    }
                  />
                  <span className="text-xs text-disclaimer">
                    אין לשתף פרטים מזהים או מידע רגיש
                  </span>
                </form>
              </>
            ) : (
              <button
                onClick={() => setShowInput(true)}
                className="relative block mx-auto my-0 mb-6 bg-button text-button-foreground text-xs font-bold h-[29px] rounded-full px-5 before:absolute before:bg-line before:w-[200px] before:h-[1px] before:right-0 before:top-1/2 before:translate-x-full before:-translate-y-1/2 before:pointer-events-none
             after:absolute after:bg-line after:w-[200px] after:h-[1px] after:left-0 after:top-1/2 after:-translate-x-full after:-translate-y-1/2 after:pointer-events-none"
              >
                שאלה חדשה
              </button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default App;
