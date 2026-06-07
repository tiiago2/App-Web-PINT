import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import "./ModalConfirmacao.css";

export default function ModalConfirmacao({
  isOpen,
  onClose,
  onConfirm,
  titulo = "Confirmar Ação",
  mensagem = "Tem a certeza que deseja continuar?",
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  isDanger = true, // Se for true, o botão de confirmar será vermelho
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-confirmacao-overlay" onClick={onClose}>
      <div
        className="modal-confirmacao-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-confirmacao-header">
          <div className="d-flex align-items-center gap-2">
            {isDanger ? (
              <div className="modal-confirmacao-icon-danger">
                <i className="fi fi-br-triangle-warning"></i>
              </div>
            ) : (
              <div className="modal-confirmacao-icon-info">
                <i className="fi fi-br-info"></i>
              </div>
            )}
            <h5 className="m-0 fw-semibold">{titulo}</h5>
          </div>
          <button className="modal-confirmacao-close" onClick={onClose}>
            <i className="fi fi-br-cross"></i>
          </button>
        </div>

        <div className="modal-confirmacao-body">
          <p className="m-0 text-muted">{mensagem}</p>
        </div>

        <div className="modal-confirmacao-footer">
          <button className="modal-btn-cancel" onClick={onClose}>
            {textoCancelar}
          </button>
          <button
            className={`modal-btn-confirm ${isDanger ? "danger" : "primary"}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
