import {forwardRef} from "react";
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import {Message, MessageType, Errors} from "@/types";
import {pushAnalyticsEvent} from "@/lib/analytics";
import Rate from "./Rate";
import TypingIndicator from "@/components/chatbot/typingIndicator/TypingIndicator.tsx";
import Link from "@/assets/link.svg"
import AlertIcon from "@/assets/alert.svg";
import Stars from "@/assets/purple-stars.svg";
import "./Messages.css";
import historyIcon from "../../assets/history.svg"


interface MessagesProps {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    isLoading: boolean;
    globalConfigObject: typeof window.KZChatbotConfig | null;
    errors: Errors;
    setErrors: React.Dispatch<React.SetStateAction<Errors>>;
    initialErrors: Errors;
}

const getMessageClasses = (messageType: MessageType) => {
    if (
        [MessageType.Bot, MessageType.StartBot, MessageType.Warning].includes(
            messageType,
        )
    ) {
        return "message-bot-block";
    } else if (messageType === MessageType.User) {
        return "message-user-block";
    } else if (messageType === MessageType.Error) {
        return "message-error";
    }
};

const getLastUserMessageId = (messages: Message[]): string => {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].type === MessageType.User) {
            return messages[i].id;
        }
    }
    return "";
};

const Messages = forwardRef<HTMLDivElement, MessagesProps>(({
                                                                messages,
                                                                setMessages,
                                                                isLoading,
                                                                globalConfigObject,
                                                                errors,
                                                                setErrors,
                                                                initialErrors,
                                                            }, ref,) => {
        if (!messages) {
            return null;
        }

        const lastUserMessageId = getLastUserMessageId(messages);
        return (
            <div className="chat-container" ref={ref}>
                <div className="flex-spacer"></div>
                {messages.map(
                    (message) =>
                        message.content && (
                            <div key={message.id}>
                                {messages.length > 3 && message.id === lastUserMessageId && (
                                    <div className="old-questions-divider-div">
                                        <div className="old-questions-divider"/>
                                        <div className="old-questions-div-holder">
                                            <img src={historyIcon} alt={"History Icon"}/>
                                            <span>שאלות קודמות</span>
                                        </div>
                                        <div className="old-questions-divider"/>
                                    </div>
                                )}
                                {message.type === MessageType.User ? (
                                    <div className={getMessageClasses(message.type)}>
                                        {message.content}
                                    </div>
                                ) : (<div className="message-bot-container">
                                        <div className="bot-avatar">
                                            <img src={Stars} alt="Bot Avatar"/>
                                        </div>

                                        <div className={getMessageClasses(message.type)}>
                                            {message.type === MessageType.Bot ? (
                                                <Markdown
                                                    remarkPlugins={[remarkGfm]}
                                                    className="markdown">{message.content}</Markdown>
                                            ) : (
                                                message.content
                                            )}
                                            {message.type === MessageType.Error && (
                                                <img
                                                    src={AlertIcon}
                                                    alt="Alert Icon"
                                                    className="message-error-icon"
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {message.type === MessageType.Bot && (
                                    <>
                                        <div className="ai-disclaimer">
                                            התשובה מבוססת AI. יש לבדוק את המידע המלא בדפים הבאים:
                                        </div>

                                        {message.links && message.links.length > 0 && (
                                            <div className="links-container">
                                                {message.links.map((link, index) => (
                                                    <a
                                                        key={index}
                                                        href={link.url}
                                                        target="_blank"
                                                        className="link-card"
                                                        onClick={() => pushAnalyticsEvent("link_clicked", link.title)}
                                                    >
                                                        <span className="link-card-text">{link.title}</span>
                                                        <img src={Link} alt="Link Icon" className="link-icon"/>
                                                    </a>
                                                ))}
                                            </div>
                                        )}

                                        <Rate
                                            message={message}
                                            setMessages={setMessages}
                                            globalConfigObject={globalConfigObject}
                                            errors={errors}
                                            setErrors={setErrors}
                                            initialErrors={initialErrors}
                                        />
                                    </>
                                )}
                            </div>
                        ),
                )}
                {isLoading && <TypingIndicator/>}
            </div>
        );
    },
);

export default Messages;
