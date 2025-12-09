import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { openChat, selectIsChatOpen } from '@/store/slices/chatSlice';
import { setQuestion } from '@/store/slices/questionSlice';
import { pushAnalyticsEvent } from '@/lib/analytics';
import { useTranslation } from '@/hooks/useTranslation';
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

  const handleOnMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuestion(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuestion.trim()) {
      pushAnalyticsEvent("opened", null, "embed");
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
            <ChatInput
              handleSubmit={handleSubmit}
              question={localQuestion}
              handleOnMessageChange={handleOnMessageChange}
              disabled={isChatOpen}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
