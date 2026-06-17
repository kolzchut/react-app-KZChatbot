import {forwardRef} from "react";
import { Message, Errors } from "@/types";
import TypingIndicator from "@/components/chatbot/typingIndicator/TypingIndicator.tsx";
import { ConversationItem } from '@/store/slices/conversationTypes';
import { MessageBlock } from './messages/MessageBlock';
import { useTranslation } from '@/hooks/useTranslation';
import "./Messages.css";

interface MessagesProps {
  activeMessages?: Message[];
  messages?: Message[];
  archivedConversations?: ConversationItem[];
  onStartNewConversation?: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  globalConfigObject: typeof window.KZChatbotConfig | null;
  errors: Errors;
  setErrors: React.Dispatch<React.SetStateAction<Errors>>;
  initialErrors: Errors;
  separatorRef?: React.RefObject<HTMLDivElement>;
  messagesBoxRef?: React.RefObject<HTMLDivElement>;
}

const Messages = forwardRef<HTMLDivElement, MessagesProps>(({
  activeMessages,
  messages,
  archivedConversations = [],
  onStartNewConversation,
  setMessages,
  isLoading,
  globalConfigObject,
  errors,
  setErrors,
  initialErrors,
  separatorRef,
    messagesBoxRef,
}, ref) => {
  const { t } = useTranslation();
  const currentMessages = activeMessages ?? messages;

  if (!currentMessages) {
    return null;
  }

  const hasHistory = archivedConversations.length > 0;
  const archivedMessages = archivedConversations.flatMap((item) => item.messages);
  const hasActiveMessages = currentMessages.filter((item) => item.content).length > 0;

  const setContainerRef = (node: HTMLDivElement | null) => {
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
    if (messagesBoxRef) {
      (messagesBoxRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };


  return (
    <div className="chat-container" ref={setContainerRef}>
      {(!hasHistory || hasActiveMessages) && <div className="flex-spacer" />}
      {archivedMessages.filter((item) => item.content).map((message) => (
        <MessageBlock
          key={`archived-${message.id}`}
          message={message}
          isReadonly={true}
          onStartNewConversation={onStartNewConversation ?? (() => undefined)}
          setMessages={setMessages}
          globalConfigObject={globalConfigObject}
          errors={errors}
          setErrors={setErrors}
          initialErrors={initialErrors}
          isLoading={isLoading}
        />
      ))}
      {hasHistory && <div className="conversation-separator" ref={separatorRef}><span>{t('previous_conversations_button')}</span></div>}
      {hasHistory && !hasActiveMessages && <div className="conversation-new-spacer" />}
      {currentMessages.filter((item) => item.content).map((message) => (
        <MessageBlock
          key={`active-${message.id}`}
          message={message}
          isReadonly={false}
          onStartNewConversation={onStartNewConversation ?? (() => undefined)}
          setMessages={setMessages}
          globalConfigObject={globalConfigObject}
          errors={errors}
          setErrors={setErrors}
          initialErrors={initialErrors}
          isLoading={isLoading}
        />
      ))}
      {isLoading && <TypingIndicator />}
    </div>
  );
},
);

export default Messages;
