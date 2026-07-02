import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import "./BadgeModal.css";
import BotaoDropdown from "../ui/BotaoDropdown/BotaoDropdown";
import BadgeCirculo from "../Galeria/BadgeCirculo/BadgeCirculo";

const LEARNING_PATHS = [
  {
    id: 1,
    nome: "Backend Dev",
  },
  {
    id: 2,
    nome: "Frontend Dev",
  },
  {
    id: 3,
    nome: "Data & Analytics",
  },
  {
    id: 4,
    nome: "Cloud & DevOps",
  },
];

const SERVICE_LINES = [
  {
    id: 1,
    idLearningPath: 1,
    nome: "Software Engineering",
  },
  {
    id: 2,
    idLearningPath: 3,
    nome: "Data Insights",
  },
  {
    id: 3,
    idLearningPath: 4,
    nome: "Cloud Services",
  },
];

const AREAS = [
  {
    id: 1,
    idServiceLine: 1,
    nome: "Java Core",
  },
  {
    id: 2,
    idServiceLine: 1,
    nome: "Node.js & TypeScript",
  },
  {
    id: 3,
    idServiceLine: 1,
    nome: "React & Web UI",
  },
  {
    id: 4,
    idServiceLine: 2,
    nome: "Python Data Science",
  },
  {
    id: 5,
    idServiceLine: 3,
    nome: "AWS Architecture",
  },
];

const NIVEIS = [
  {
    id: 1,
    nome: "Junior",
  },
  {
    id: 2,
    nome: "Intermédio",
  },
  {
    id: 3,
    nome: "Sénior",
  },
  {
    id: 4,
    nome: "Especialista",
  },
  {
    id: 5,
    nome: "Líder de conhecimento",
  },
];

function encontrarAreaPorNome(nomeArea) {
  if (!nomeArea) return null;

  return AREAS.find(
    (area) => area.nome.toLowerCase() === String(nomeArea).toLowerCase()
  );
}

function encontrarNivelPorNome(nomeNivel) {
  if (!nomeNivel) return null;

  return NIVEIS.find(
    (nivel) => nivel.nome.toLowerCase() === String(nomeNivel).toLowerCase()
  );
}

function criarRequisitoVazio() {
  return {
    id: `tmp-${Date.now()}-${Math.random()}`,
    nome_requisito: "",
    descricao_requisito: "",
  };
}

const REQUISITOS_MOCK = [
  { id: 1, nome: "Certificação AWS Cloud Practitioner", descricao: "Apresentar certificado válido da AWS." },
  { id: 2, nome: "Curso de Node.js", descricao: "Conclusão de curso de Node.js com mais de 20 horas." },
  { id: 3, nome: "Formação React Avançado", descricao: "Certificado de conclusão de React Hooks e Context API." },
  { id: 4, nome: "Participação em Projeto Interno", descricao: "Ter estado envolvido em pelo menos 1 projeto interno na respetiva área." },
  { id: 5, nome: "Avaliação de Desempenho", descricao: "Ter avaliação positiva na última revisão semestral." }
];

export default function BadgeModal({ isOpen, onClose, onSave, badgeToEdit }) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [pontos, setPontos] = useState("");
  const [validade, setValidade] = useState("");
  const [imagemPreview, setImagemPreview] = useState(null);
  const [isEspecial, setIsEspecial] = useState(false);

  const [learningPathId, setLearningPathId] = useState("");
  const [serviceLineId, setServiceLineId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [nivelId, setNivelId] = useState("");

  const [erroSl, setErroSl] = useState("");
  const [erroArea, setErroArea] = useState("");
  const [formErro, setFormErro] = useState("");

  const [requisitos, setRequisitos] = useState([]);
  const [focusedRequisitoId, setFocusedRequisitoId] = useState(null);

  const lpOpcoes = LEARNING_PATHS.map((learningPath) => ({
    valor: learningPath.id,
    label: learningPath.nome,
  }));

  const serviceLinesFiltradas = useMemo(() => {
    if (!learningPathId) return [];

    return SERVICE_LINES.filter(
      (serviceLine) => serviceLine.idLearningPath === Number(learningPathId)
    );
  }, [learningPathId]);

  const slOpcoes = serviceLinesFiltradas.map((serviceLine) => ({
    valor: serviceLine.id,
    label: serviceLine.nome,
  }));

  const areasFiltradas = useMemo(() => {
    if (!serviceLineId) return [];

    return AREAS.filter(
      (area) => area.idServiceLine === Number(serviceLineId)
    );
  }, [serviceLineId]);

  const areaOpcoes = areasFiltradas.map((area) => ({
    valor: area.id,
    label: area.nome,
  }));

  const nivelOpcoes = NIVEIS.map((nivel) => ({
    valor: nivel.id,
    label: nivel.nome,
  }));

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    setFormErro("");
    setErroSl("");
    setErroArea("");

    if (badgeToEdit) {
      const areaExistente =
        Number(badgeToEdit.id_area) ||
        Number(badgeToEdit.areaId) ||
        Number(badgeToEdit.idArea) ||
        encontrarAreaPorNome(
          badgeToEdit.area ||
            badgeToEdit.nomeArea ||
            badgeToEdit.categoria
        )?.id ||
        "";

      const areaSelecionada = AREAS.find(
        (area) => area.id === Number(areaExistente)
      );

      const serviceLineSelecionada = areaSelecionada
        ? SERVICE_LINES.find(
            (serviceLine) =>
              serviceLine.id === areaSelecionada.idServiceLine
          )
        : null;

      const nivelExistente =
        Number(badgeToEdit.id_nivel) ||
        Number(badgeToEdit.nivelId) ||
        Number(badgeToEdit.idNivel) ||
        encontrarNivelPorNome(badgeToEdit.nivel || badgeToEdit.nomeNivel)?.id ||
        "";

      setNome(badgeToEdit.nome_badge || badgeToEdit.nome || "");
      setDescricao(badgeToEdit.descricao_badge || badgeToEdit.descricao || "");
      setPontos(
        badgeToEdit.pontos_badge !== undefined
          ? badgeToEdit.pontos_badge
          : badgeToEdit.pontos !== undefined
            ? badgeToEdit.pontos
            : ""
      );
      setValidade(badgeToEdit.validade || "");
      setImagemPreview(badgeToEdit.imagem || null);
      setIsEspecial(Boolean(badgeToEdit.especial));

      setAreaId(areaExistente);
      setServiceLineId(serviceLineSelecionada?.id || "");
      setLearningPathId(serviceLineSelecionada?.idLearningPath || "");
      setNivelId(nivelExistente);

      const requisitosExistentes = Array.isArray(badgeToEdit.requisitos)
        ? badgeToEdit.requisitos
            .filter((req) => typeof req === "object")
            .map((req) => ({
              id: req.id || req.id_requisito || `tmp-${Date.now()}-${Math.random()}`,
              nome_requisito:
                req.nome_requisito || req.titulo || req.nome || "",
              descricao_requisito:
                req.descricao_requisito || req.descricao || "",
            }))
        : [];

      setRequisitos(requisitosExistentes);
    } else {
      setNome("");
      setDescricao("");
      setPontos("");
      setValidade("");
      setImagemPreview(null);
      setIsEspecial(false);

      setLearningPathId("");
      setServiceLineId("");
      setAreaId("");
      setNivelId("");

      setRequisitos([]);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, badgeToEdit]);

  if (!isOpen) return null;

  function handleLpChange(valor) {
    setLearningPathId(valor);
    setServiceLineId("");
    setAreaId("");
    setErroSl("");
    setErroArea("");
    setFormErro("");
  }

  function handleSlChange(valor) {
    setServiceLineId(valor);
    setAreaId("");
    setErroArea("");
    setFormErro("");
  }

  function handleAddRequisito() {
    setRequisitos((requisitosAtuais) => [
      ...requisitosAtuais,
      criarRequisitoVazio(),
    ]);
  }

  function handleRemoveRequisito(id) {
    setRequisitos((requisitosAtuais) =>
      requisitosAtuais.filter((requisito) => requisito.id !== id)
    );
  }

  function handleUpdateRequisito(id, campo, valor) {
    setRequisitos((requisitosAtuais) =>
      requisitosAtuais.map((requisito) =>
        requisito.id === id
          ? {
              ...requisito,
              [campo]: valor,
            }
          : requisito
      )
    );
  }

  function handleNomeRequisitoChange(idReq, novoNome) {
    // Atualiza o nome escrito pelo utilizador
    handleUpdateRequisito(idReq, "nome_requisito", novoNome);

    // Se houver um match exato (selecionado do autocomplete), auto-preenche a descrição
    const reqEncontrado = REQUISITOS_MOCK.find(r => r.nome.toLowerCase() === novoNome.toLowerCase());
    if (reqEncontrado) {
      handleUpdateRequisito(idReq, "descricao_requisito", reqEncontrado.descricao);
    }
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setImagemPreview(reader.result);
      setFormErro("");
    };

    reader.readAsDataURL(file);
  }

  function validarRequisitos() {
    return requisitos.every((requisito) => {
      const nomeValido = requisito.nome_requisito.trim();
      const descricaoValida = requisito.descricao_requisito.trim();

      return nomeValido && descricaoValida;
    });
  }

  function handleSave(event) {
    event.preventDefault();
    setFormErro("");

    if (
      !nome.trim() ||
      pontos === "" ||
      validade === "" ||
      !learningPathId ||
      !serviceLineId ||
      !areaId ||
      !nivelId ||
      !imagemPreview
    ) {
      setFormErro(
        "Preenche todos os campos obrigatórios: nome, hierarquia, nível, pontos, validade e imagem."
      );
      return;
    }

    if (!validarRequisitos()) {
      setFormErro(
        "Todos os requisitos adicionados têm de ter nome e descrição."
      );
      return;
    }

    const areaSelecionada = AREAS.find(
      (area) => area.id === Number(areaId)
    );

    const serviceLineSelecionada = SERVICE_LINES.find(
      (serviceLine) => serviceLine.id === Number(serviceLineId)
    );

    const learningPathSelecionado = LEARNING_PATHS.find(
      (learningPath) => learningPath.id === Number(learningPathId)
    );

    const nivelSelecionado = NIVEIS.find(
      (nivel) => nivel.id === Number(nivelId)
    );

    const requisitosValidos = requisitos
      .filter(
        (requisito) =>
          requisito.nome_requisito.trim() &&
          requisito.descricao_requisito.trim()
      )
      .map((requisito) => ({
        id: requisito.id,
        nome_requisito: requisito.nome_requisito.trim(),
        descricao_requisito: requisito.descricao_requisito.trim(),
      }));

    const badgeNormalizado = {
      id: badgeToEdit ? badgeToEdit.id : Date.now(),

      id_badge: badgeToEdit?.id_badge,
      id_area: Number(areaId),
      id_nivel: Number(nivelId),
      validade: Number(validade),
      especial: Boolean(isEspecial),
      pontos_badge: Number(pontos),
      nome_badge: nome.trim(),
      imagem: imagemPreview,
      descricao_badge: descricao.trim(),

      nome: nome.trim(),
      categoria: areaSelecionada?.nome || "Sem Área",
      area: areaSelecionada?.nome || "Sem Área",
      nomeArea: areaSelecionada?.nome || "Sem Área",
      learningPath: learningPathSelecionado?.nome || "",
      serviceLine: serviceLineSelecionada?.nome || "",
      nivel: nivelSelecionado?.nome || "",
      pontos: Number(pontos),

      requisitos: requisitosValidos,
    };

    onSave(badgeNormalizado);
    onClose();
  }

  return ReactDOM.createPortal(
    <div className="badge-modal-overlay" onClick={onClose}>
      <div
        className="badge-modal-container"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="badge-modal-header">
          <h4>{badgeToEdit ? "Editar Badge" : "Criar Badge"}</h4>

          <button
            type="button"
            className="badge-modal-close-btn"
            onClick={onClose}
            aria-label="Fechar"
          >
            <i className="fi fi-br-cross"></i>
          </button>
        </div>

        <form
          id="badge-form"
          className="badge-modal-body"
          onSubmit={handleSave}
        >
          {formErro && (
            <div
              className="alert alert-danger d-flex align-items-center gap-2 mb-3"
              style={{
                fontSize: "0.85rem",
                padding: "0.75rem",
              }}
            >
              <i className="fi fi-br-info"></i>
              {formErro}
            </div>
          )}

          <div className="badge-preview-container">
            <div className="badge-preview-label">Pré-visualização</div>

            <div
              className="d-flex justify-content-center mb-3"
              style={{ transform: "scale(1.2)" }}
            >
              <BadgeCirculo
                imagemBadge={imagemPreview}
                nomeBadge={nome}
                especial={isEspecial}
                tipoEspecial={isEspecial ? "gold" : null}
              />
            </div>

            <div className="preview-name">{nome || "Nome do Badge"}</div>

            {nivelId && (
              <div className="preview-category">
                Nível:{" "}
                {NIVEIS.find((nivel) => nivel.id === Number(nivelId))?.nome}
              </div>
            )}
          </div>

          <div className="badge-section-title mt-2">Informação do Badge</div>

          <div className="row">
            <div className="col-md-6 badge-form-group">
              <label className="badge-form-label">Nome do Badge</label>
              <input
                type="text"
                className="badge-form-input"
                placeholder="Ex: Java Junior Starter"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                required
              />
            </div>

            <div className="col-md-6 badge-form-group">
              <label className="badge-form-label">Nível</label>
              <BotaoDropdown
                titulo="Selecione..."
                valor={nivelId}
                opcoes={nivelOpcoes}
                onChange={setNivelId}
                mostrarTituloNoValor={false}
              />
            </div>
          </div>

          <div className="badge-form-group">
            <label className="badge-form-label">Descrição do Badge</label>
            <textarea
              className="badge-form-textarea"
              placeholder="Descrição do badge..."
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
            />
          </div>

          <div className="badge-form-group">
            <label className="badge-form-label">Learning Path</label>
            <BotaoDropdown
              titulo="Selecione..."
              valor={learningPathId}
              opcoes={lpOpcoes}
              onChange={handleLpChange}
              mostrarTituloNoValor={false}
            />
          </div>

          <div className="badge-form-group">
            <label className="badge-form-label">Service Line</label>
            <div
              onClickCapture={(event) => {
                if (!learningPathId) {
                  event.stopPropagation();
                  setErroSl("Escolhe primeiro o Learning Path.");
                }
              }}
            >
              <BotaoDropdown
                titulo="Selecione..."
                valor={serviceLineId}
                opcoes={slOpcoes}
                onChange={handleSlChange}
                mostrarTituloNoValor={false}
              />
            </div>

            {erroSl && (
              <div style={{ color: "#ff4d4d", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                {erroSl}
              </div>
            )}
          </div>

          <div className="badge-form-group">
            <label className="badge-form-label">Área</label>
            <div
              onClickCapture={(event) => {
                if (!serviceLineId) {
                  event.stopPropagation();
                  setErroArea("Escolhe primeiro a Service Line.");
                }
              }}
            >
              <BotaoDropdown
                titulo="Selecione..."
                valor={areaId}
                opcoes={areaOpcoes}
                onChange={setAreaId}
                mostrarTituloNoValor={false}
              />
            </div>

            {erroArea && (
              <div style={{ color: "#ff4d4d", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                {erroArea}
              </div>
            )}
          </div>

          <div className="badge-section-title mt-2">Configuração</div>

          <div className="badge-form-group">
            <label className="badge-form-label mb-3">Tipo de Badge</label>

            <div className="d-flex gap-3">
              <button
                type="button"
                className={`badge-tipo-opcao badge-tipo-opcao--normal ${
                  !isEspecial ? "ativo" : ""
                }`}
                onClick={() => setIsEspecial(false)}
              >
                Normal
              </button>

              <button
                type="button"
                className={`badge-tipo-opcao badge-tipo-opcao--especial ${
                  isEspecial ? "ativo" : ""
                }`}
                onClick={() => setIsEspecial(true)}
              >
                Especial
              </button>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 badge-form-group">
              <label className="badge-form-label">Pontos</label>
              <input
                type="number"
                className="badge-form-input"
                placeholder="Ex: 50"
                min="0"
                value={pontos}
                onChange={(event) => setPontos(event.target.value)}
                required
              />
            </div>

            <div className="col-md-6 badge-form-group">
              <label className="badge-form-label">Validade em dias</label>
              <input
                type="number"
                className="badge-form-input"
                placeholder="Ex: 365"
                min="1"
                value={validade}
                onChange={(event) => setValidade(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="badge-form-group">
            <label className="badge-form-label">Imagem do Badge</label>

            <label className="badge-upload-zone">
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageUpload}
                required={!imagemPreview}
              />

              <i className="fi fi-br-cloud-upload badge-upload-icon"></i>

              <div className="badge-upload-text">
                {imagemPreview
                  ? "Imagem carregada. Clica para trocar."
                  : "Clique ou arraste uma imagem para fazer upload"}
              </div>
            </label>
          </div>

          <div className="badge-requisitos-section">
            <div className="badge-section-title">
              Requisitos
              <button
                type="button"
                className="btn-add-requisito"
                onClick={handleAddRequisito}
              >
                <i className="fi fi-br-plus"></i>
                Adicionar Requisito
              </button>
            </div>

            {requisitos.length === 0 && (
              <div className="text-muted text-center py-4">
                Nenhum requisito associado.
              </div>
            )}

            {requisitos.map((requisito, index) => (
              <div key={requisito.id} className="requisito-card">
                <div className="requisito-card-cabecalho">
                  <span className="requisito-card-titulo">
                    Requisito #{index + 1}
                  </span>

                  <button
                    type="button"
                    className="btn-remove-requisito"
                    onClick={() => handleRemoveRequisito(requisito.id)}
                    title="Remover requisito"
                    aria-label="Remover requisito"
                  >
                    <i className="fi fi-br-cross-small"></i>
                  </button>
                </div>

                <div className="badge-form-group mb-2 position-relative">
                  <input
                    type="text"
                    className="badge-form-input"
                    placeholder="Nome do requisito (Pesquise ou crie um novo)"
                    value={requisito.nome_requisito}
                    onChange={(event) =>
                      handleNomeRequisitoChange(requisito.id, event.target.value)
                    }
                    onFocus={() => setFocusedRequisitoId(requisito.id)}
                    onBlur={() => setTimeout(() => setFocusedRequisitoId(null), 200)}
                    autoComplete="off"
                  />
                  {focusedRequisitoId === requisito.id && requisito.nome_requisito.length > 0 && (
                    (() => {
                      const termoPesquisa = requisito.nome_requisito.toLowerCase();
                      const sugestoes = REQUISITOS_MOCK.filter(r => 
                        r.nome.toLowerCase().includes(termoPesquisa) && 
                        r.nome.toLowerCase() !== termoPesquisa
                      ).slice(0, 3);

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
                            zIndex: 10,
                            overflow: 'hidden'
                          }}
                        >
                          {sugestoes.map((s, idx) => (
                            <div 
                              key={s.id}
                              style={{ 
                                padding: '10px 14px', 
                                cursor: 'pointer', 
                                borderBottom: idx < sugestoes.length - 1 ? '1px solid #f0f4f8' : 'none',
                                fontSize: '0.85rem',
                                color: 'var(--fontes)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                              onMouseDown={() => handleNomeRequisitoChange(requisito.id, s.nome)}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f4f8'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                            >
                              <i className="fi fi-br-search text-muted" style={{ fontSize: '0.75rem' }}></i>
                              {s.nome}
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>

                <div className="badge-form-group mb-0">
                  <textarea
                    className="badge-form-textarea"
                    placeholder="Descrição do requisito..."
                    value={requisito.descricao_requisito}
                    onChange={(event) =>
                      handleUpdateRequisito(
                        requisito.id,
                        "descricao_requisito",
                        event.target.value
                      )
                    }
                    style={{ minHeight: "80px" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </form>

        <div className="badge-modal-footer">
          <button
            type="button"
            className="badge-btn-cancel"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="badge-form"
            className="badge-btn-save"
          >
            <i className="fi fi-br-disk"></i>
            Guardar Badge
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}