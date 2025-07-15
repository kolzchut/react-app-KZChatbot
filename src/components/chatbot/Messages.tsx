import { forwardRef } from "react";
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import { Message, MessageType, Errors } from "@/types";
import { pushAnalyticsEvent } from "@/lib/analytics";
import Rate from "./Rate";
import TypingIndicator from "@/components/chatbot/typingIndicator/TypingIndicator.tsx";
import Link from "@/assets/link.svg"
import AlertIcon from "@/assets/alert.svg";
import Stars from "@/assets/purple-stars.svg";

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
    return "flex justify-between text-md px-3 py-4 mb-2 bg-alert text-alert rounded-[10px_10px_10px_0] mr-6";
  }
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

  return (
    <div className="chat-container" ref={ref}>
      {messages.map(
        (message) =>
          message.content && (
            <div key={message.id}>
              {message.isFirstQuestion === false && (
                <hr className="h-[1px] border-line left-3 relative w-[calc(100%_+_1.5rem)] my-3" />
              )}

              {message.type === MessageType.User ? (
                <div className={getMessageClasses(message.type)}>
                  {message.content}
                </div>
              ) : (<div className="message-bot-container">
                <div className="bot-avatar">
                  <img src={Stars} alt="Bot Avatar" />
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
                      className="w-4 h-4 inline-block ml-2"
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
                          <img src={Link} alt="Link Icon" className="link-icon" />
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
      {isLoading && <TypingIndicator />}
    </div>
  );
},
);

export default Messages;
