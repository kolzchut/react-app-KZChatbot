import Stars from "../../Stars";
import { useTranslation } from "@/hooks/useTranslation";
import "./newQuestion.css"

interface NewQuestionButtonProps {
  onClick: () => void;
}

const NewQuestionButton = ({ onClick }: NewQuestionButtonProps) => {
  const { t } = useTranslation();

  return (
    <div className="new-question-section">
      <div className="new-question-divider-container">
        <div className="new-question-divider-start"></div>
        <div className="new-question-button-border">
          <button
            onClick={onClick}
            className="new-question-gradient-button"
          >
            <Stars className="new-question-icon" />
            <span className="new-question-gradient-text">
              {t('new_question_button')}
            </span>
          </button>
        </div>
        <div className="new-question-divider-end"></div>
      </div>
      <div className="new-question-disclaimer">
        {t('new_question_hint')}
      </div>
    </div>
  )
}

export default NewQuestionButton;
