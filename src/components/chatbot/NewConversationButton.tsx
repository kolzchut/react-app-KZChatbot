import NewConversationIconGradient from "@/assets/new-conversation-icon-gradient.svg";
import NewConversationIconWhite from "@/assets/new-conversation-icon-white.svg";
import { useTranslation } from "@/hooks/useTranslation";
import "./closePopover.css";

interface NewConversationButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const NewConversationButton = ({ onClick, disabled = false }: NewConversationButtonProps) => {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      className="header-new-conversation-button"
      disabled={disabled}
    >
      <span className="btn-text">{t('new_conversation_button')}</span>
      <div className="icon-container">
        <img src={NewConversationIconGradient} className="icon-grad" alt="" />
        <img src={NewConversationIconWhite} className="icon-white" alt="" />
      </div>
    </button>
  );
};

export default NewConversationButton;
