import { useState } from "react";
import { Message, Errors } from "@/types";
import { pushAnalyticsEvent } from './analytics';

type FormValues = {
	description: string;
};

interface UseFormProps {
	message: Message;
	setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
	globalConfigObject: typeof window.KZChatbotConfig | null;
	textareaRef: React.RefObject<HTMLTextAreaElement>;
	errors: Errors;
	setErrors: React.Dispatch<React.SetStateAction<Errors>>;
	initialErrors: Errors;
}

const useRate = ({
					message,
					setMessages,
					globalConfigObject,
					textareaRef,
					errors,
					setErrors,
					initialErrors,
	}: UseFormProps) => {
	const initialValues: FormValues = {
		description: "",
	};
	const [values, setValues] = useState<FormValues>(initialValues);
	const [like, setLike] = useState<boolean | null>(null);
	const isFormValid = errors.description === "" && values.description.length > 0;
	/** Derived from message so it stays in sync across tabs and survives refresh. */
	const rateIsOpen = message.liked !== null && message.liked !== undefined && !message.feedbackSubmitted;
	const isFeedbackSubmitted = Boolean(message.feedbackSubmitted);

	// The thread this answer belongs to — carried on the message so the rating
	// reaches the correct RAG thread (message.id is the per-turn conversation_id).
	const threadId = message.threadId || "";

	const autoExpandingTextarea = () => {
		if (!textareaRef.current) return;
		textareaRef.current.style.height = "auto";
		textareaRef.current.style.height =
			Math.max(textareaRef.current.scrollHeight, 69) + "px";
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setValues((prevValues) => ({ ...prevValues, [name]: value }));

		if (name === "description") {
			autoExpandingTextarea();
			const charLimitSlug =
				globalConfigObject?.slugs.feedback_character_limit || "";
			const reachedCharLimit =
				value.length >= (globalConfigObject?.feedbackCharacterLimit || 150);

			setErrors((prevErrors) => ({
				...prevErrors,
				description: reachedCharLimit ? charLimitSlug : "",
			}));
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const isProduction = import.meta.env.MODE === "production";
		const url = isProduction
			? `${globalConfigObject?.restPath}/kzchatbot/v0/rate`
			: "/api/kzchatbot/v0/rate";
		const { description } = values;

		if (description) {
			pushAnalyticsEvent("free_text_feedback");
		}

		try {
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					thread_id: threadId,
					conversation_id: message.id,
					answerId: message.id,
					like: like,
					text: description,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.messageTranslations.he); // TODO: add type for data
			}

			setMessages((prevMessages) =>
				prevMessages.map((prevMessage) =>
					prevMessage.id === message.id
						? { ...prevMessage, feedbackSubmitted: true }
						: prevMessage,
				),
			);
			setValues(initialValues);
			setErrors(initialErrors);
		} catch (error) {
			console.error(error);
		}
	};

	const handleRate = async (liked: boolean | null) => {
		setLike(liked); // Set the like value in state
		pushAnalyticsEvent(liked ? "positive_feedback" : "negative_feedback");

		// Optimistic Redux update — UI responds instantly
		const previousLiked = message.liked;
		setMessages((prevMessages) =>
			prevMessages.map((prevMessage) =>
				prevMessage.id === message.id
					? {
						...prevMessage,
						liked: prevMessage.liked === liked ? null : liked,
					}
					: prevMessage,
			),
		);
		setValues(initialValues);
		setErrors(initialErrors);

		const isProduction = import.meta.env.MODE === "production";
		const url = isProduction
			? `${globalConfigObject?.restPath}/kzchatbot/v0/rate`
			: "/api/kzchatbot/v0/rate";

		try {
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					thread_id: threadId,
					conversation_id: message.id,
					answerId: message.id,
					like: liked,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.messageTranslations.he); // TODO: add type for data
			}
		} catch (error) {
			console.error(error);
			// Revert optimistic update on failure
			setMessages((prevMessages) =>
				prevMessages.map((prevMessage) =>
					prevMessage.id === message.id
						? { ...prevMessage, liked: previousLiked }
						: prevMessage,
				),
			);
		}
	};

	return {
		values,
		errors,
		isFeedbackSubmitted,
		handleChange,
		handleSubmit,
		rateIsOpen,
		isFormValid,
		handleRate
	};
};

export { useRate };
