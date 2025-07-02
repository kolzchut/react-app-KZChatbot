import XIcon from "@/assets/x.svg";
import { useEffect, useRef } from "react";
import { Errors, Message } from "@/types";
import { useRate } from "@/lib/useRate";

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
			<div className="rating-text">
				האם התשובה עזרה לך?
			</div>

			{/* Thumbs Up Icon */}
			<button
				disabled={isFeedbackSubmitted}
				aria-label="סמנ/י שהתשובה עזרה לי"
				aria-pressed={message.liked === true}
				className="rating-icon"
				onClick={() => handleRate(message.liked === true ? null : true)}
			>
				<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M7 10V20H21V10L17 6H11L7 10Z" fill={message.liked === true ? "#2d5b85" : "#d1d5db"} />
					<path d="M3 10H7V20H3C2.4 20 2 19.6 2 19V11C2 10.4 2.4 10 3 10Z" fill={message.liked === true ? "#2d5b85" : "#d1d5db"} />
				</svg>
			</button>

			{/* Thumbs Down Icon */}
			<button
				disabled={isFeedbackSubmitted}
				aria-label="סמנ/י שהתשובה לא עזרה לי"
				aria-pressed={message.liked === false}
				className="rating-icon rating-icon-rotated"
				onClick={() => handleRate(message.liked === false ? null : false)}
			>
				<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M7 10V20H21V10L17 6H11L7 10Z" fill={message.liked === false ? "#2d5b85" : "#d1d5db"} />
					<path d="M3 10H7V20H3C2.4 20 2 19.6 2 19V11C2 10.4 2.4 10 3 10Z" fill={message.liked === false ? "#2d5b85" : "#d1d5db"} />
				</svg>
			</button>

			{rateIsOpen && (
				<form className="mt-2 p-2 border border-line" onSubmit={handleSubmit}>
					<div className="flex justify-between items-center">
						<span className="text-sm font-bold text-input">
							{message.liked
								? slugs?.like_follow_up_question
								: slugs?.dislike_follow_up_question}
						</span>
						<button onClick={handleCloseRate}>
							<img src={XIcon} alt="x icon" />
						</button>
					</div>
					<div className="mb-1 mt-3">
						<textarea
							name="description"
							className="block text-sm h-[69px] overflow-hidden w-full leading-[1.5] rounded-md border-textArea-border placeholder:text-sm text-input placeholder:text-textArea-placholder bg-transparent border-b outline-none border px-2 py-1"
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
								className="text-sm text-destructive bg-destructive inline-block px-1 mt-1"
								role="alert"
							>
								{errors.description}
							</p>
						)}
					</div>
					<div className="flex items-center justify-between">
						<span className="text-xs text-disclaimer">
							{slugs?.feedback_free_text_disclaimer}
						</span>
						<input
							disabled={!isFormValid}
							type="submit"
							value="שליחה"
							className="disabled:opacity-45 disabled:cursor-not-allowed rounded-full h-[29px] text-xs font-bold px-3 cursor-pointer bg-button text-button-foreground"
						/>
					</div>
				</form>
			)}
		</div>
	);
};

export default Rate;
