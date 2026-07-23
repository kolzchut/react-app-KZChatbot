import { useEffect, useRef, useState } from "react";
import { Errors, Message, MessageType } from "@/types.ts";
import { useMobile } from "@/lib/useMobile.ts";
import { useTranslation } from "@/hooks/useTranslation.ts";
import { pushAnalyticsEvent } from "@/lib/analytics.ts";
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { setQuestion, selectQuestion } from '@/store/slices/questionSlice.ts';
import { openChat } from '@/store/slices/chatSlice.ts';
// MOCK PATCH START — demo-only affirmative → static links (see src/mockFollowUp)
import { appendBotMessage, appendUserMessage } from '@/store/slices/conversationSlice.ts';
import { getAffirmativeLinksMessages } from '@/mockFollowUp/mockFollowUp.ts';
// MOCK PATCH END
import ChatInput from "../chatInput/ChatInput.tsx";
import NewQuestion from "../newQuestion/NewQuestion.tsx";
import "./footer.css"

interface FooterProps {
  isLoading: boolean;
  globalConfigObject: typeof window.KZChatbotConfig | null;
  errors: Errors;
  setErrors: React.Dispatch<React.SetStateAction<Errors>>;
  isChatOpen: boolean;
  isQuotaReached?: boolean;
  onDeleteHistoryClick?: () => void;
  showInput?: boolean;
  setShowInput?: (showInput: boolean) => void;
  messages?: Message[];
}

const Footer = ({
  isLoading,
  globalConfigObject,
  errors,
  setErrors,
  isChatOpen,
  isQuotaReached,
  onDeleteHistoryClick,
  showInput = true,
  setShowInput,
  messages = [],
}: FooterProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const reduxQuestion = useAppSelector(selectQuestion);
  const [localQuestion, setLocalQuestion] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMobile();

  useEffect(() => {
    const hasConversationMessages = messages.some((message) => message.type !== MessageType.StartBot);
    if (isMobile && !hasConversationMessages) return;
    if (isChatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobile, inputRef, isChatOpen, messages.length]);

  useEffect(() => {
    if (reduxQuestion === '') {
      setLocalQuestion('');
    } else if (reduxQuestion) {
      setLocalQuestion(reduxQuestion);
    }
  }, [reduxQuestion]);

  // This useEffect is removed to prevent duplicate submissions.
  // The question submission is now handled exclusively by the useEffect in Chatbot.tsx
  // that watches for question changes from Redux.

  if (
    isLoading ||
    (globalConfigObject && globalConfigObject?.questionsPermitted < 1)
  ) {
    return null;
  }
  const handleOnMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuestion(e.target.value);

    const charLimitSlug = t('question_character_limit');
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
    const text = localQuestion.trim();
    if (!text) return;
    // MOCK PATCH START — affirmative reply to a follow-up question shows static links, skips the backend
    const affirmative = getAffirmativeLinksMessages(text, messages);
    if (affirmative) {
      dispatch(appendUserMessage(affirmative.userMessage));
      dispatch(appendBotMessage(affirmative.linksMessage));
      setLocalQuestion('');
      return;
    }
    // MOCK PATCH END
    dispatch(setQuestion({text, source: "popup"}));
    dispatch(openChat());
    setLocalQuestion('');
  };

  if (!showInput) {
    return (
      <NewQuestion
        onClick={() => {
          setShowInput?.(true);
          pushAnalyticsEvent('restart_clicked');
        }}
      />
    );
  }

  return (
    <ChatInput
      question={localQuestion}
      handleSubmit={handleFormSubmit}
      errors={errors}
      disabled={isQuotaReached}
      handleOnMessageChange={handleOnMessageChange}
      onDeleteHistoryClick={onDeleteHistoryClick}
      inputRef={inputRef}
    />
  );
};

export default Footer;
