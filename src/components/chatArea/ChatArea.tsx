import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { openChat, selectIsChatOpen } from '@/store/slices/chatSlice';
import { setQuestion } from '@/store/slices/questionSlice';
import Stars from "@/assets/purple-stars.svg";
import './chatArea.css';
import ChatInput from '../chatbot/chatInput/ChatInput';


const ChatArea: React.FC = () => {
  const dispatch = useAppDispatch();
  const [localQuestion, setLocalQuestion] = useState('');
  const slugs = window.KZChatbotConfig.slugs;
  const isChatOpen = useAppSelector(selectIsChatOpen);

  const handleOnMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuestion(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuestion.trim()) {
      dispatch(openChat());
      dispatch(setQuestion(localQuestion.trim()));
      setLocalQuestion('');
    }
  };

  return (
    <div className={`chat-area-container${isChatOpen ? ' disabled' : ''}`}>
      <div className={`gradient-border-wrapper${isChatOpen ? ' disabled' : ''}`}>
        <div className={`chat-area-container${isChatOpen ? ' disabled' : ''}`}>
          <div className={`chat-area-content${isChatOpen ? ' disabled' : ''}`}>
            <div className="chat-area-header">
              <img src={Stars} alt="AI Bot" className="ai-icon" />
              <span>{slugs.chat_description}</span>
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
