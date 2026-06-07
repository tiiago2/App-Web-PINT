import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./AreaModal.css";
import BotaoDropdown from "./ui/BotaoDropdown/BotaoDropdown";

// 1. MOCK DATA HIERÁRQUICO
const MOCK_HIERARCHY = [
  {
    id: "lp1",
    nome: "Jornada Técnica",
    serviceLines: [
      {
        id: "sl1",
        nome: "Frontend Development",
      },
      {
        id: "sl2",
        nome: "Backend Development",
      },
      {
        id: "sl3",
        nome: "Cloud Native",
      },
    ],
  },
];

export default function AreaModal({ isOpen, onClose, onSave, areaToEdit }) {
  // Estados da Área
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");

  // Estados Hierárquicos
  const [learningPathId, setLearningPathId] = useState("");
  const [serviceLineId, setServiceLineId] = useState("");

  // Estados de Validação Inline
  const [erroSl, setErroSl] = useState("");
  const [formErro, setFormErro] = useState("");

  // Opções para as dropdowns baseadas nas escolhas do utilizador
  const lpOpcoes = MOCK_HIERARCHY.map((lp) => ({
    valor: lp.id,
    label: lp.nome,
  }));

  const selectedLP = MOCK_HIERARCHY.find((lp) => lp.id === learningPathId);
  const serviceLinesOptions = selectedLP ? selectedLP.serviceLines : [];
  const slOpcoes = serviceLinesOptions.map((sl) => ({
    valor: sl.id,
    label: sl.nome,
  }));

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (areaToEdit) {
        setNome(areaToEdit.nome || "");
        setDescricao(areaToEdit.descricao || "");
        setLearningPathId(areaToEdit.learningPathId || "");
        setServiceLineId(areaToEdit.serviceLineId || "");
      } else {
        setNome("");
        setDescricao("");
        setLearningPathId("");
        setServiceLineId("");
        setErroSl("");
        setFormErro("");
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, areaToEdit]);

  if (!isOpen) return null;

  // Resets em Cascata: Se mudar LP, reseta SL.
  const handleLpChange = (val) => {
    setLearningPathId(val);
    setServiceLineId("");
    setErroSl(""); // Limpa o erro se o user afinal clicou no correto
    setFormErro(""); // Limpa erro global
  };

  const handleSave = (e) => {
    e.preventDefault();
    setFormErro("");
    if (!nome.trim() || !learningPathId || !serviceLineId) {
      setFormErro(
        "Por favor, preencha todos os campos obrigatórios (Nome, Learning Path e Service Line).",
      );
      return;
    }

    const newArea = {
      id: areaToEdit ? areaToEdit.id : Date.now(),
      nome,
      descricao,
      learningPathId,
      serviceLineId,
      servicelines: 1, // Mock value
      badges: 0, // Mock value
    };

    onSave(newArea);
    onClose();
  };

  return ReactDOM.createPortal(
    <div className="area-modal-overlay" onClick={onClose}>
      <div
        className="area-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="area-modal-header">
          <h4>{areaToEdit ? "Editar Área" : "Criar Área"}</h4>
          <button className="area-modal-close-btn" onClick={onClose}>
            <i className="fi fi-br-cross"></i>
          </button>
        </div>

        <form id="area-form" className="area-modal-body" onSubmit={handleSave}>
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
              <label className="area-form-label">Nome da Área</label>
              <input
                type="text"
                className="area-form-input"
                placeholder="Ex: React JS"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  setFormErro("");
                }}
                required
              />
            </div>
            <div className="col-md-12 area-form-group mt-2 mb-0">
              <label className="area-form-label">Descrição</label>
              <textarea
                className="area-form-input"
                placeholder="Breve descrição da área..."
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
                onChange={(val) => handleLpChange(val)}
                mostrarTituloNoValor={false}
              />
            </div>

            <div className="col-md-12 area-form-group">
              <label className="area-form-label">Service Line</label>
              <div
                onClickCapture={(e) => {
                  if (!learningPathId) {
                    e.stopPropagation();
                    setErroSl("Por favor, escolha primeiro o Learning Path.");
                  }
                }}
              >
                <BotaoDropdown
                  titulo="Selecione..."
                  valor={serviceLineId}
                  opcoes={slOpcoes}
                  onChange={(val) => {
                    setServiceLineId(val);
                    setFormErro("");
                  }}
                  mostrarTituloNoValor={false}
                  abrirParaCima={true}
                />
              </div>
              {erroSl && (
                <div
                  style={{
                    color: "#ff4d4d",
                    fontSize: "0.8rem",
                    marginTop: "0.2rem",
                  }}
                >
                  {erroSl}
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="area-modal-footer">
          <button type="button" className="area-btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="area-form" className="area-btn-save">
            <i className="fi fi-br-disk"></i> Guardar Área
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
