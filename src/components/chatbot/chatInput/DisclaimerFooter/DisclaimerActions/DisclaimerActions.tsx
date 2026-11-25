import { pushAnalyticsEvent } from "@/lib/analytics";
import { useTranslation } from "@/hooks/useTranslation";
import { safeHttpUrl } from "@/lib/safeUrl";
import "./disclaimerActions.css";

interface DisclaimerActionsProps {
    termsofServiceUrl?: string;
    onDeleteHistoryClick?: () => void;
}

const DisclaimerActions = ({ termsofServiceUrl, onDeleteHistoryClick }: DisclaimerActionsProps) => {
    const { t } = useTranslation();
    const termsUrl = safeHttpUrl(termsofServiceUrl);

    return (
        <span className="chat-input-disclaimer-actions">
            {termsUrl && (
                <a
                    href={termsUrl}
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
