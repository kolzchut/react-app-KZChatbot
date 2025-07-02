import { Errors, Message } from "@/types";
import { useEffect, useRef, useState } from "react";
import { useMobile } from "@/lib/useMobile";
import { pushAnalyticsEvent } from "@/lib/analytics";
import WebiksLogo from "@/assets/webiks-logo.svg";
import ChatInput from "./ChatInput";
import "./chatInput.css";
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setQuestion, selectQuestion } from '@/store/slices/questionSlice';
import { openChat } from '@/store/slices/chatSlice';

interface FooterProps {
  isLoading: boolean;
  showInput: boolean;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  setShowInput: React.Dispatch<React.SetStateAction<boolean>>;
  globalConfigObject: typeof window.KZChatbotConfig | null;
  errors: Errors;
  setErrors: React.Dispatch<React.SetStateAction<Errors>>;
  messages: Message[];
  isChatOpen: boolean;
}

const Footer = ({
  isLoading,
  showInput,
  handleSubmit,
  setShowInput,
  globalConfigObject,
  errors,
  setErrors,
  messages,
  isChatOpen,
}: FooterProps) => {
  const dispatch = useAppDispatch();
  const reduxQuestion = useAppSelector(selectQuestion);
  const [localQuestion, setLocalQuestion] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMobile();

  // Persist submitted question in sessionStorage to prevent duplicate submission
  const submittedKey = 'chatbot_submitted_question';


  useEffect(() => {
    let isBotStarted = true;
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].type === undefined || messages[i].type !== "startBot") {
        isBotStarted = false;
        break;
      }
    }
    if (isMobile && isBotStarted) return;

    if (isChatOpen && showInput && inputRef.current && messages.length) {
      inputRef.current.focus();
    }
  }, [isMobile, inputRef, showInput, messages, isChatOpen]);

  // Clear local state when Redux state is reset
  useEffect(() => {
    if (reduxQuestion === '') {
      setLocalQuestion('');
      sessionStorage.removeItem(submittedKey);
    }
  }, [reduxQuestion]);

  // Handle submission when Redux question is set
  useEffect(() => {
    const submitted = sessionStorage.getItem(submittedKey);
    if (
      reduxQuestion &&
      reduxQuestion.trim() &&
      submitted !== reduxQuestion
    ) {
      // Create a fake form event to pass to handleSubmit
      const fakeEvent = {
        preventDefault: () => {},
        target: {
          elements: {
            namedItem: () => ({ value: reduxQuestion })
          }
        }
      } as unknown as React.FormEvent<HTMLFormElement>;

      handleSubmit(fakeEvent);
      sessionStorage.setItem(submittedKey, reduxQuestion);
    }
  }, [reduxQuestion]);

  if (
    isLoading ||
    (globalConfigObject && globalConfigObject?.questionsPermitted < 1)
  ) {
    return null;
  }
  const slugs = window.KZChatbotConfig.slugs;
  const handleOnMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuestion(e.target.value);

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

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (localQuestion.trim()) {
      // First, save to Redux store and open chat
      dispatch(setQuestion(localQuestion.trim()));
      dispatch(openChat());
      // Clear local state immediately
      setLocalQuestion('');
      // The useEffect will handle calling handleSubmit when Redux state updates
    }
  };

  return (
    <>
      {showInput ? (
        <ChatInput question={localQuestion} handleSubmit={handleFormSubmit} errors={errors} handleOnMessageChange={handleOnMessageChange} />
      ) : (
        <div className="new-question-section">
          <div className="new-question-divider-container">
            <div className="new-question-divider"></div>
            <button
              onClick={() => {
                setShowInput(true);
                pushAnalyticsEvent("restart_clicked");
              }}
              className="new-question-button"
            >
              <div className="new-question-icon">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="16" fill="url(#gradient)" />
                  <path d="M16 10v12m-6-6h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="11.952%" stopColor="#3284ff" />
                      <stop offset="83.062%" stopColor="#d65cff" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>              <span className="new-question-button-text">
                {slugs?.new_question_button || "שאלה חדשה"}
              </span>
            </button>
            <div className="new-question-divider"></div>
          </div>
          <div className="new-question-disclaimer">
            הצ'אט לא זוכר תשובות לשאלות קודמות. יש לנסח שאלה חדשה.
          </div>
        </div>
      )}
      <div
      //TODO: fix it
        className="flex"
        style={{
          // transform: "translateY(100%)",
          background: "#e5e7eb",
          // padding: "0.375rem",
          // width: "100%",
          height: "50px",
          // position: "absolute",
          // bottom: "0",
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
