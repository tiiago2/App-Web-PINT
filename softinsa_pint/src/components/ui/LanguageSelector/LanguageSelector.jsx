import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./LanguageSelector.css";

function LanguageSelector() {
  const { t, i18n } = useTranslation();

  const seletorRef = useRef(null);
  const [menuAberto, setMenuAberto] = useState(false);

  const linguaAtual = i18n.resolvedLanguage || i18n.language || "pt";

  useEffect(() => {
    const handleCliqueFora = (event) => {
      if (seletorRef.current && !seletorRef.current.contains(event.target)) {
        setMenuAberto(false);
      }
    };

    document.addEventListener("mousedown", handleCliqueFora);

    return () => {
      document.removeEventListener("mousedown", handleCliqueFora);
    };
  }, []);

  const escolherLingua = (novaLingua) => {
    i18n.changeLanguage(novaLingua);
    setMenuAberto(false);
  };

  return (
    <div className="language-selector" ref={seletorRef}>
      <button
        type="button"
        className="language-selector-trigger"
        onClick={() => setMenuAberto((valorAtual) => !valorAtual)}
        aria-label={t("lingua")}
      >
        <span
          className={`flag-icon flag-icon-${linguaAtual} flag-icon-squared rounded-circle fs-5`}
        />
      </button>

      {menuAberto && (
        <div className="language-selector-menu">
          <h5 className="language-selector-titulo user-select-none">
            {t("lingua")}
          </h5>

          <hr className="language-selector-linha" />

          <button
            type="button"
            className="language-selector-opcao"
            onClick={() => escolherLingua("pt")}
          >
            <span className="flag-icon flag-icon-pt flag-icon-squared rounded-circle fs-4" />
            <span>{t("portugues")}</span>
          </button>

          <button
            type="button"
            className="language-selector-opcao"
            onClick={() => escolherLingua("es")}
          >
            <span className="flag-icon flag-icon-es flag-icon-squared rounded-circle fs-4" />
            <span>{t("espanhol")}</span>
          </button>

          <button
            type="button"
            className="language-selector-opcao"
            onClick={() => escolherLingua("gb")}
          >
            <span className="flag-icon flag-icon-gb flag-icon-squared rounded-circle fs-4" />
            <span>{t("ingles")}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;