import { useTranslation } from "@/hooks/useTranslation";
import DisclaimerActions from "./DisclaimerActions/DisclaimerActions.tsx";
import "./disclaimerFooter.css";

interface DisclaimerFooterProps {
    onDeleteHistoryClick?: () => void;
    showHistoryActions?: boolean;
}

const DisclaimerFooter = ({ onDeleteHistoryClick, showHistoryActions = true }: DisclaimerFooterProps) => {
    const { t } = useTranslation();
    const globalConfigObject = window.KZChatbotConfig;

    return (
        <div className="chat-input-footer-info">
            <span className="chat-input-disclaimer">
                {t('question_disclaimer')}
            </span>
            {showHistoryActions && (
                <DisclaimerActions
                    termsofServiceUrl={globalConfigObject?.termsofServiceUrl}
                    onDeleteHistoryClick={onDeleteHistoryClick}
                />
            )}
        </div>
    )
}

export default DisclaimerFooter;
