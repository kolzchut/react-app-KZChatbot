import WebiksLogo from "@/assets/webiks.svg";
import "./webiksFooter.css"

const WebiksFooter = () => {
    const slugs = window.KZChatbotConfig?.slugs || {};

    return (
        <div className="webiks-footer">
            <span className="footer-disclaimer-text">
                {slugs.chat_disclaimer}
            </span>
            <a
                href="https://webiks.com"
                target="_blank"
                aria-label="בקרו באתר של Webiks, נפתח בכרטיסייה חדשה"
            >
                <span className="footer-disclaimer-text by-webiks">
                    by
                    <img
                        src={WebiksLogo}
                        alt="Webiks"
                        className="webiks-logo"
                        style={{ width: "70px" }}
                    />

                </span>

            </a>
        </div>
    )
}

export default WebiksFooter;
