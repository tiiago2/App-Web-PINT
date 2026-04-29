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
