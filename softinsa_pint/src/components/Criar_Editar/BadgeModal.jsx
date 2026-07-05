import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import "./BadgeModal.css";
import BotaoDropdown from "../ui/BotaoDropdown/BotaoDropdown";
import BadgeCirculo from "../Galeria/BadgeCirculo/BadgeCirculo";

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

function obterIdLearningPath(learningPath = {}) {
  return learningPath.id_learning_path ?? learningPath.idLearningPath ?? learningPath.id;
}

function obterNomeLearningPath(learningPath = {}) {
  return learningPath.nome_learning_path ?? learningPath.nomeLearningPath ?? learningPath.nome ?? learningPath.learningPath ?? "";
}

function obterIdServiceLine(serviceLine = {}) {
  return serviceLine.id_service_line ?? serviceLine.idServiceLine ?? serviceLine.id;
}

function obterNomeServiceLine(serviceLine = {}) {
  return serviceLine.nome_service_line ?? serviceLine.nomeServiceLine ?? serviceLine.nome ?? serviceLine.serviceLine ?? "";
}

function obterIdLearningPathDaServiceLine(serviceLine = {}) {
  return serviceLine.id_learning_path ?? serviceLine.idLearningPath ?? serviceLine.learningPathId;
}

function obterIdArea(area = {}) {
  return area.id_area ?? area.idArea ?? area.id;
}

function obterNomeArea(area = {}) {
  return area.nome_area ?? area.nomeArea ?? area.nome ?? area.area ?? "";
}

function obterIdServiceLineDaArea(area = {}) {
  return area.id_service_line ?? area.idServiceLine ?? area.serviceLineId;
}

function obterIdNivel(nivel = {}) {
  return nivel.id_nivel ?? nivel.idNivel ?? nivel.id;
}

function obterNomeNivel(nivel = {}) {
  return nivel.nome_nivel ?? nivel.nomeNivel ?? nivel.nome ?? nivel.nivel ?? "";
}

function criarRequisitoVazio() {
  return {
    id: `tmp-${Date.now()}-${Math.random()}`,
    nome_requisito: "",
    descricao_requisito: "",
  };
}

export default function BadgeModal({ 
  isOpen, 
  onClose, 
  onSave, 
  badgeToEdit, 
  learningPaths = [], 
  serviceLines = [], 
  areas = [],
  niveis = []
}) {
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
  const [isSaving, setIsSaving] = useState(false);

  const listaLPs = useMemo(
    () => (Array.isArray(learningPaths) ? learningPaths : []),
    [learningPaths]
  );
  const listaSLs = useMemo(
    () => (Array.isArray(serviceLines) ? serviceLines : []),
    [serviceLines]
  );
  const listaAreas = useMemo(
    () => (Array.isArray(areas) ? areas : []),
    [areas]
  );
  const listaNiveis = useMemo(
    () => (Array.isArray(niveis) && niveis.length > 0 ? niveis : NIVEIS),
    [niveis]
  );

  const lpOpcoes = listaLPs.map((lp) => ({
    valor: Number(obterIdLearningPath(lp)),
    label: obterNomeLearningPath(lp),
  }));

  const serviceLinesFiltradas = useMemo(() => {
    if (!learningPathId) return [];

    return listaSLs.filter((sl) => {
      const lpId = obterIdLearningPathDaServiceLine(sl);
      return Number(lpId) === Number(learningPathId);
    });
  }, [learningPathId, listaSLs]);

  const semServiceLines = Boolean(learningPathId && serviceLinesFiltradas.length === 0);

  const slOpcoes = semServiceLines
    ? [{ valor: "", label: "Sem Service Lines disponíveis" }]
    : serviceLinesFiltradas.map((sl) => ({
        valor: Number(obterIdServiceLine(sl)),
        label: obterNomeServiceLine(sl),
      }));

  const areasFiltradas = useMemo(() => {
    if (!serviceLineId) return [];

    return listaAreas.filter((a) => {
      const slId = obterIdServiceLineDaArea(a);
      return Number(slId) === Number(serviceLineId);
    });
  }, [serviceLineId, listaAreas]);

  const semAreas = Boolean(serviceLineId && areasFiltradas.length === 0);

  const areaOpcoes = semAreas
    ? [{ valor: "", label: "Sem Áreas disponíveis" }]
    : areasFiltradas.map((a) => ({
        valor: Number(obterIdArea(a)),
        label: obterNomeArea(a),
      }));

  const nivelOpcoes = listaNiveis.map((nivel) => ({
    valor: Number(obterIdNivel(nivel)),
    label: obterNomeNivel(nivel),
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
        "";

      const areaSelecionada = listaAreas.find(
        (area) => Number(obterIdArea(area)) === Number(areaExistente)
      );

      const serviceLineExistente =
        Number(badgeToEdit.id_service_line) ||
        Number(badgeToEdit.idServiceLine) ||
        Number(obterIdServiceLineDaArea(areaSelecionada)) ||
        "";

      const serviceLineSelecionada = listaSLs.find(
        (serviceLine) => Number(obterIdServiceLine(serviceLine)) === Number(serviceLineExistente)
      );

      const learningPathExistente =
        Number(badgeToEdit.id_learning_path) ||
        Number(badgeToEdit.idLearningPath) ||
        Number(obterIdLearningPathDaServiceLine(serviceLineSelecionada)) ||
        "";

      const nivelExistente =
        Number(badgeToEdit.id_nivel) ||
        Number(badgeToEdit.nivelId) ||
        Number(badgeToEdit.idNivel) ||
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
      setValidade(
        badgeToEdit.validade === null || badgeToEdit.validade === undefined
          ? ""
          : badgeToEdit.validade
      );
      setImagemPreview(badgeToEdit.imagem || null);
      setIsEspecial(Boolean(badgeToEdit.especial));

      setAreaId(areaExistente);
      setServiceLineId(serviceLineExistente);
      setLearningPathId(learningPathExistente);
      setNivelId(nivelExistente);

      const requisitosExistentes = Array.isArray(badgeToEdit.requisitos)
        ? badgeToEdit.requisitos
            .filter((req) => typeof req === "object")
            .map((req) => {
              const idRequisito = req.id_requisito ?? req.idRequisito ?? req.id;

              return {
                id: idRequisito || `tmp-${Date.now()}-${Math.random()}`,
                id_requisito: idRequisito,
                nome_requisito: req.nome_requisito || req.titulo || req.nome || "",
                descricao_requisito: req.descricao_requisito || req.descricao || "",
                readOnly: Boolean(idRequisito),
              };
            })
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
  }, [isOpen, badgeToEdit, listaAreas, listaSLs]);

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
    handleUpdateRequisito(idReq, "nome_requisito", novoNome);
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

  async function handleSave(event) {
    event.preventDefault();
    setFormErro("");

    if (
      !nome.trim() ||
      pontos === "" ||
      !learningPathId ||
      !serviceLineId ||
      !areaId ||
      !nivelId ||
      !imagemPreview
    ) {
      setFormErro(
        "Preenche todos os campos obrigatórios: nome, hierarquia, nível, pontos e imagem."
      );
      return;
    }

    if (!validarRequisitos()) {
      setFormErro(
        "Todos os requisitos adicionados têm de ter nome e descrição."
      );
      return;
    }

    const validadeNormalizada =
      String(validade).trim() === "" ? null : Number(validade);

    if (validadeNormalizada !== null && Number.isNaN(validadeNormalizada)) {
      setFormErro("A validade tem de ser um número válido ou ficar vazia.");
      return;
    }

    const requisitosValidos = requisitos
      .filter(
        (requisito) =>
          requisito.nome_requisito.trim() &&
          requisito.descricao_requisito.trim()
      )
      .map((requisito) => {
        if (requisito.id_requisito) {
          return {
            id_requisito: requisito.id_requisito,
          };
        }

        return {
          nome_requisito: requisito.nome_requisito.trim(),
          descricao_requisito: requisito.descricao_requisito.trim(),
        };
      });

    const dadosBadge = {
      nome_badge: nome.trim(),
      descricao_badge: descricao.trim(),
      imagem: imagemPreview,
      pontos_badge: Number(pontos),
      validade: validadeNormalizada,
      especial: Boolean(isEspecial),
      id_area: Number(areaId),
      id_nivel: Number(nivelId),
      requisitos: requisitosValidos,
    };

    setIsSaving(true);

    try {
      await onSave(dadosBadge);
    } catch (error) {
      setFormErro(
        error.response?.data?.error ||
          error.message ||
          "Erro ao guardar o Badge."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleCloseSeguro() {
    if (!isSaving) {
      onClose();
    }
  }

  return ReactDOM.createPortal(
    <div className="badge-modal-overlay" onClick={handleCloseSeguro}>
      <div
        className="badge-modal-container"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="badge-modal-header">
          <h4>{badgeToEdit ? "Editar Badge" : "Criar Badge"}</h4>

          <button
            type="button"
            className="badge-modal-close-btn"
            onClick={handleCloseSeguro}
            disabled={isSaving}
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
                {
                  listaNiveis.find(
                    (nivel) => Number(obterIdNivel(nivel)) === Number(nivelId)
                  ) &&
                    obterNomeNivel(
                      listaNiveis.find(
                        (nivel) => Number(obterIdNivel(nivel)) === Number(nivelId)
                      )
                    )
                }
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
                    placeholder="Nome do requisito"
                    value={requisito.nome_requisito}
                    onChange={(event) =>
                      handleNomeRequisitoChange(requisito.id, event.target.value)
                    }
                    readOnly={requisito.readOnly}
                    disabled={requisito.readOnly}
                    autoComplete="off"
                  />
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
                    readOnly={requisito.readOnly}
                    disabled={requisito.readOnly}
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
            onClick={handleCloseSeguro}
            disabled={isSaving}
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="badge-form"
            className="badge-btn-save"
            disabled={isSaving}
          >
            <i className="fi fi-br-disk"></i>
            {isSaving ? "A guardar..." : "Guardar Badge"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
