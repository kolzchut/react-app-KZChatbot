import Input from "../ui/Input";
import SendEnebled from "@/assets/send-enabled.svg";
import SendDisabled from "@/assets/send-disabled.svg";
import { pushAnalyticsEvent } from "@/lib/analytics";
import { Errors } from "@/types";
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
                            <img src={question ? SendEnebled : SendDisabled} className="block" alt="" />
                        </div>
                    }
                    maxLength={globalConfigObject?.questionCharacterLimit || 150}
                    errors={errors}
                    disabled={disabled}
                />
                <div className="chat-input-footer-info">
                    <span className="chat-input-disclaimer">
                        {slugs?.question_disclaimer}
                    </span>
                    <span className="chat-input-disclaimer underline">
                        {globalConfigObject?.termsofServiceUrl && (
                            <a
                                href={globalConfigObject.termsofServiceUrl}
                                target="_blank"
                                onClick={() => pushAnalyticsEvent("tos_clicked")}
                            >
                                {slugs?.tc_link}
                            </a>
                        )}
                    </span>
                </div>
            </form>
        </div>
    )

}

export default ChatInput;
