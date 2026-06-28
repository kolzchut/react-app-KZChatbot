import { FC } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import Stars from "@/assets/purple-stars.svg";
import "./typingIndicator.css";


const TypingIndicator: FC = () => {
  const { t } = useTranslation();
  const typingText = t('getting_answer');

  return (
    <div className="message-bot-container" role="status" aria-live="polite">
      <div className="bot-avatar">
        <img src={Stars} alt="" aria-hidden="true" />
      </div>
      <span className="sr-only">{typingText}</span>
      <div className="bubble" aria-hidden="true">
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
