import { Errors } from "@/types.ts";
import { useTranslation } from "@/hooks/useTranslation";
import Input from "../../ui/input/Input.tsx";
import DisclaimerFooter from "./DisclaimerFooter.tsx";
import SendEnabled from "@/assets/send-enabled.svg";
import SendDisabled from "@/assets/send-disabled.svg";
import "./chatInput.css";


interface ChatInputProps {
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    question: string;
    handleOnMessageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    errors?: Errors;
    disabled?: boolean;
    inputRef?: React.RefObject<HTMLInputElement>;
}

const ChatInput = ({ handleSubmit, errors, question, handleOnMessageChange, disabled, inputRef }: ChatInputProps) => {
    const { t } = useTranslation();
    const globalConfigObject = window.KZChatbotConfig;

    return (
        <div className="chat-input-container">
            <form
                onSubmit={handleSubmit}
                className="chat-input-form"
            >
                <Input
                    type="text"
                    name="question"
                    value={question}
                    onChange={handleOnMessageChange}
                    placeholder={t('question_field')}
                    title={t('send_button')}
                    submitElement={
                        <div className="chat-input-texts-section">
                            <span className="sr-only">{t('send_button')}</span>
                            <img src={question ? SendEnabled : SendDisabled} className="chat-input-icon" alt="send"  />
                        </div>
                    }
                    maxLength={globalConfigObject?.questionCharacterLimit || 150}
                    errors={errors}
                    disabled={disabled}
                    ref={inputRef}
                />
                <DisclaimerFooter />
            </form>
        </div>
    )

}

export default ChatInput;
