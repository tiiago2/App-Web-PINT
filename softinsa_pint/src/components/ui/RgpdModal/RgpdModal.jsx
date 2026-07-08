import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useTranslation } from "react-i18next";
import api from "../../../services/api.js";
import RgpdRenderer from "../../RgpdRenderer/RgpdRenderer.jsx";
import "./RgpdModal.css";

export default function RgpdModal({ isOpen, onAceitar, onRecusar }) {
  const { t } = useTranslation();
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      carregarTexto();
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const carregarTexto = async () => {
    setCarregando(true);
    setErro(false);

    try {
      const resposta = await api.get("/rgpd");
      setTexto(resposta.data.textoConsentimento || "");
    } catch (error) {
      console.error("Erro ao carregar políticas RGPD:", error);
      setErro(true);
    } finally {
      setCarregando(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="rgpd-modal-overlay">
      <div className="rgpd-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="rgpd-modal-header">
          <div className="d-flex align-items-center gap-2">
            <div className="rgpd-modal-icon">
              <i className="fi fi-br-shield-check"></i>
            </div>
            <h5 className="m-0 fw-semibold">{t("rgpd_modal_titulo")}</h5>
          </div>
        </div>

        <div className="rgpd-modal-body">
          {carregando ? (
            <div className="rgpd-modal-loading">{t("a_carregar")}</div>
          ) : erro ? (
            <div className="rgpd-modal-erro">
              <i className="fi fi-br-exclamation"></i>
              <span>{t("rgpd_modal_erro_carregar")}</span>
            </div>
          ) : (
            <RgpdRenderer texto={texto} className="rgpd-modal-markdown" />
          )}
        </div>

        <div className="rgpd-modal-footer">
          <button
            type="button"
            className="rgpd-modal-btn-recusar"
            onClick={onRecusar}
          >
            {t("rgpd_modal_recusar")}
          </button>
          <button
            type="button"
            className="rgpd-modal-btn-aceitar"
            onClick={onAceitar}
            disabled={carregando || erro}
          >
            {t("rgpd_modal_aceitar")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
