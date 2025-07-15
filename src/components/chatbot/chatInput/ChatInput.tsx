import { Errors } from "@/types.ts";
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
}

const ChatInput = ({ handleSubmit, errors, question, handleOnMessageChange, disabled }: ChatInputProps) => {
    const globalConfigObject = window.KZChatbotConfig;
    const slugs = globalConfigObject?.slugs || {};

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
                    placeholder={slugs?.question_field}
                    title={slugs?.send_button}
                    submitElement={
                        <div className="chat-input-texts-section">
                            <span className="sr-only">{slugs?.send_button}</span>
                            <img src={question ? SendEnabled : SendDisabled} className="chat-input-icon" alt="" />
                        </div>
                    }
                    maxLength={globalConfigObject?.questionCharacterLimit || 150}
                    errors={errors}
                    disabled={disabled}
                />
                <DisclaimerFooter />
            </form>
        </div>
    )

}

export default ChatInput;
