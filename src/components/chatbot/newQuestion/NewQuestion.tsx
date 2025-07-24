import Stars from "../../Stars";
import "./newQuestion.css"

interface NewQuestionButtonProps {
  onClick: () => void;
}

const NewQuestionButton = ({ onClick }: NewQuestionButtonProps) => {

  const slugs = window.KZChatbotConfig?.slugs;

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
              {slugs?.new_question_button || "שאלה חדשה"}
            </span>
          </button>
        </div>
        <div className="new-question-divider-end"></div>
      </div>
      <div className="new-question-disclaimer">
        הצ'אט לא זוכר תשובות לשאלות קודמות. יש לנסח שאלה חדשה.
      </div>
    </div>
  )
}

export default NewQuestionButton;
