import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import softinsaLogo from "../../../assets/logotipo_softinsa.png";
import "./AuthTopBar.css";

function AuthTopBar() {
  const { t, i18n } = useTranslation();

  const flagRef = useRef(null);
  const linguaPopupRef = useRef(null);

  const [menuLinguaAberto, setMenuLinguaAberto] = useState(false);

  const linguaAtual = i18n.resolvedLanguage || i18n.language || "pt";

  useEffect(() => {
    const handleCliqueFora = (event) => {
      if (
        menuLinguaAberto &&
        flagRef.current &&
        !flagRef.current.contains(event.target) &&
        linguaPopupRef.current &&
        !linguaPopupRef.current.contains(event.target)
      ) {
        setMenuLinguaAberto(false);
      }
    };

    document.addEventListener("mousedown", handleCliqueFora);

    return () => {
      document.removeEventListener("mousedown", handleCliqueFora);
    };
  }, [menuLinguaAberto]);

  const escolherLingua = (novaLingua) => {
    i18n.changeLanguage(novaLingua);
    setMenuLinguaAberto(false);
  };

  return (
    <header className="auth-topbar">
      <div className="auth-topbar-logo-area">
        <img
          className="auth-topbar-logo"
          src={softinsaLogo}
          alt="Softinsa Logo"
        />
      </div>

      <div className="auth-topbar-direita">
        <span
          ref={flagRef}
          className={`auth-topbar-flag flag-icon flag-icon-${linguaAtual} flag-icon-squared rounded-circle fs-5`}
          onClick={() => setMenuLinguaAberto((valorAtual) => !valorAtual)}
          aria-label={t("lingua")}
          role="button"
          tabIndex={0}
        />

        {menuLinguaAberto && (
          <div ref={linguaPopupRef} className="auth-topbar-popup-lingua">
            <h5 className="auth-topbar-popup-titulo user-select-none">
              {t("lingua")}
            </h5>

            <hr className="auth-topbar-popup-linha" />

            <button
              type="button"
              className="auth-topbar-opcao-lingua"
              onClick={() => escolherLingua("pt")}
            >
              <span className="flag-icon flag-icon-pt flag-icon-squared rounded-circle fs-4" />
              <span>{t("portugues")}</span>
            </button>

            <button
              type="button"
              className="auth-topbar-opcao-lingua"
              onClick={() => escolherLingua("es")}
            >
              <span className="flag-icon flag-icon-es flag-icon-squared rounded-circle fs-4" />
              <span>{t("espanhol")}</span>
            </button>

            <button
              type="button"
              className="auth-topbar-opcao-lingua"
              onClick={() => escolherLingua("gb")}
            >
              <span className="flag-icon flag-icon-gb flag-icon-squared rounded-circle fs-4" />
              <span>{t("ingles")}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default AuthTopBar;