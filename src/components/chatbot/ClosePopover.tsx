import { useTranslation } from "@/hooks/useTranslation";
import CloseHeaderIcon from "@/assets/close-header.svg";
import Stars from "@/assets/purple-stars.svg";
import NewConversationButton from "./NewConversationButton";
import "../../index.css"
import "./closePopover.css"

interface ClosePopoverProps {
  handleChatSetIsOpen: (isOpen: boolean) => void;
  onStartNewConversation: () => void;
  disableNewConversation: boolean;
}

const ClosePopover = ({ handleChatSetIsOpen, onStartNewConversation, disableNewConversation }: ClosePopoverProps) => {
	const { t } = useTranslation();

	return (
    <div className="chat-header">
      <div className="header-title-section">
        <div className="ai-icon-container">
          <img src={Stars} alt="AI Bot" className="ai-icon" />
        </div>
        <h1 className="header-title">
          {t('chat_description')}
        </h1>
      </div>

      <NewConversationButton
        onClick={onStartNewConversation}
        disabled={disableNewConversation}
      />

      <button
        onClick={() => handleChatSetIsOpen(false)}
        aria-label={t('close_chat_icon')}
        title={t('close_chat_icon')}
        className="close-button"
      >
        <img src={CloseHeaderIcon} alt={t('close_chat_icon')} className="close-icon" />
      </button>
    </div>
  );
};

export default ClosePopover;
