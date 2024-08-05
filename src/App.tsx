import "./App.css";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Fragment, useState } from "react";
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
}

const messsages: Message[] = [
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
  {
    id: 4,
    content: "מה השכר השעתי לנוער בחופש הגדול?",
    type: MessageType.User,
  },
  {
    id: 5,
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
];

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [pressedRatingButton, setPressedRatingButton] =
    useState<ButtonType | null>(null);

  const handleRatingButtonClick = (buttonType: ButtonType) => {
    setPressedRatingButton(
      pressedRatingButton === buttonType ? null : buttonType,
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const input = form.elements.namedItem("question") as HTMLInputElement;
    const value = input.value;
    if (value) {
      console.log("Submitted value:", value);
      input.value = "";
    }
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
          {messsages.map((message) => (
            <Fragment key={message.id}>
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
          <TypingIndicator />
        </div>
        <div className="px-3">
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
              submitElement={<img src={PaperPlaneIcon} alt="TODO: change-me" />}
            />
            <span className="text-xs text-disclaimer">
              אין לשתף פרטים מזהים או מידע רגיש
            </span>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default App;
