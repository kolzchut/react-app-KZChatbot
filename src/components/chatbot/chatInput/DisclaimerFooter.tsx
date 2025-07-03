import { pushAnalyticsEvent } from "@/lib/analytics";
import "./disclaimerFooter.css";

const DisclaimerFooter = () => {
    const globalConfigObject = window.KZChatbotConfig;
    const slugs = globalConfigObject?.slugs || {};

    return (
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
    )
}

export default DisclaimerFooter;
