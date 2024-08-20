import { useState } from "react";
import { Message } from "@/types";

type FormValues = {
  reason: string;
  description: string;
};

type Errors = {
  [key: string]: string;
};

enum ReasonValue {
  NOT_TRUE = "NOT_TRUE",
  IRRELEVANT = "IRRELEVANT",
  UNCLEAR = "UNCLEAR",
}

interface Reason {
  value: ReasonValue;
  label: string;
}

interface UseFormProps {
  message: Message;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  globalConfigObject: typeof window.KZChatbotConfig | null;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

const useRate = ({
  message,
  setMessages,
  globalConfigObject,
  textareaRef,
}: UseFormProps) => {
  const initialValues: FormValues = {
    reason: "",
    description: "",
  };
  const [values, setValues] = useState<FormValues>(initialValues);
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [isFormSubmitted, setIsFormSubmitted] = useState<boolean>(false);
  const slugs = globalConfigObject?.slugs;
  const isFormValid =
    errors.description === "" &&
    (values.description.length > 0 || values.reason !== "");

  const reasons: Reason[] = [
    {
      value: ReasonValue.NOT_TRUE,
      label: slugs?.dislike_followup_q_first || "not true",
    },
    {
      value: ReasonValue.IRRELEVANT,
      label: slugs?.dislike_followup_q_second || "not relevant",
    },
    {
      value: ReasonValue.UNCLEAR,
      label: slugs?.dislike_followup_q_third || "unclear",
    },
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setValues((prevValues) => ({ ...prevValues, [name]: value }));

    if (name === "description") {
      if (value.length >= (globalConfigObject?.feedbackCharacterLimit || 150)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          description: globalConfigObject?.slugs.feedback_character_limit || "",
        }));
        return;
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          description: "",
        }));
        if (!textareaRef.current) return;
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height =
          Math.max(textareaRef.current.scrollHeight, 23) + "px";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const isProduction = import.meta.env.MODE === "production";
    const url = isProduction
      ? `${globalConfigObject?.restPath}/kzchatbot/v0/rate`
      : "/api/kzchatbot/v0/rate";
    const { reason: reason, description } = values;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answerId: message.id,
          answerClassification: reason,
          text: description,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.messageTranslations.he); // TODO: add type for data
      }

      setIsFormSubmitted(true);
      setValues(initialValues);
      setErrors({});
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      setIsFormSubmitted(false);
    }
  };

  const handleRate = async (liked: boolean | null) => {
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
          like: liked,
          answerId: message.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.messageTranslations.he); // TODO: add type for data
      }

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
      setErrors({});
    } catch (error) {
      console.error(error);
    }
  };

  const handleCloseRate = () => {
    setIsOpen(false);
  };

  return {
    values,
    errors,
    isFormSubmitted,
    handleChange,
    handleSubmit,
    reasons,
    isOpen,
    setIsOpen,
    isFormValid,
    handleRate,
    handleCloseRate,
  };
};

export { useRate };
