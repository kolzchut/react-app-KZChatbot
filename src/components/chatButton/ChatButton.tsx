import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectIsChatOpen, openChat } from '../../store/slices/chatSlice';
import { useMobile } from '../../lib/useMobile';
import starsIcon from '../../assets/no-circle-stars.svg';
import './chatButton.css';


const MobileComponent = () => (
    <img
        src={starsIcon}
        alt="Stars"
        className="chat-button-icon"
    />
);

const DesktopComponent = () => {
    const chat_description = window.KZChatbotConfig?.slugs.chat_description || 'שאלו את ה-AI שלנו';
    return (
        <span className='button-data'>
            <img
                src={starsIcon}
                alt="Stars"
                className="chat-button-icon"
            />
            <span className="chat-button-text">
                {chat_description}
            </span>
        </span>
    );
};


const ChatButton: React.FC = () => {
    const dispatch = useAppDispatch();
    const isChatOpen = useAppSelector(selectIsChatOpen);
    const isMobile = useMobile();
    const buttonClasses = `chat-button ${isChatOpen ? 'chat-button-disabled' : ''} ${isMobile ? 'chat-button-mobile' : ''}`;

    const handleToggleChat = () => {
        dispatch(openChat());
    };

    return (
        <button
            onClick={handleToggleChat}
            className={buttonClasses}
            disabled={isChatOpen}
        >
            {isMobile ? <MobileComponent /> : <DesktopComponent />}
        </button>
    );
};

export default ChatButton;
