import { useEffect, useRef } from "react";
import { Errors, Message } from "@/types";
import { useRate } from "@/lib/useRate";
import { useTranslation } from "@/hooks/useTranslation";
import LikeIcon from "@/assets/like.svg"
import PressedLikeIcon from "@/assets/pressed-like.svg"
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
	const { t } = useTranslation();
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
	} = useRate({
		globalConfigObject,
		message,
		setMessages,
		textareaRef,
		setErrors,
		errors,
		initialErrors,
	});

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
				{t('ranking_request')}
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
								? t('like_follow_up_question')
								: t('dislike_follow_up_question')}
						</span>
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
									? t('like_free_text')
									: t('dislike_free_text')
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
							{t('feedback_free_text_disclaimer')}
						</span>
						<button disabled={!isFormValid} type="submit">
							<div className={`button-layout ${isFormValid ? "" : "disabled"}`}>
								<span className={`send-button ${isFormValid ? "" : "disabled"}`}>
									<span className={`button-text ${isFormValid ? "" : "disabled"}`}>{t('send_button')}</span>
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
