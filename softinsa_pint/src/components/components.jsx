import React from "react";
import { useTranslation } from "react-i18next";

import "./components.css";

export function BotaoVerMais({ onClick, tamanho }) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      className={`btn btn-sm btn-outline-secondary rounded-3 d-flex align-items-center justify-content-center gap-1 
            ver_mais_btn`}
    >
      <i
        className="fi fi-br-eye d-flex align-items-center"
        style={{ fontSize: `${tamanho}rem` }}
      ></i>
      <span
        className="d-flex align-items-center"
        style={{ fontSize: `${tamanho}rem` }}
      >
        {t("ver_mais")}
      </span>
    </button>
  );
}

export function BotaoAceitar({ onClick, tamanho }) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      className={`btn btn-sm btn-outline-secondary rounded-3 d-flex align-items-center justify-content-center gap-1
            aceitar_btn`}
    >
      <i
        className="fi fi-br-check d-flex align-items-center"
        style={{ fontSize: `${tamanho}rem` }}
      ></i>
      <span
        className="d-flex align-items-center"
        style={{ fontSize: `${tamanho}rem` }}
      >
        {t("aceitar")}
      </span>
    </button>
  );
}

export function BotaoRejeitar({ onClick, tamanho }) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      className={`btn btn-sm btn-outline-secondary rounded-3 d-flex align-items-center justify-content-center gap-1
            rejeitar_btn`}
    >
      <i
        className="fi fi-br-cross d-flex align-items-center"
        style={{ fontSize: `${tamanho}rem` }}
      ></i>
      <span
        className="d-flex align-items-center"
        style={{ fontSize: `${tamanho}rem` }}
      >
        {t("rejeitar")}
      </span>
    </button>
  );
}

export function Rankings({ linhas }) {
  const { t } = useTranslation();
}

export function WidgetAtividade({ atividades, onExpandir, t }) {
  return (
    <div
      className="caixa-branca p-4 h-100 d-flex flex-column"
      style={{ overflow: "hidden" }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="m-0 fw-bold">{t("atividade_recente")}</h5>
        <i
          className="fi fi-br-expand text-muted"
          style={{ cursor: "pointer" }}
          onClick={onExpandir}
        ></i>
      </div>

      <div
        className="d-flex flex-column gap-4"
        style={{ overflow: "hidden", flex: 1 }}
      >
        {atividades.slice(0, 6).map((item, i) => (
          <div
            key={i}
            className={`atividade-item${item.expirado ? " expirado" : ""}`}
          >
            <span className="d-flex align-items-center gap-2">
              <i className={`fi ${item.icone} ${item.cor}`}></i>
              <span className="texto" style={{ fontSize: "0.85rem" }}>
                {item.textoNegrito && <strong>{item.textoNegrito} </strong>}
                {item.texto}
              </span>
            </span>
            <span
              className="text-muted"
              style={{
                fontSize: "0.7rem",
                whiteSpace: "nowrap",
                marginLeft: "8px",
              }}
            >
              {item.tempo}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WidgetClassificacao({ classificacao, onExpandir, t }) {
  return (
    <div className="caixa-branca p-4 h-100">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="m-0 fw-bold">Classificação Geral</h5>
        <i
          className="fi fi-br-expand text-muted"
          style={{ cursor: "pointer" }}
          onClick={onExpandir}
        ></i>
      </div>

      <div className="d-flex flex-column gap-2">
        {classificacao.slice(0, 5).map((item, index) => (
          <div
            key={index}
            className={`ranking-row ${item.classe || ""} d-flex justify-content-between align-items-center pb-2 border-bottom`}
          >
            <div className="d-flex align-items-center gap-2">
              {item.pos <= 3 ? (
                <i
                  className="fi fi-br-medal"
                  style={{
                    color: item.cor,
                    fontSize: "1.2rem",
                    minWidth: "22px",
                  }}
                ></i>
              ) : (
                <span
                  className="fw-bold"
                  style={{ minWidth: "22px", fontSize: "0.85rem" }}
                >
                  {item.pos}.
                </span>
              )}

              <div>
                <div
                  className="fw-bold"
                  style={{ fontSize: "0.78rem", lineHeight: 1.2 }}
                >
                  {item.nome}
                </div>
                <div className="text-muted" style={{ fontSize: "0.68rem" }}>
                  {item.area}
                </div>
              </div>
            </div>
            <div className="fw-bold" style={{ fontSize: "0.82rem" }}>
              {item.pontos} pts
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
