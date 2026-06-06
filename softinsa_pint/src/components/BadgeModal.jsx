import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./BadgeModal.css";
import BotaoDropdown from './ui/BotaoDropdown/BotaoDropdown';

// 1. MOCK DATA HIERÁRQUICO
const MOCK_HIERARCHY = [
  {
    id: "lp1",
    nome: "Software Engineering",
    serviceLines: [
      {
        id: "sl1",
        nome: "Frontend Development",
        areas: [
          { id: "a1", nome: "React JS" },
          { id: "a2", nome: "Angular Pro" },
        ],
      },
      {
        id: "sl2",
        nome: "Backend Development",
        areas: [
          { id: "a3", nome: "Node JS" },
          { id: "a4", nome: "Spring Boot" },
        ],
      },
    ],
  },
  {
    id: "lp2",
    nome: "Cloud & Infrastructure",
    serviceLines: [
      {
        id: "sl3",
        nome: "Cloud Native",
        areas: [
          { id: "a5", nome: "AWS Architecture" },
          { id: "a6", nome: "Azure Solutions" },
        ],
      },
    ],
  },
];

const ICON_OPTIONS = [
  "fi-br-mug-hot",
  "fi-br-cloud",
  "fi-br-target",
  "fi-br-trophy",
  "fi-br-microchip",
  "fi-br-bolt",
  "fi-br-database",
  "fi-br-smartphone",
  "fi-br-browser",
  "fi-br-shield-check",
  "fi-br-palette",
  "fi-br-chart-histogram",
  "fi-br-graduation-cap",
  "fi-br-rocket",
  "fi-br-star",
];

export default function BadgeModal({ isOpen, onClose, onSave, badgeToEdit }) {
  // Estados Genéricos do Badge
  const [nome, setNome] = useState("");
  const [pontos, setPontos] = useState("");
  const [cor, setCor] = useState("#b0baf0");
  const [icone, setIcone] = useState("fi-br-star");
  const [imagemPreview, setImagemPreview] = useState(null);

  // Estados Hierárquicos
  const [learningPathId, setLearningPathId] = useState("");
  const [serviceLineId, setServiceLineId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [nivel, setNivel] = useState(""); // Júnior, Pleno, Sénior, etc.

  // Estados de Validação Inline
  const [erroSl, setErroSl] = useState('');
  const [erroArea, setErroArea] = useState('');

  // Estados dos Requisitos Dinâmicos
  const [requisitos, setRequisitos] = useState([]);

  // Opções para as dropdowns baseadas nas escolhas do utilizador
  const lpOpcoes = MOCK_HIERARCHY.map(lp => ({ valor: lp.id, label: lp.nome }));
  
  const selectedLP = MOCK_HIERARCHY.find((lp) => lp.id === learningPathId);
  const serviceLinesOptions = selectedLP ? selectedLP.serviceLines : [];
  const slOpcoes = serviceLinesOptions.map(sl => ({ valor: sl.id, label: sl.nome }));

  const selectedSL = serviceLinesOptions.find((sl) => sl.id === serviceLineId);
  const areasOptions = selectedSL ? selectedSL.areas : [];
  const areaOpcoes = areasOptions.map(a => ({ valor: a.id, label: a.nome }));

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (badgeToEdit) {
        setNome(badgeToEdit.nome || "");
        setPontos(badgeToEdit.pontos !== undefined ? badgeToEdit.pontos : "");
        setCor(badgeToEdit.cor || "#b0baf0");
        setIcone(badgeToEdit.icon || "fi-br-star");
        setImagemPreview(badgeToEdit.imagem || null);

        // Simulação da edição da hierarquia e requisitos (se já vierem preenchidos)
        setLearningPathId(badgeToEdit.learningPathId || "");
        setServiceLineId(badgeToEdit.serviceLineId || "");
        setAreaId(badgeToEdit.areaId || "");
        setNivel(badgeToEdit.nivel || "");
        setRequisitos(badgeToEdit.requisitos || []);
      } else {
        setNome("");
        setPontos("");
        setCor("#b0baf0");
        setIcone("fi-br-star");
        setImagemPreview(null);
        setLearningPathId("");
        setServiceLineId("");
        setAreaId("");
        setNivel("");
        setRequisitos([{ id: Date.now(), titulo: '', descricao: '', imagem: null }]); // Inicia com 1 requisito vazio
        setErroSl('');
        setErroArea('');
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, badgeToEdit]);

  if (!isOpen) return null;

  // Resets em Cascata: Se mudar LP, reseta SL e Área. Se mudar SL, reseta Área.
  const handleLpChange = (val) => {
    setLearningPathId(val);
    setServiceLineId('');
    setAreaId('');
    setErroSl(''); // Limpa o erro se o user afinal clicou no correto
  };

  const handleSlChange = (val) => {
    setServiceLineId(val);
    setAreaId('');
    setErroArea(''); // Limpa o erro
  };

  // Funções para gerir Requisitos Dinâmicos
  const handleAddRequisito = () => {
    setRequisitos([
      ...requisitos,
      { id: Date.now(), titulo: "", descricao: "", imagem: null },
    ]);
  };

  const handleRemoveRequisito = (id) => {
    setRequisitos(requisitos.filter((req) => req.id !== id));
  };

  const handleUpdateRequisito = (id, field, value) => {
    setRequisitos(
      requisitos.map((req) =>
        req.id === id ? { ...req, [field]: value } : req,
      ),
    );
  };

  const handleRequisitoImageUpload = (id, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpdateRequisito(id, "imagem", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagemPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!nome.trim() || pontos === "" || !areaId || !nivel.trim()) {
      alert(
        "Por favor preenche todos os campos obrigatórios, incluindo Área e Nível.",
      );
      return;
    }

    // A Categoria genérica anterior pode ser usada agora para guardar o "Nome da Área" temporariamente na tabela
    const areaName =
      areasOptions.find((a) => a.id === areaId)?.nome || "Sem Categoria";

    const newBadge = {
      id: badgeToEdit ? badgeToEdit.id : Date.now(),
      nome,
      categoria: areaName, // Mantém compatibilidade com a tabela visual
      learningPathId,
      serviceLineId,
      areaId,
      nivel,
      pontos: parseInt(pontos) || 0,
      cor,
      icon: icone,
      imagem: imagemPreview,
      requisitos: requisitos,
    };

    onSave(newBadge);
    onClose();
  };

  return ReactDOM.createPortal(
    <div className="badge-modal-overlay" onClick={onClose}>
      <div
        className="badge-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="badge-modal-header">
          <h4>
            {badgeToEdit ? "Editar Nível & Badge" : "Criar Nível & Badge"}
          </h4>
          <button className="badge-modal-close-btn" onClick={onClose}>
            <i className="fi fi-br-cross"></i>
          </button>
        </div>

        <form
          id="badge-form"
          className="badge-modal-body"
          onSubmit={handleSave}
        >
          <div className="badge-preview-container">
            <div className="badge-preview-label">Pré-visualização</div>
            <div className="preview-circle" style={{ backgroundColor: imagemPreview ? 'transparent' : cor }}>
              {imagemPreview ? <img src={imagemPreview} alt="Preview" /> : <i className={`fi ${icone}`}></i>}
            </div>
            <div className="preview-name">{nome || 'Nome do Badge'}</div>
            {nivel && <div className="preview-category">Nível: {nivel}</div>}
          </div>

          <div className="row">
            <div className="col-md-6 badge-form-group">
              <label className="badge-form-label">Nome do Badge</label>
              <input type="text" className="badge-form-input" placeholder="Ex: Badge Júnior em Outsystems" value={nome} onChange={e => setNome(e.target.value)} required />
            </div>
            <div className="col-md-6 badge-form-group">
              <label className="badge-form-label">Nível (Ex: Júnior, A1)</label>
              <input type="text" className="badge-form-input" placeholder="Ex: Júnior" value={nivel} onChange={e => setNivel(e.target.value)} required />
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-12 badge-form-group">
              <label className="badge-form-label">
                Learning Path
              </label>
              <BotaoDropdown 
                 titulo="Selecione..." 
                 valor={learningPathId} 
                 opcoes={lpOpcoes} 
                 onChange={val => handleLpChange(val)}
                 mostrarTituloNoValor={false}
              />
            </div>
            <div className="col-md-12 badge-form-group">
              <label className="badge-form-label">
                Service Line
              </label>
              <div onClickCapture={e => {
                if (!learningPathId) {
                  e.stopPropagation();
                  setErroSl('Por favor, escolha primeiro o Learning Path.');
                }
              }}>
                <BotaoDropdown 
                   titulo="Selecione..." 
                   valor={serviceLineId} 
                   opcoes={slOpcoes} 
                   onChange={val => handleSlChange(val)}
                   mostrarTituloNoValor={false}
                />
              </div>
              {erroSl && <div style={{color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.2rem'}}>{erroSl}</div>}
            </div>
            <div className="col-md-12 badge-form-group">
              <label className="badge-form-label">Área</label>
              <div onClickCapture={e => {
                if (!serviceLineId) {
                  e.stopPropagation();
                  setErroArea('Por favor, escolha primeiro a Service Line.');
                }
              }}>
                <BotaoDropdown 
                   titulo="Selecione..." 
                   valor={areaId} 
                   opcoes={areaOpcoes} 
                   onChange={val => setAreaId(val)}
                   mostrarTituloNoValor={false}
                />
              </div>
              {erroArea && <div style={{color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.2rem'}}>{erroArea}</div>}
            </div>
          </div>

          <div className="badge-section-title mt-2">Identidade Visual</div>

          <div className="row">
            <div className="col-md-6 badge-form-group">
              <label className="badge-form-label">Cor Primária (Opcional)</label>
              <div className="badge-color-picker-wrap">
                <input
                  type="color"
                  className="badge-color-input"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                />
                <span style={{ fontFamily: "monospace", color: "#6c757d" }}>
                  {cor.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="col-md-6 badge-form-group">
              <label className="badge-form-label">Pontos</label>
              <input
                type="number"
                className="badge-form-input"
                placeholder="Ex: 50"
                value={pontos}
                onChange={(e) => setPontos(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="badge-form-group">
            <label className="badge-form-label">Imagem do Badge (Opcional)</label>
            <label className="badge-upload-zone">
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageUpload}
              />
              <i className="fi fi-br-cloud-upload badge-upload-icon"></i>
              <div className="badge-upload-text">
                Clique ou arraste uma imagem para fazer upload
              </div>
            </label>
          </div>

          <div className="badge-form-group">
            <label className="badge-form-label">Ou escolha um Ícone</label>
            <div className="badge-icon-grid">
              {ICON_OPTIONS.map((iconClass) => (
                <div
                  key={iconClass}
                  className={`badge-icon-option ${icone === iconClass && !imagemPreview ? "selected" : ""}`}
                  onClick={() => {
                    setIcone(iconClass);
                    setImagemPreview(null);
                  }}
                  title={iconClass}
                >
                  <i className={`fi ${iconClass}`}></i>
                </div>
              ))}
            </div>
          </div>

          <div className="badge-requisitos-section">
            <div className="badge-section-title">
              Requisitos para o Nível
              <button
                type="button"
                className="btn-add-requisito"
                onClick={handleAddRequisito}
              >
                <i className="fi fi-br-plus"></i> Adicionar Requisito
              </button>
            </div>

            {requisitos.length === 0 && (
              <div className="text-muted text-center py-4">
                Nenhum requisito adicionado. Clique no botão acima para
                adicionar.
              </div>
            )}

            {requisitos.map((req, index) => (
              <div key={req.id} className="requisito-card">
                {requisitos.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove-requisito"
                    onClick={() => handleRemoveRequisito(req.id)}
                    title="Remover Requisito"
                  >
                    <i className="fi fi-br-cross"></i>
                  </button>
                )}
                <div
                  className="badge-form-label mb-3"
                  style={{ color: "var(--barra_lateral)" }}
                >
                  Requisito #{index + 1}
                </div>

                <div className="row">
                  <div className="col-md-8">
                    <div className="badge-form-group mb-2">
                      <input
                        type="text"
                        className="badge-form-input"
                        placeholder="Título (Ex: A1 - Certificação AWS)"
                        value={req.titulo}
                        onChange={(e) =>
                          handleUpdateRequisito(
                            req.id,
                            "titulo",
                            e.target.value,
                          )
                        }
                        required
                      />
                    </div>
                    <div className="badge-form-group mb-0">
                      <textarea
                        className="badge-form-textarea"
                        placeholder="Descrição e evidências necessárias..."
                        value={req.descricao}
                        onChange={(e) =>
                          handleUpdateRequisito(
                            req.id,
                            "descricao",
                            e.target.value,
                          )
                        }
                        style={{ minHeight: "80px" }}
                        required
                      ></textarea>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="requisito-upload-zone w-100 h-100 m-0">
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => handleRequisitoImageUpload(req.id, e)}
                      />
                      {req.imagem ? (
                        <img
                          src={req.imagem}
                          alt="Preview Requisito"
                          className="requisito-preview-img"
                        />
                      ) : (
                        <>
                          <i
                            className="fi fi-br-picture badge-upload-icon mb-1"
                            style={{ fontSize: "1.2rem" }}
                          ></i>
                          <div
                            className="badge-upload-text"
                            style={{ fontSize: "0.8rem" }}
                          >
                            Imagem
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </form>

        <div className="badge-modal-footer">
          <button type="button" className="badge-btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="badge-form" className="badge-btn-save">
            <i className="fi fi-br-disk"></i> Guardar Nível & Badge
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
