import { FC } from "react";
import "./typingIndicator.css";



const TypingIndicator: FC = () => {
  return (
    <div>
      <link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet" />

      <div className="bubble">
        <span>מ</span><span>א</span><span>ת</span><span>ר</span><span dangerouslySetInnerHTML={{__html: '&nbsp;'}}></span>
        <span>ת</span><span>ש</span><span>ו</span><span>ב</span><span>ה</span><span dangerouslySetInnerHTML={{__html: '&nbsp;'}}></span>
        <span>ל</span><span>ש</span><span>א</span><span>ל</span><span>ת</span><span>ך</span><span>...</span>
      </div>

    </div>
  );
};

export default TypingIndicator;
