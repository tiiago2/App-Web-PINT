import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./AreaModal.css"; // Reuse the same CSS since layout is identical

export default function LearningPathModal({ isOpen, onClose, onSave, lpToEdit }) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [formErro, setFormErro] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (lpToEdit) {
        setNome(lpToEdit.nome || "");
        setDescricao(lpToEdit.descricao || "");
      } else {
        setNome("");
        setDescricao("");
        setFormErro("");
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, lpToEdit]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setFormErro("");
    if (!nome.trim()) {
      setFormErro("Por favor, preencha o campo obrigatório (Nome).");
      return;
    }

    const newLP = {
      id: lpToEdit ? lpToEdit.id : Date.now(),
      nome,
      descricao,
      servicelines: 0, // Mock value
      elementos: 0, // Mock value
    };

    onSave(newLP);
    onClose();
  };

  return ReactDOM.createPortal(
    <div className="area-modal-overlay" onClick={onClose}>
      <div
        className="area-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="area-modal-header">
          <h4>{lpToEdit ? "Editar Learning Path" : "Criar Learning Path"}</h4>
          <button className="area-modal-close-btn" onClick={onClose}>
            <i className="fi fi-br-cross"></i>
          </button>
        </div>

        <form id="learningpath-form" className="area-modal-body" onSubmit={handleSave}>
          {formErro && (
            <div
              className="alert alert-danger d-flex align-items-center gap-2 mb-0"
              style={{
                fontSize: "0.85rem",
                padding: "0.75rem",
                marginBottom: "1rem",
              }}
            >
              <i className="fi fi-br-info"></i> {formErro}
            </div>
          )}

          <div className="row">
            <div className="col-md-12 area-form-group">
              <label className="area-form-label">Nome do Learning Path</label>
              <input
                type="text"
                className="area-form-input"
                placeholder="Ex: Jornada Técnica"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  setFormErro("");
                }}
                required
              />
            </div>
            <div className="col-md-12 area-form-group mt-2 mb-0">
              <label className="area-form-label">Descrição (Opcional)</label>
              <textarea
                className="area-form-input"
                placeholder="Breve descrição do Learning Path..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                style={{ minHeight: "80px", resize: "vertical" }}
              />
            </div>
          </div>
        </form>

        <div className="area-modal-footer">
          <button type="button" className="area-btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="learningpath-form" className="area-btn-save">
            <i className="fi fi-br-disk"></i> Guardar Learning Path
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
