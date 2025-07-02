import { Message, MessageType, Errors } from "@/types";
import Rate from "./Rate";
import { TypingIndicator } from "@/components";
import { forwardRef } from "react";
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import AlertIcon from "@/assets/alert.svg";
import Stars from "@/assets/purple-stars.svg";
import { pushAnalyticsEvent } from "@/lib/analytics";

interface MessagesProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  onScroll: () => void;
  globalConfigObject: typeof window.KZChatbotConfig | null;
  errors: Errors;
  setErrors: React.Dispatch<React.SetStateAction<Errors>>;
  initialErrors: Errors;
}

const Messages = forwardRef<HTMLDivElement, MessagesProps>(({
  messages,
  setMessages,
  isLoading,
  onScroll,
  globalConfigObject,
  errors,
  setErrors,
  initialErrors,
}, ref,) => {
  if (!messages) {
    return null;
  }
  console.log("messages", messages)
  const getMessageClasses = (messageType: MessageType) => {
    if (
      [MessageType.Bot, MessageType.StartBot, MessageType.Warning].includes(
        messageType,
      )
    ) {
      return "message-bot-figma";
    } else if (messageType === MessageType.User) {
      return "message-user-figma";
    } else if (messageType === MessageType.Error) {
      return "flex justify-between text-md px-3 py-4 mb-2 bg-alert text-alert rounded-[10px_10px_10px_0] mr-6";
    }
  }; return (
    <div
      className="chat-container"
      onScroll={onScroll}
      ref={ref}
    >
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
                {/* Bot Avatar */}
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
                  {/* AI Disclaimer */}
                  <div className="ai-disclaimer">
                    התשובה מבוססת AI. יש לבדוק את המידע המלא בדפים הבאים:
                  </div>

                  {/* Links Section */}
                  {message.links && message.links.length > 0 && (
                    <div className="links-container">
                      {message.links.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          className="link-card"
                          onClick={() => pushAnalyticsEvent("link_clicked", link.title)}
                        >                            <svg className="link-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.5 4.5h-3A1.5 1.5 0 003 6v7.5A1.5 1.5 0 004.5 15h7.5A1.5 1.5 0 0013.5 13.5v-3M10.5 3h3v3M7.5 10.5l6-6" stroke="var(--kzcb-cyan)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="link-card-text">{link.title}</span>
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
