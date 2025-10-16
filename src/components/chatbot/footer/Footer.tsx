import { useEffect, useRef, useState } from "react";
import { Errors, Message } from "@/types.ts";
import { useMobile } from "@/lib/useMobile.ts";
import { pushAnalyticsEvent } from "@/lib/analytics.ts";
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { setQuestion, selectQuestion } from '@/store/slices/questionSlice.ts';
import { openChat } from '@/store/slices/chatSlice.ts';
import NewQuestion from "../newQuestion/NewQuestion.tsx";
import ChatInput from "../chatInput/ChatInput.tsx";
import "./footer.css"

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

    if (isChatOpen && showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobile, inputRef, showInput, isChatOpen, messages]);

  useEffect(() => {
    if (reduxQuestion === '') {
      setLocalQuestion('');
      sessionStorage.removeItem(submittedKey);
    } else if (reduxQuestion && localQuestion !== reduxQuestion) {
      setLocalQuestion(reduxQuestion);
    }
  }, [reduxQuestion, localQuestion]);

  useEffect(() => {
    const submitted = sessionStorage.getItem(submittedKey);
    if (
      reduxQuestion &&
      reduxQuestion.trim() &&
      submitted !== reduxQuestion
    ) {
      const fakeEvent = {
        preventDefault: () => { },
        target: {
          elements: {
            namedItem: () => ({ value: reduxQuestion })
          }
        }
      } as unknown as React.FormEvent<HTMLFormElement>;

      handleSubmit(fakeEvent);
      sessionStorage.setItem(submittedKey, reduxQuestion);
    }
  }, [reduxQuestion, handleSubmit]);

  if (
    isLoading ||
    (globalConfigObject && globalConfigObject?.questionsPermitted < 1)
  ) {
    return null;
  }
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
      dispatch(setQuestion({text: localQuestion.trim()}));
      dispatch(openChat());
      setLocalQuestion('');
    }
  };

  return (
    <>
      {showInput ? (
        <ChatInput
          question={localQuestion}
          handleSubmit={handleFormSubmit}
          errors={errors}
          handleOnMessageChange={handleOnMessageChange}
          inputRef={inputRef} />
      ) : (
        <NewQuestion onClick={() => {
          setShowInput(true);
          pushAnalyticsEvent("restart_clicked");
        }} />
      )}
    </>
  );
};

export default Footer;
