import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectIsChatOpen, openChat } from '../../store/slices/chatSlice';
import { useMobile } from '../../lib/useMobile';
import Stars from '../Stars';
import './chatButton.css';

const MobileComponent = () => <Stars className="chat-button-icon" />;

const DesktopComponent = () => {
    const chat_description = window.KZChatbotConfig?.slugs.chat_description || 'שאלו את ה-AI שלנו';
    return (
        <>
            <Stars className="chat-button-icon" />
            <span className="gradient-text">
                {chat_description}
            </span>
        </>
    );
};


const ChatButton: React.FC = () => {
    const dispatch = useAppDispatch();
    const isChatOpen = useAppSelector(selectIsChatOpen);
    const isMobile = useMobile();

    const handleToggleChat = () => {
        dispatch(openChat());
    };

    if (isMobile) {
        return (
            <button
                onClick={handleToggleChat}
                className={`chat-button-mobile ${isChatOpen ? 'chat-button-disabled' : ''}`}
                disabled={isChatOpen}
            >
                <MobileComponent />
            </button>
        );
    }

    return (
        <div className="button-border">
            <button
                onClick={handleToggleChat}
                className={`gradient-button ${isChatOpen ? 'chat-button-disabled' : ''}`}
                disabled={isChatOpen}
            >
                <DesktopComponent />
            </button>
        </div>
    );
};

export default ChatButton;
