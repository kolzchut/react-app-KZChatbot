import { useTranslation } from "@/hooks/useTranslation";
import WebiksLogo from "@/assets/webiks.svg";
import "./webiksFooter.css"

const WebiksFooter = () => {
    const { t } = useTranslation();

    return (
        <div className="webiks-footer">
            <span className="footer-disclaimer-text">
                {t('chat_disclaimer')}
            </span>
            <a
                href="https://webiks.com"
                target="_blank"
            >
                <span className="footer-disclaimer-text by-webiks">
                    {t('by')}
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
