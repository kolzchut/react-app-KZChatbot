import { Message, MessageType, Errors } from "@/types";
import Rate from "./Rate";
import { TypingIndicator } from "@/components";
import { forwardRef } from "react";
import Markdown from "react-markdown";
import AlertIcon from "@/assets/alert.svg";

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

const Messages = forwardRef<HTMLDivElement, MessagesProps>(
  (
    {
      messages,
      setMessages,
      isLoading,
      onScroll,
      globalConfigObject,
      errors,
      setErrors,
      initialErrors,
    },
    ref,
  ) => {
    if (!messages) {
      return null;
    }

    const getMessageClasses = (messageType: MessageType) => {
      if (
        [MessageType.Bot, MessageType.StartBot, MessageType.Warning].includes(
          messageType,
        )
      ) {
        return "text-sm p-3 mb-2 bg-message-bot-background text-message-bot-foreground rounded-[10px_10px_10px_0] mr-6";
      } else if (messageType === MessageType.User) {
        return "text-sm p-3 mb-2 bg-message-user-background text-message-user-foreground rounded-[10px_10px_0_10px] ml-[3.8rem]";
      } else if (messageType === MessageType.Error) {
        return "flex justify-between text-md px-3 py-4 mb-2 bg-alert text-alert rounded-[10px_10px_10px_0] mr-6";
      }
    };

    return (
      <div
        className="px-4 flex-1 overflow-auto pb-4"
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
                <div className={getMessageClasses(message.type)}>
                  {message.type === MessageType.Bot ? (
                    <Markdown className="markdown">{message.content}</Markdown>
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
                {message.type === MessageType.Bot && (
                  <>
                    {message.links && (
                      <div className="bg-message-bot-background text-message-bot-foreground border-r-4 border-message-user-background pr-[5px] pl-3 py-2 mb-[6px]">
                        <span className="text-sm font-bold text-input-placholder mb-1 inline-block">
                          {globalConfigObject?.slugs?.returning_links_title}
                        </span>
                        <ul className="list-inside">
                          {message.links.map((link, index) => (
                            <li
                              key={index}
                              className="text-sm mb-1 list-image-[url(assets/arrow-left.svg)]"
                            >
                              <a
                                href={link.url}
                                target="_blank"
                                className="text-sm mr-[2px] text-input-placholder"
                              >
                                {link.title}
                              </a>
                            </li>
                          ))}
                        </ul>
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
