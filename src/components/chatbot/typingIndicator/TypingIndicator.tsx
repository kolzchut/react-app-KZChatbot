import { FC } from "react";
import "./typingIndicator.css";


const TypingIndicator: FC = () => {
  const slugs = window.KZChatbotConfig?.slugs || {};
  const typingText = slugs.getting_answer || "מאתר תשובה לשאלתך...";

  return (
    <div>
      <link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet" />
      <div className="bubble">
        {typingText.split('').map((char, index) => (
          <span key={index}>
            {char === ' ' ? <span dangerouslySetInnerHTML={{ __html: '&nbsp;' }}></span> : char}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TypingIndicator;
