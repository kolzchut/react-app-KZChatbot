import { pushAnalyticsEvent } from "@/lib/analytics";
import { useTranslation } from "@/hooks/useTranslation";
import "./disclaimerFooter.css";

const DisclaimerFooter = () => {
    const { t } = useTranslation();
    const globalConfigObject = window.KZChatbotConfig;

    return (
        <div className="chat-input-footer-info">
            <span className="chat-input-disclaimer">
                {t('question_disclaimer')}
            </span>
            <span className="chat-input-disclaimer underline">
                {globalConfigObject?.termsofServiceUrl && (
                    <a
                        href={globalConfigObject.termsofServiceUrl}
                        target="_blank"
                        onClick={() => pushAnalyticsEvent("tos_clicked")}
                    >
                        {t('tc_link')}
                    </a>
                )}
            </span>
        </div>
    )
}

export default DisclaimerFooter;
