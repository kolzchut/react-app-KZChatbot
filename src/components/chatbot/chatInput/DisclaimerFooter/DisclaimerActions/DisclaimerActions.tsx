import { pushAnalyticsEvent } from "@/lib/analytics";
import { useTranslation } from "@/hooks/useTranslation";
import "./disclaimerActions.css";

interface DisclaimerActionsProps {
    termsofServiceUrl?: string;
    onDeleteHistoryClick?: () => void;
}

const DisclaimerActions = ({ termsofServiceUrl, onDeleteHistoryClick }: DisclaimerActionsProps) => {
    const { t } = useTranslation();

    return (
        <span className="chat-input-disclaimer-actions">
            {termsofServiceUrl && (
                <a
                    href={termsofServiceUrl}
                    className="chat-input-disclaimer-link"
                    onClick={() => pushAnalyticsEvent("tos_clicked")}
                >
                    {t('tc_link')}
                </a>
            )}
            {onDeleteHistoryClick && (
                <button
                    className="chat-input-disclaimer-button"
                    onClick={onDeleteHistoryClick}
                >
                    {t('delete_history_button')}
                </button>
            )}
        </span>
    );
};

export default DisclaimerActions;
