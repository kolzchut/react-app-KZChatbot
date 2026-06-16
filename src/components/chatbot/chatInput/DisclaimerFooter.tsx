import { pushAnalyticsEvent } from "@/lib/analytics";
import { useTranslation } from "@/hooks/useTranslation";
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
            {showHistoryActions && <span className="chat-input-disclaimer-actions">{globalConfigObject?.termsofServiceUrl && <a href={globalConfigObject.termsofServiceUrl} className="chat-input-disclaimer-link" onClick={() => pushAnalyticsEvent("tos_clicked")}>{t('tc_link')}</a>}{onDeleteHistoryClick && <button className="chat-input-disclaimer-button" onClick={onDeleteHistoryClick}>{t('delete_history_button')}</button>}</span>}
        </div>
    )
}

export default DisclaimerFooter;
