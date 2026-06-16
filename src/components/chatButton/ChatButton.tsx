import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectIsChatOpen, openChat } from '../../store/slices/chatSlice';
import { selectActiveConversation } from '@/store/slices/conversationSlice';
import { useMobile } from '../../lib/useMobile';
import { pushAnalyticsEvent } from '../../lib/analytics';
import { useTranslation } from '@/hooks/useTranslation';
import Stars from '../Stars';
import './chatButton.css';

const MobileComponent = () => <Stars className="chat-button-icon" />;

const DesktopComponent = () => {
    const { t } = useTranslation();
    return (
        <>
            <Stars className="chat-button-icon" />
            <span className="gradient-text">
                {t('chat_description')}
            </span>
        </>
    );
};


const ChatButton: React.FC = () => {
    const dispatch = useAppDispatch();
    const isChatOpen = useAppSelector(selectIsChatOpen);
    const activeConversation = useAppSelector(selectActiveConversation);
    const isMobile = useMobile();

    const handleToggleChat = () => {
        if (activeConversation?.messages.some((item) => item.type === 'user')) {
            pushAnalyticsEvent('conversation_resumed');
        }
        pushAnalyticsEvent("opened", "button");
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
