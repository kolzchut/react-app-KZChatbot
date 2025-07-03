import Stars from "@/assets/no-circle-stars.svg";
import "./newQuestion.css"

interface NewQuestionButtonProps {
  onClick: () => void;
}

const NewQuestionButton = ({ onClick }: NewQuestionButtonProps) => {

  const slugs = window.KZChatbotConfig?.slugs;

  return (
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
  )
}

export default NewQuestionButton;
