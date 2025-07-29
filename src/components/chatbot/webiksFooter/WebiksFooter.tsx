import WebiksLogo from "@/assets/webiks.svg";
import "./webiksFooter.css"

const WebiksFooter = () => {
    const slugs = window.KZChatbotConfig?.slugs;

    return (
        <div className="webiks-footer">
            <span className="footer-disclaimer-text">
                {slugs?.chat_disclaimer || "הצ׳אט יכול לטעות. 'כל זכות' לא אחראית לנכונות התשובות וממליצה לבדוק את המידע גם בעמוד המתאים באתר."}
            </span>
            <a
                href="https://webiks.com"
                target="_blank"
            >
                <span className="footer-disclaimer-text by-webiks">
                    {slugs?.by || "by"}
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
