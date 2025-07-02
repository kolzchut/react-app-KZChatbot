import WebiksLogo from "@/assets/webiks.svg";
import "./footer.css"

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
                <span className="flex row align-center justify-center footer-disclaimer-text weight-bold">
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
