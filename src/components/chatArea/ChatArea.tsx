import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { openChat, selectIsChatOpen } from '@/store/slices/chatSlice';
import { setQuestion } from '@/store/slices/questionSlice';
import { selectActiveConversation, startNewConversation } from '@/store/slices/conversationSlice';
import { pushAnalyticsEvent } from '@/lib/analytics';
import { useTranslation } from '@/hooks/useTranslation';
import { createConversationId } from '@/components/chatbot/chatbotSession';
import Stars from "@/assets/purple-stars.svg";
import './chatArea.css';
import ChatInput from '../chatbot/chatInput/ChatInput';


interface ChatAreaProps {
  isHomePage?: boolean;
}

const ChatArea: React.FC<ChatAreaProps> = ({ isHomePage }) => {
  const dispatch = useAppDispatch();
  const [localQuestion, setLocalQuestion] = useState('');
  const { t } = useTranslation();
  const isChatOpen = useAppSelector(selectIsChatOpen);
  const activeConversation = useAppSelector(selectActiveConversation);
  const hasConversation = Boolean(activeConversation?.messages.some((item) => item.type === 'user'));

  const handleOnMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuestion(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuestion.trim()) {
      pushAnalyticsEvent("opened", "embed");
      dispatch(openChat());
      dispatch(setQuestion({text: localQuestion.trim(), source: "embed"}));
      setLocalQuestion('');
    }
  };

  return (
    <div className={`chat-area-container${isChatOpen ? ' disabled' : ''}${isHomePage ? ' homepage' : ''}`}>
      <div className={`gradient-border-wrapper${isChatOpen ? ' disabled' : ''}${isHomePage ? ' homepage' : ''}`}>
        <div className={`chat-area-container${isChatOpen ? ' disabled' : ''}${isHomePage ? ' homepage' : ''}`}>
          <div className={`chat-area-content${isChatOpen ? ' disabled' : ''}${isHomePage ? ' homepage' : ''}`}>
            <div className="chat-area-header">
              <img src={Stars} alt="AI Bot" className="ai-icon" />
              <span className='chat-description'>{t('chat_description')}</span>
            </div>
            {hasConversation && <span>{t('continue_conversation_mode_hint')}</span>}
            {hasConversation && <div style={{ display: 'flex', gap: '8px' }}><button onClick={() => dispatch(openChat())}>{t('return_to_conversation_button')}</button><button onClick={() => dispatch(startNewConversation({ conversationId: createConversationId(), timestamp: Date.now() }))}>{t('new_conversation_button')}</button></div>}
            <ChatInput
              handleSubmit={handleSubmit}
              question={localQuestion}
              handleOnMessageChange={handleOnMessageChange}
              showHistoryActions={false}
              disabled={isChatOpen}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
