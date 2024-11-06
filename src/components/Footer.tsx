import PaperPlaneIcon from "@/assets/paper-plane.svg";
import { Input } from "@/components";
import { Errors, Message } from "@/types";
import { useEffect, useRef } from "react";
import { useMobile } from "@/lib/useMobile";
import { pushAnalyticsEvent } from "@/lib/analytics";
import WebiksLogo from "@/assets/webiks-logo.svg";

interface FooterProps {
  isLoading: boolean;
  showInput: boolean;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  setShowInput: React.Dispatch<React.SetStateAction<boolean>>;
  globalConfigObject: typeof window.KZChatbotConfig | null;
  question: string;
  setQuestion: React.Dispatch<React.SetStateAction<string>>;
  errors: Errors;
  setErrors: React.Dispatch<React.SetStateAction<Errors>>;
  messages: Message[];
  chatIsOpen: boolean;
}

const Footer = ({
  isLoading,
  showInput,
  handleSubmit,
  setShowInput,
  globalConfigObject,
  question,
  setQuestion,
  errors,
  setErrors,
  messages,
  chatIsOpen,
}: FooterProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMobile();

  useEffect(() => {
    let isBotStarted = true;
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].type === undefined || messages[i].type !== "startBot") {
        isBotStarted = false;
        break;
      }
    }
    if (isMobile && isBotStarted) return;

    if (chatIsOpen && showInput && inputRef.current && messages.length) {
      inputRef.current.focus();
    }
  }, [isMobile, inputRef, showInput, messages, chatIsOpen]);

  if (
    isLoading ||
    (globalConfigObject && globalConfigObject?.questionsPermitted < 1)
  ) {
    return null;
  }
  const slugs = window.KZChatbotConfig.slugs;
  const handleOnMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestion(e.target.value);

    const charLimitSlug =
      globalConfigObject?.slugs.question_character_limit || "";
    const reachedCharLimit =
      e.target.value.length >=
      (globalConfigObject?.questionCharacterLimit || 150);

    setErrors((prevErrors) => ({
      ...prevErrors,
      question: reachedCharLimit ? charLimitSlug : "",
    }));
  };

  return (
    <>
      {showInput ? (
        <div className="px-4">
          <div className="flex justify-end items-center text-links-foreground text-sm mb-2">
            {globalConfigObject?.usageHelpUrl && (
              <>
                <a
                  href={globalConfigObject.usageHelpUrl}
                  target="_blank"
                  onClick={() => pushAnalyticsEvent("help_clicked")}
                >
                  {slugs?.chat_tip_link}
                </a>
                <span className="px-2 "> | </span>
              </>
            )}
            {globalConfigObject?.termsofServiceUrl && (
              <a
                href={globalConfigObject.termsofServiceUrl}
                target="_blank"
                onClick={() => pushAnalyticsEvent("tos_clicked")}
              >
                {slugs?.tc_link}
              </a>
            )}
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex items-center flex-col pb-2"
          >
            <Input
              ref={inputRef}
              type="text"
              name="question"
              value={question}
              onChange={handleOnMessageChange}
              placeholder={slugs?.question_field}
              title={slugs?.send_button}
              submitElement={
                <>
                  <span className="sr-only">{slugs?.send_button}</span>
                  <img src={PaperPlaneIcon} className="block" alt="" />
                </>
              }
              maxLength={globalConfigObject?.questionCharacterLimit || 150}
              errors={errors}
            />
            <span className="text-xs text-disclaimer">
              {slugs?.question_disclaimer}
            </span>
          </form>
        </div>
      ) : (
        <div className="px-4">
          <button
            onClick={() => {
              setShowInput(true);
              pushAnalyticsEvent("restart_clicked");
            }}
            className="relative block mx-auto my-0 mb-6 bg-button text-button-foreground text-xs font-bold h-[29px] rounded-full px-5 before:absolute before:bg-line before:w-[200px] before:h-[1px] before:right-0 before:top-1/2 before:translate-x-full before:-translate-y-1/2 before:pointer-events-none
       after:absolute after:bg-line after:w-[200px] after:h-[1px] after:left-0 after:top-1/2 after:-translate-x-full after:-translate-y-1/2 after:pointer-events-none"
          >
            {slugs?.new_question_button}
          </button>
        </div>
      )}
      <div
        className="flex"
        style={{
          transform: "translateY(100%)",
          background: "#e5e7eb",
          padding: "0.375rem",
          width: "100%",
          position: "absolute",
          bottom: "0",
        }}
      >
        <a
          href="https://webiks.com"
          target="_blank"
          aria-label="בקרו באתר של Webiks, נפתח בכרטיסייה חדשה"
        >
          <img
            src={WebiksLogo}
            alt="לוגו של Webiks"
            style={{ width: "71px" }}
          />
        </a>
      </div>
    </>
  );
};
export default Footer;
