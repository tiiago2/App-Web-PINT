import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./AreaModal.css"; // Reuse the same CSS since layout is identical
import BotaoDropdown from "./ui/BotaoDropdown/BotaoDropdown";

// 1. MOCK DATA HIERÁRQUICO
const MOCK_HIERARCHY = [
  {
    id: "lp1",
    nome: "Jornada Técnica",
  },
];

export default function ServiceLineModal({ isOpen, onClose, onSave, serviceLineToEdit }) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [learningPathId, setLearningPathId] = useState("");
  const [formErro, setFormErro] = useState("");

  const lpOpcoes = MOCK_HIERARCHY.map((lp) => ({
    valor: lp.id,
    label: lp.nome,
  }));

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (serviceLineToEdit) {
        setNome(serviceLineToEdit.nome || "");
        setDescricao(serviceLineToEdit.descricao || "");
        setLearningPathId(serviceLineToEdit.learningPathId || "");
      } else {
        setNome("");
        setDescricao("");
        setLearningPathId("");
        setFormErro("");
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, serviceLineToEdit]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setFormErro("");
    if (!nome.trim() || !learningPathId) {
      setFormErro(
        "Por favor, preencha todos os campos obrigatórios (Nome e Learning Path).",
      );
      return;
    }

    const newSL = {
      id: serviceLineToEdit ? serviceLineToEdit.id : Date.now(),
      nome,
      descricao,
      learningPathId,
      badges: 0, // Mock value
      elementos: 0, // Mock value
      learningPath: MOCK_HIERARCHY.find(lp => lp.id === learningPathId)?.nome || "Desconhecido"
    };

    onSave(newSL);
    onClose();
  };

  return ReactDOM.createPortal(
    <div className="area-modal-overlay" onClick={onClose}>
      <div
        className="area-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="area-modal-header">
          <h4>{serviceLineToEdit ? "Editar Service Line" : "Criar Service Line"}</h4>
          <button className="area-modal-close-btn" onClick={onClose}>
            <i className="fi fi-br-cross"></i>
          </button>
        </div>

        <form id="serviceline-form" className="area-modal-body" onSubmit={handleSave}>
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
              <label className="area-form-label">Nome da Service Line</label>
              <input
                type="text"
                className="area-form-input"
                placeholder="Ex: Frontend Development"
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
                placeholder="Breve descrição da Service Line..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                style={{ minHeight: "80px", resize: "vertical" }}
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-12 area-form-group">
              <label className="area-form-label">Learning Path</label>
              <BotaoDropdown
                titulo="Selecione..."
                valor={learningPathId}
                opcoes={lpOpcoes}
                onChange={(val) => {
                  setLearningPathId(val);
                  setFormErro("");
                }}
                mostrarTituloNoValor={false}
                abrirParaCima={true}
              />
            </div>
          </div>
        </form>

        <div className="area-modal-footer">
          <button type="button" className="area-btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="serviceline-form" className="area-btn-save">
            <i className="fi fi-br-disk"></i> Guardar Service Line
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
