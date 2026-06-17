import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Errors, Message, MessageType } from '@/types';
import { formatAdminString } from '@/lib/utils';
import { pushAnalyticsEvent } from '@/lib/analytics';
import { useTranslation } from '@/hooks/useTranslation';
import Rate from '@/components/chatbot/Rate';
import LinkIcon from '@/assets/link.svg';
import AlertIcon from '@/assets/alert.svg';
import Stars from '@/assets/purple-stars.svg';

interface MessageBlockProps {
    message: Message;
    isReadonly: boolean;
    onStartNewConversation: () => void;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    globalConfigObject: typeof window.KZChatbotConfig | null;
    errors: Errors;
    setErrors: React.Dispatch<React.SetStateAction<Errors>>;
    initialErrors: Errors;
    isLoading: boolean;
}

const getMessageClass = (type: MessageType): string => {
    if ([MessageType.Bot, MessageType.StartBot, MessageType.Warning, MessageType.System].includes(type)) return 'message-bot-block';
    if (type === MessageType.User) return 'message-user-block';
    return 'message-error';
};

export const MessageBlock = ({ message, isReadonly, onStartNewConversation, setMessages, globalConfigObject, errors, setErrors, initialErrors, isLoading }: MessageBlockProps) => {
    const { t } = useTranslation();
    const isBotAnswer = message.type === MessageType.Bot;
    const isQuotaMessage = message.type === MessageType.System && message.systemAction === 'quota_reached';
    const newConversationText = t('new_conversation_button');

    const renderQuotaMessage = () => {
        const linkIndex = message.content.lastIndexOf(newConversationText);
        if (linkIndex === -1) {
            return (
                <>
                    {message.content}{' '}
                    <button type="button" onClick={onStartNewConversation} className="quota-new-conversation-link" disabled={isLoading}>
                        {newConversationText}
                    </button>
                </>
            );
        }

        return (
            <>
                {message.content.slice(0, linkIndex)}
                <button type="button" onClick={onStartNewConversation} className="quota-new-conversation-link" disabled={isLoading}>
                    {newConversationText}
                </button>
                {message.content.slice(linkIndex + newConversationText.length)}
            </>
        );
    };

    const renderMessageContent = () => {
        if (isBotAnswer) {
            return <Markdown remarkPlugins={[remarkGfm]} className="markdown">{message.content}</Markdown>;
        }

        if (isQuotaMessage) {
            return renderQuotaMessage();
        }

        if (message.formattedContent) {
            return <span dangerouslySetInnerHTML={{ __html: formatAdminString(message.content) }} />;
        }

        return message.content;
    };

    return (
        <div>
            {message.type === MessageType.User && (
                <div className={getMessageClass(message.type)}>{message.content}</div>
            )}

            {message.type !== MessageType.User && (
                <div className="message-bot-container">
                    <div className="bot-avatar">
                        <img src={Stars} alt="Bot Avatar" />
                    </div>
                    <div className={`${getMessageClass(message.type)}${isQuotaMessage ? ' quota-message-block' : ''}`}>
                        {renderMessageContent()}
                        {message.type === MessageType.Error && <img src={AlertIcon} alt="Alert Icon" className="message-error-icon" />}
                    </div>
                </div>
            )}

            {isBotAnswer && (
                <>
                    {message.links && message.links.length > 0 && <div className="ai-disclaimer">{t('returning_links_title')}</div>}
                    {(!message.links || message.links.length === 0) && <div className="ai-disclaimer">{t('returning_links_no_links')}</div>}
                    {message.links && message.links.length > 0 && (
                        <div className="links-container">
                            {message.links.map((link, index) => (
                                <a key={index} href={link.url} target="_blank" rel="noreferrer" className="link-card" onClick={() => pushAnalyticsEvent('link_clicked', link.title)}>
                                    <span className="link-card-text">{link.title}</span>
                                    <img src={LinkIcon} alt="Link Icon" className="link-icon" />
                                </a>
                            ))}
                        </div>
                    )}
                    {!isReadonly && (
                        <div>
                            <Rate message={message} setMessages={setMessages} globalConfigObject={globalConfigObject} errors={errors} setErrors={setErrors} initialErrors={initialErrors} />
                        </div>
                    )}
                    {isReadonly && (
                        <div style={{ pointerEvents: 'none', opacity: 0.6 }}>
                            <Rate message={message} setMessages={setMessages} globalConfigObject={globalConfigObject} errors={errors} setErrors={setErrors} initialErrors={initialErrors} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
