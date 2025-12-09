import { FC } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import Stars from "@/assets/purple-stars.svg";
import "./typingIndicator.css";


const TypingIndicator: FC = () => {
  const { t } = useTranslation();
  const typingText = t('getting_answer');

  return (
    <div className="message-bot-container">
      <link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet" />
      <div className="bot-avatar">
        <img src={Stars} alt="Bot Avatar" />
      </div>
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
