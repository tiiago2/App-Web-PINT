import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./AreaModal.css"; // Reuse the same CSS since layout is identical
import BotaoDropdown from "../ui/BotaoDropdown/BotaoDropdown";

// 1. MOCK DATA HIERÁRQUICO
const MOCK_HIERARCHY = [
  {
    id: "lp1",
    nome: "Jornada Técnica",
  },
];

// Mock de utilizadores para seleção quando sem API ligada
const MOCK_UTILIZADORES_CANDIDATOS = [
  { id: 1, id_utilizador: 1, nome: "Gonçalo Ferreira", nome_user: "Gonçalo Ferreira", email: "goncalo@softinsa.pt" },
  { id: 2, id_utilizador: 2, nome: "Ana Silva", nome_user: "Ana Silva", email: "ana.silva@softinsa.pt" },
  { id: 3, id_utilizador: 3, nome: "Carlos Oliveira", nome_user: "Carlos Oliveira", email: "carlos.o@softinsa.pt" },
  { id: 4, id_utilizador: 4, nome: "Mariana Costa", nome_user: "Mariana Costa", email: "mariana.costa@softinsa.pt" },
  { id: 5, id_utilizador: 5, nome: "Pedro Santos", nome_user: "Pedro Santos", email: "pedro.santos@softinsa.pt" },
];

export default function ServiceLineModal({ 
  isOpen, 
  onClose, 
  onSave, 
  serviceLineToEdit, 
  utilizadoresElegiveis = [], 
  learningPaths = [] 
}) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [learningPathId, setLearningPathId] = useState("");
  const [formErro, setFormErro] = useState("");

  // Estados para seleção de Líder com pesquisa preditiva
  const [liderPesquisa, setLiderPesquisa] = useState("");
  const [idLider, setIdLider] = useState(null);
  const [nomeLider, setNomeLider] = useState("");
  const [focusedLider, setFocusedLider] = useState(false);

  const listaCandidatos = utilizadoresElegiveis.length > 0 ? utilizadoresElegiveis : MOCK_UTILIZADORES_CANDIDATOS;
  const listaLPs = learningPaths.length > 0 ? learningPaths : MOCK_HIERARCHY;

  const lpOpcoes = listaLPs.map((lp) => ({
    valor: String(lp.id_learning_path ?? lp.idLearningPath ?? lp.id ?? ""),
    label: lp.nome_learning_path ?? lp.nomeLearningPath ?? lp.nome ?? lp.learningPath ?? "",
  }));

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (serviceLineToEdit) {
        setNome(serviceLineToEdit.nome || serviceLineToEdit.nome_service_line || "");
        setDescricao(serviceLineToEdit.descricao || serviceLineToEdit.descricao_service_line || "");
        setLearningPathId(serviceLineToEdit.learningPathId || serviceLineToEdit.id_learning_path || "");
        
        const liderExistenteNome = serviceLineToEdit.lider || serviceLineToEdit.nome_lider || serviceLineToEdit.liderNome || "";
        const liderExistenteId = serviceLineToEdit.id_lider || serviceLineToEdit.idLider || serviceLineToEdit.liderId || null;

        setLiderPesquisa(liderExistenteNome);
        setIdLider(liderExistenteId);
        setNomeLider(liderExistenteNome);
      } else {
        setNome("");
        setDescricao("");
        setLearningPathId("");
        setLiderPesquisa("");
        setIdLider(null);
        setNomeLider("");
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

    if (!liderPesquisa.trim()) {
      setFormErro("Por favor, selecione um Líder para a Service Line.");
      return;
    }

    // Tenta encontrar um id de líder na lista se não tiver sido selecionado explicitamente
    let idLiderFinal = idLider;
    let nomeLiderFinal = nomeLider || liderPesquisa.trim();

    if (!idLiderFinal) {
      const match = listaCandidatos.find(u => 
        (u.nome || u.nome_user || "").toLowerCase() === liderPesquisa.trim().toLowerCase()
      );
      if (match) {
        idLiderFinal = match.id || match.id_utilizador;
        nomeLiderFinal = match.nome || match.nome_user;
      }
    }

    const newSL = {
      id: serviceLineToEdit ? (serviceLineToEdit.id || serviceLineToEdit.id_service_line) : Date.now(),
      id_service_line: serviceLineToEdit ? (serviceLineToEdit.id || serviceLineToEdit.id_service_line) : Date.now(),
      nome: nome.trim(),
      nome_service_line: nome.trim(),
      descricao: descricao.trim(),
      descricao_service_line: descricao.trim(),
      learningPathId,
      id_learning_path: learningPathId,
      id_lider: idLiderFinal || 1,
      lider: nomeLiderFinal,
      nome_lider: nomeLiderFinal,
      badges: serviceLineToEdit?.badges ?? 0,
      elementos: serviceLineToEdit?.elementos ?? 0,
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

            {/* Campo do Líder da Service Line com Pesquisa Autocompletar */}
            <div className="col-md-12 area-form-group position-relative">
              <label className="area-form-label">Líder da Service Line</label>
              <input
                type="text"
                className="area-form-input"
                placeholder="Pesquise o nome ou email do líder..."
                value={liderPesquisa}
                onChange={(e) => {
                  setLiderPesquisa(e.target.value);
                  setIdLider(null);
                  setNomeLider("");
                  setFormErro("");
                }}
                onFocus={() => setFocusedLider(true)}
                onBlur={() => setTimeout(() => setFocusedLider(false), 200)}
                autoComplete="off"
                required
              />

              {focusedLider && liderPesquisa.trim().length > 0 && (
                (() => {
                  const termo = liderPesquisa.toLowerCase();
                  const sugestoes = listaCandidatos.filter(u =>
                    ((u.nome || u.nome_user || "").toLowerCase().includes(termo) || 
                     (u.email || "").toLowerCase().includes(termo)) &&
                    (u.nome || u.nome_user || "").toLowerCase() !== termo
                  ).slice(0, 5);

                  if (sugestoes.length === 0) return null;

                  return (
                    <div
                      className="sugestoes-dropdown"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: '#fff',
                        border: '1px solid #cad5e2',
                        borderTop: 'none',
                        borderRadius: '0 0 8px 8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 20,
                        overflow: 'hidden'
                      }}
                    >
                      {sugestoes.map((user, idx) => (
                        <div
                          key={user.id || user.id_utilizador || idx}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            borderBottom: idx < sugestoes.length - 1 ? '1px solid #f0f4f8' : 'none',
                            fontSize: '0.85rem',
                            color: 'var(--fontes)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px'
                          }}
                          onMouseDown={() => {
                            const nomeMatch = user.nome || user.nome_user;
                            const idMatch = user.id || user.id_utilizador;
                            setLiderPesquisa(nomeMatch);
                            setIdLider(idMatch);
                            setNomeLider(nomeMatch);
                            setFormErro("");
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f4f8'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <i className="fi fi-br-user text-muted" style={{ fontSize: '0.75rem' }}></i>
                            <span>{user.nome || user.nome_user}</span>
                          </div>
                          {user.email && <span className="text-muted" style={{ fontSize: '0.75rem' }}>{user.email}</span>}
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
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

