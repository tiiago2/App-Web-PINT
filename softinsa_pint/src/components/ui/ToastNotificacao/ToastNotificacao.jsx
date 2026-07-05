import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import "./ToastNotificacao.css";

export default function ToastNotificacao({
  mensagem,
  tipo = "sucesso",
  visivel,
  onFechar,
  duracao = 4000,
}) {
  useEffect(() => {
    if (!visivel) return;
    const timer = setTimeout(() => {
      onFechar();
    }, duracao);
    return () => clearTimeout(timer);
  }, [visivel, duracao, onFechar]);

  if (!visivel) return null;

  const icone =
    tipo === "sucesso"
      ? "fi-br-check-circle"
      : tipo === "erro"
      ? "fi-br-exclamation"
      : "fi-br-info";

  return ReactDOM.createPortal(
    <div className={`toast-notificacao ${tipo}`} onClick={onFechar}>
      <div className="toast-notificacao-conteudo">
        <i className={`fi ${icone} toast-notificacao-icone`}></i>
        <span className="toast-notificacao-mensagem">{mensagem}</span>
      </div>
      <button className="toast-notificacao-fechar" onClick={onFechar}>
        <i className="fi fi-br-cross"></i>
      </button>
    </div>,
    document.body
  );
}
