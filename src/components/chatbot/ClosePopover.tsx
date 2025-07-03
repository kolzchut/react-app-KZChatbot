import CloseHeaderIcon from "@/assets/close-header.svg";
import Stars from "@/assets/purple-stars.svg";
import "../../index.css"

interface ClosePopoverProps {
  globalConfigObject: typeof window.KZChatbotConfig | null;
  handleChatSetIsOpen: (isOpen: boolean) => void;
}

const ClosePopover = ({ globalConfigObject, handleChatSetIsOpen }: ClosePopoverProps) => {
	const slugs = globalConfigObject?.slugs;

	return (
    <div className="chat-header">
      <div className="header-title-section">
        <div className="ai-icon-container">
          <img src={Stars} alt="AI Bot" className="ai-icon" />
        </div>
        <h1 className="header-title">
          {slugs?.ask_ai}
        </h1>
      </div>

      <button 
        onClick={() => handleChatSetIsOpen(false)} 
        aria-label={slugs?.close_chat_icon || "סגור צ'אט"} 
        title={slugs?.close_chat_icon || "סגור צ'אט"}
        className="close-button"
      >
        <img src={CloseHeaderIcon} alt="סגור" className="close-icon" />
      </button>
    </div>
  );
};

export default ClosePopover;
