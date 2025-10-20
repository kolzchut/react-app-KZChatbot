import Stars from "../../Stars";
import "./newQuestion.css"
import infoIcon from "../../../assets/info.svg"
interface NewQuestionButtonProps {
  onClick: () => void;
}

const NewQuestionButton = ({ onClick }: NewQuestionButtonProps) => {

  const slugs = window.KZChatbotConfig?.slugs;

  return (
    <div className="new-question-section">
      <div className="new-question-divider-container">
          <img src={infoIcon} alt={"info icon"}/>
          <div>
              <span className={"new-question-hint"}>{slugs?.new_question_hint || "זוהי גרסה ניסיונית שאינה תומכת בשיחה מתמשכת"}</span>
          </div>
        <div className="new-question-button-border">
          <button
            onClick={onClick}
            className="new-question-gradient-button"
          >
            <Stars className="new-question-icon" />
            <span className="new-question-gradient-text">
              {slugs?.new_question_button || "נסחו שאלה חדשה"}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewQuestionButton;
