import { useEffect, useRef } from "react";
import { Errors, Message } from "@/types";
import { useRate } from "@/lib/useRate";
import LikeIcon from "@/assets/like.svg"
import PressedLikeIcon from "@/assets/pressed-like.svg"
import XIcon from "@/assets/x.svg";
import "./footer/footer.css"

interface RateProps {
	message: Message;
	setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
	globalConfigObject: typeof window.KZChatbotConfig | null;
	errors: Errors;
	setErrors: React.Dispatch<React.SetStateAction<Errors>>;
	initialErrors: Errors;
}

const Rate = ({
	message,
	setMessages,
	globalConfigObject,
	errors,
	setErrors,
	initialErrors,
}: RateProps) => {
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const {
		values,
		isFeedbackSubmitted,
		handleChange,
		handleSubmit,
		rateIsOpen,
		setRateIsOpen,
		isFormValid,
		handleRate,
		handleCloseRate,
	} = useRate({
		globalConfigObject,
		message,
		setMessages,
		textareaRef,
		setErrors,
		errors,
		initialErrors,
	});

	const slugs = globalConfigObject?.slugs;
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isFeedbackSubmitted) return;

		if (message.liked === null || message.liked === undefined) {
			setRateIsOpen(false);
		} else {
			setRateIsOpen(true);
		}
	}, [message, isFeedbackSubmitted, setRateIsOpen]);

	useEffect(() => {
		if (rateIsOpen) {
			ref.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [rateIsOpen]);
	return (
		<div ref={ref} className="rating-container">
			<div className="rating-visible">
				<div className="rating-text">
				{slugs?.ranking_request || "האם התשובה עזרה לך?"}
				</div>

				<button
					disabled={isFeedbackSubmitted}
					aria-pressed={message.liked === true}
					className="rating-icon"
					onClick={() => handleRate(message.liked === true ? null : true)}
				>
					<img src={message.liked ? PressedLikeIcon : LikeIcon} alt="like" />
				</button>

				<button
					disabled={isFeedbackSubmitted}
					aria-pressed={message.liked === false}
					className="rating-icon rating-icon-rotated"
					onClick={() => handleRate(message.liked === false ? null : false)}
				>
					<img src={message.liked === false ? PressedLikeIcon : LikeIcon} alt="dislike" />
				</button>
			</div>

			{rateIsOpen && (
				<form className="rating-form" onSubmit={handleSubmit}>
					<div className="rate-form-header">
						<span className="rate-form-header-text">
							{message.liked
								? slugs?.like_follow_up_question
								: slugs?.dislike_follow_up_question}
						</span>
						<button onClick={handleCloseRate}>
							<img src={XIcon} alt="x icon" />
						</button>
					</div>
					<div className="rate-textarea-container">
						<textarea
							name="description"
							className="rate-textarea"
							style={{
								resize: "none",
							}}
							value={values.description}
							onChange={handleChange}
							ref={textareaRef}
							rows={3}
							placeholder={
								message.liked
									? slugs?.like_free_text
									: slugs?.dislike_free_text
							}
							maxLength={globalConfigObject?.feedbackCharacterLimit || 150}
						/>
						{errors.description && (
							<p
								className="rate-error-message"
								role="alert"
							>
								{errors.description}
							</p>
						)}
					</div>
					<div className="rate-form-footer">
						<span className="rate-disclaimer">
							{slugs?.feedback_free_text_disclaimer}
						</span>
						<button disabled={!isFormValid} type="submit">
							<div className={`button-layout ${isFormValid ? "" : "disabled"}`}>
								<span className={`send-button ${isFormValid ? "" : "disabled"}`}>
									<span className={`button-text ${isFormValid ? "" : "disabled"}`}>{slugs?.send_button || "שליחה"}</span>
								</span>
							</div>
						</button>
					</div>
				</form>
			)}
		</div>
	);
};

export default Rate;
