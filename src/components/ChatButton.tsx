import React from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectIsChatOpen, openChat } from '../store/slices/chatSlice';
import { useMobile } from '../lib/useMobile';
import './chatButton.css';
import starsIcon from '../assets/no-circle-stars.svg';


const ChatButton: React.FC = () => {
    const dispatch = useAppDispatch();
    const isChatOpen = useAppSelector(selectIsChatOpen);
    const isMobile = useMobile();
    const slugs = window.KZChatbotConfig?.slugs;

    const handleToggleChat = () => {
        dispatch(openChat());
    };

    return (
        <button
            onClick={handleToggleChat}
            className={`chat-button ${isChatOpen ? 'chat-button-disabled' : ''} ${isMobile ? 'chat-button-mobile' : ''}`}
            aria-label="Open chat"
            disabled={isChatOpen}
        >
            {isMobile ? (
                <img
                    src={starsIcon}
                    alt="Stars"
                    className="chat-button-icon"
                />
            ) : (
                <span className='button-data'>
                    <img
                        src={starsIcon}
                        alt="Stars"
                        className="chat-button-icon"
                    />
                    <span className="chat-button-text">
                        {slugs.ask_ai}
                    </span>
                </span>
            )}
        </button>
    );
};

export default ChatButton;