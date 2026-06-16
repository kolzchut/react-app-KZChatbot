import React, {useState} from 'react';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {openChat, selectIsChatOpen} from '@/store/slices/chatSlice';
import {setQuestion} from '@/store/slices/questionSlice';
import {startNewConversation} from '@/store/slices/conversationSlice';
import {pushAnalyticsEvent} from '@/lib/analytics';
import {useTranslation} from '@/hooks/useTranslation';
import {useChatDescription} from '@/hooks/useChatDescription';
import {createConversationId} from '@/components/chatbot/chatbotSession';
import Stars from "@/assets/purple-stars.svg";
import './chatArea.css';
import ChatInput from '../chatbot/chatInput/ChatInput';
import returnIcon from "@/assets/back-sign.svg"
import staticChatIcon from "@/assets/static-chat.svg"

interface ChatAreaProps {
    isHomePage?: boolean;
}

const ChatArea: React.FC<ChatAreaProps> = ({isHomePage}) => {
    const dispatch = useAppDispatch();
    const [localQuestion, setLocalQuestion] = useState('');
    const {t} = useTranslation();
    const isChatOpen = useAppSelector(selectIsChatOpen);
    const {hasConversation, chatDescription} = useChatDescription();

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
    const handleNewConversation = () => {
        const newConversation = {
            conversationId: createConversationId(),
            timestamp: Date.now(),
        };

        dispatch(startNewConversation(newConversation));
        dispatch(openChat());
    };
    return (
        <div className={`chat-area-container${isChatOpen ? ' disabled' : ''}${isHomePage ? ' homepage' : ''}`}>
            <div className={`gradient-border-wrapper${isChatOpen ? ' disabled' : ''}${isHomePage ? ' homepage' : ''}`}>
                <div className={`chat-area-container${isChatOpen ? ' disabled' : ''}${isHomePage ? ' homepage' : ''}`}>
                    <div
                        className={`chat-area-content${isChatOpen ? ' disabled' : ''}${isHomePage ? ' homepage' : ''}`}>
                        <div className={`chat-area-top`}>
                            <div className="chat-area-header">
                                <img src={Stars} alt="AI Bot" className="ai-icon"/>
                                <span className='chat-description'>{chatDescription}</span>
                            </div>
                        {hasConversation && <div className="conversation-actions">
                            <button className="btn-return-conversation" onClick={() => dispatch(openChat())}>
                                <img src={returnIcon} alt="Return Icon"/>
                                <span>{t('return_to_conversation_button')}</span>
                            </button>
                            <button className="btn-new-conversation" onClick={() => handleNewConversation()}>
                                <img src={staticChatIcon} alt="Static Chat Icon"/>
                                <span>{t('new_conversation_button')}</span>
                            </button>

                        </div>}
                        </div>
                        {hasConversation && <div className="chat-area-mode-hint-div">
                        <span className={'chat-area-mode-hint-span'}>{t('continue_conversation_mode_hint')}</span>
                        </div>}
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
