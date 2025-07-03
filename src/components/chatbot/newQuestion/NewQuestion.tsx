import Stars from "@/assets/no-circle-stars.svg";
import "./newQuestion.css"

interface NewQuestionButtonProps {
  onClick: () => void;
}

const NewQuestionButton = ({ onClick }: NewQuestionButtonProps) => {

  const slugs = window.KZChatbotConfig?.slugs;

  return (
    <div className="new-question-section">
      <div className="new-question-divider-container">
        <div className="new-question-divider"></div>
        <div className="new-question-wrapper">
          <button
            onClick={onClick}
          >
            <span className="new-question-button-data">
              <span className="ask-new-question-icon">
                <img src={Stars} alt="שאל שאלה חדשה" />
              </span>
              <span className="ask-new-question-text">
                {slugs?.new_question_button || "שאלה חדשה"}
              </span>
            </span>
          </button>
        </div>
        <div className="new-question-divider"></div>
      </div>
      <div className="new-question-disclaimer">
        הצ'אט לא זוכר תשובות לשאלות קודמות. יש לנסח שאלה חדשה.
      </div>
    </div>
  )
}

export default NewQuestionButton;
