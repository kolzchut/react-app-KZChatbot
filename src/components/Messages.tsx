import { Message, MessageType } from "@/types";
import Rating from "./Rating";
import { TypingIndicator } from "@/components";

interface MessagesProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const Messages = ({
  messages,
  setMessages,
  isLoading,
  messagesEndRef,
}: MessagesProps) => {
  if (!messages) {
    return null;
  }

  return (
    <div className="px-3 flex-1 overflow-auto pb-4">
      {messages.map((message) => (
        <div key={message.id}>
          {message.isFirstQuestion === false && (
            <hr className="h-[1px] border-line left-3 relative w-[calc(100%_+_1.5rem)] my-3" />
          )}
          <div
            className={`text-sm p-3 mb-2 ${
              [MessageType.StartBot, MessageType.Bot].includes(message.type)
                ? "bg-message-bot-background text-message-bot-foreground rounded-[10px_10px_10px_0] mr-6"
                : "bg-message-user-background text-message-user-foreground rounded-[10px_10px_0_10px] ml-[3.8rem]"
            }`}
          >
            {message.content}
          </div>

          {message.type === MessageType.Bot && (
            <>
              {message.links && (
                <div className="bg-message-bot-background text-message-bot-foreground border-r-4 border-message-user-background pr-[5px] py-2 mb-[6px]">
                  <span className="text-sm font-bold text-input-placholder mb-1 inline-block">
                    כדאי לבקר בעמודים האלה:
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
              <Rating message={message} setMessages={setMessages} />
            </>
          )}
        </div>
      ))}
      {isLoading && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default Messages;
