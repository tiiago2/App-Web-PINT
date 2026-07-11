import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { criarUtilizador, obterRoles } from "../../services/utilizadorService.js";
import { obterAreas, obterServiceLines } from "../../services/gestaoService.js";
import defaultAvatar from "../../assets/utilizador.png";
import ToastNotificacao from "../../components/ui/ToastNotificacao/ToastNotificacao.jsx";
import LoadingSpinner from "../../components/ui/Loading/LoadingSpinner";
import "./utilizadores.css";

export default function CriarUtilizador() {
  const navigate = useNavigate();

  const cargoLocal = (() => {
    try {
      const role = localStorage.getItem("role_softinsa");
      if (!role) return null;
      const parsed = JSON.parse(role);
      return typeof parsed === "string" ? parsed : parsed?.nome;
    } catch {
      return null;
    }
  })();

  const isAdmin =
    cargoLocal?.toLowerCase() === "administrador" ||
    cargoLocal?.toLowerCase() === "admin";

  useEffect(() => {
    if (!isAdmin) {
      navigate("/utilizadores", { replace: true });
    }
  }, [isAdmin, navigate]);

  const [rolesDisponiveis, setRolesDisponiveis] = useState([]);
  const [areas, setAreas] = useState([]);
  const [serviceLines, setServiceLines] = useState([]);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [rolesSelecionadas, setRolesSelecionadas] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [idServiceLineConsultor, setIdServiceLineConsultor] = useState("");
  const [idArea, setIdArea] = useState("");
  const [idServiceLineLider, setIdServiceLineLider] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState({ visivel: false, mensagem: "", tipo: "sucesso" });
  const mostrarToast = (mensagem, tipo = "sucesso") => setToast({ visivel: true, mensagem, tipo });
  const fecharToast = () => setToast((prev) => ({ ...prev, visivel: false }));

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [roles, areasRaw, serviceLinesRaw] = await Promise.all([
        obterRoles(),
        obterAreas(),
        obterServiceLines(),
      ]);
      setRolesDisponiveis(roles);
      setAreas(areasRaw);
      setServiceLines(serviceLinesRaw);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      mostrarToast("Erro ao carregar dados. Verifica se estás autenticado.", "erro");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const toggleRole = (idRole) => {
    setRolesSelecionadas((prev) =>
      prev.includes(idRole)
        ? prev.filter((r) => r !== idRole)
        : [...prev, idRole]
    );
  };

  const getRoleByNome = (nome) =>
    rolesDisponiveis.find((r) => r.nome_role?.toLowerCase() === nome);

  const isConsultorSelecionado = () =>
    rolesSelecionadas.includes(getRoleByNome("consultor")?.id_role);

  const isServiceLineLeaderSelecionado = () =>
    rolesSelecionadas.includes(getRoleByNome("service line leader")?.id_role);

  const areasFiltradas = idServiceLineConsultor
    ? areas.filter(
        (a) => String(a.id_service_line) === String(idServiceLineConsultor)
      )
    : areas;

  const formatarNomeRole = (nome) => {
    if (!nome) return "";
    return nome
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getIniciais = (nome) => {
    if (!nome) return "?";
    return nome
      .split(" ")
      .filter((p) => p)
      .map((p) => p[0].toUpperCase())
      .slice(0, 2)
      .join("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nome || !email || !telefone) {
      mostrarToast("Por favor preenche todos os campos obrigatórios.", "erro");
      return;
    }

    if (rolesSelecionadas.length === 0) {
      mostrarToast("Seleciona pelo menos uma role.", "erro");
      return;
    }

    if (isConsultorSelecionado() && !idArea) {
      mostrarToast("Seleciona uma área para o consultor.", "erro");
      return;
    }

    if (isServiceLineLeaderSelecionado() && !idServiceLineLider) {
      mostrarToast("Seleciona uma service line para o Service Line Leader.", "erro");
      return;
    }

    setSaving(true);
    try {
      const dados = {
        nome_user: nome,
        email,
        telefone,
        roles: rolesSelecionadas,
      };

      if (isConsultorSelecionado() && idArea) {
        dados.id_area = idArea;
      }

      if (isServiceLineLeaderSelecionado() && idServiceLineLider) {
        dados.id_service_line = idServiceLineLider;
      }

      if (selectedFile) {
        dados.imagem = selectedFile;
      }

      await criarUtilizador(dados);
      mostrarToast("Utilizador criado com sucesso!", "sucesso");
      navigate("/utilizadores");
    } catch (error) {
      console.error("Erro ao criar utilizador:", error);
      const msg =
        error.response?.data?.error || "Erro ao criar utilizador.";
      mostrarToast(msg, "erro");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="utilizadores-page d-flex justify-content-center align-items-center">
        <LoadingSpinner tamanho="lg" texto="A carregar..." centralizado />
      </main>
    );
  }

  return (
    <main className="utilizadores-page">
      <div className="utilizadores-wrapper">
        {/* Header */}
        <button
          className="btn btn-link text-decoration-none p-0 d-inline-flex align-items-center gap-2"
          onClick={() => navigate("/utilizadores")}
          style={{ color: "var(--barra_lateral)", fontWeight: 500, width: "fit-content" }}
        >
          <i className="fi fi-br-arrow-left"></i>
          Voltar aos Utilizadores
        </button>

        <div className="utilizadores-header">
          <h1 className="texto-titulo-principal mb-0">Adicionar Utilizador</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            {/* Coluna Esquerda - Formulário */}
            <div className="col-12 col-lg-8">
              {/* Secção 1 - Dados Pessoais */}
              <div className="criar-utilizador-section">
                <div className="criar-utilizador-section-header">
                  <div className="criar-utilizador-section-number">1</div>
                  <div>
                    <h5 className="criar-utilizador-section-title">Dados Pessoais</h5>
                    <p className="criar-utilizador-section-subtitle">
                      Informações básicas de contacto.
                    </p>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-medium" style={{ fontSize: "0.85rem" }}>
                      Foto de Perfil
                    </label>
                    <div className="criar-utilizador-file-wrapper">
                      <img
                        src={previewUrl || defaultAvatar}
                        alt="Preview"
                        className="rounded-circle object-fit-cover"
                        width="64"
                        height="64"
                      />
                      <label className="criar-utilizador-file-button cursor-pointer">
                        Escolher ficheiro
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          style={{ display: "none" }}
                        />
                      </label>
                      <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                        {selectedFile ? selectedFile.name : "Nenhum ficheiro selecionado"}
                      </span>
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-medium" style={{ fontSize: "0.85rem" }}>
                      Nome do Utilizador *
                    </label>
                    <div className="criar-utilizador-input-group">
                      <i className="fi fi-br-user criar-utilizador-input-icon"></i>
                      <input
                        type="text"
                        className="criar-utilizador-input"
                        placeholder="Ex: Maria Silva"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-medium" style={{ fontSize: "0.85rem" }}>
                      Email *
                    </label>
                    <div className="criar-utilizador-input-group">
                      <i className="fi fi-br-envelope criar-utilizador-input-icon"></i>
                      <input
                        type="email"
                        className="criar-utilizador-input"
                        placeholder="nome@softinsa.pt"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-medium" style={{ fontSize: "0.85rem" }}>
                      Telefone *
                    </label>
                    <div className="criar-utilizador-input-group">
                      <i className="fi fi-br-phone-call criar-utilizador-input-icon"></i>
                      <input
                        type="number"
                        className="criar-utilizador-input"
                        placeholder="9XX XXX XXX"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Secção 2 - Roles & Permissões */}
              <div className="criar-utilizador-section">
                <div className="criar-utilizador-section-header">
                  <div className="criar-utilizador-section-number">2</div>
                  <div>
                    <h5 className="criar-utilizador-section-title">Roles & Permissões</h5>
                    <p className="criar-utilizador-section-subtitle">
                      Selecione uma ou mais roles.
                    </p>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2 mb-3">
                  {rolesDisponiveis.map((role) => (
                    <div
                      key={role.id_role}
                      onClick={() => toggleRole(role.id_role)}
                      className={`criar-utilizador-role-chip ${
                        rolesSelecionadas.includes(role.id_role) ? "active" : ""
                      }`}
                    >
                      {formatarNomeRole(role.nome_role)}
                    </div>
                  ))}
                </div>

                {isConsultorSelecionado() && (
                  <div className="row g-3 pt-3 border-top">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium" style={{ fontSize: "0.85rem" }}>
                        Service Line
                      </label>
                      <select
                        className="form-select"
                        value={idServiceLineConsultor}
                        onChange={(e) => {
                          setIdServiceLineConsultor(e.target.value);
                          setIdArea("");
                        }}
                        style={{ borderRadius: "10px" }}
                      >
                        <option value="">Todas as Service Lines</option>
                        {serviceLines.map((sl) => (
                          <option key={sl.id_service_line} value={sl.id_service_line}>
                            {sl.nome_service_line}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium" style={{ fontSize: "0.85rem" }}>
                        Área *
                      </label>
                      <select
                        className="form-select"
                        value={idArea}
                        onChange={(e) => setIdArea(e.target.value)}
                        required={isConsultorSelecionado()}
                        style={{ borderRadius: "10px" }}
                      >
                        <option value="">Seleciona uma área</option>
                        {areasFiltradas.map((area) => (
                          <option key={area.id_area} value={area.id_area}>
                            {area.nome_area}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {isServiceLineLeaderSelecionado() && (
                  <div className="row g-3 pt-3 border-top">
                    <div className="col-12">
                      <label className="form-label fw-medium" style={{ fontSize: "0.85rem" }}>
                        Service Line a Liderar *
                      </label>
                      <select
                        className="form-select"
                        value={idServiceLineLider}
                        onChange={(e) => setIdServiceLineLider(e.target.value)}
                        required={isServiceLineLeaderSelecionado()}
                        style={{ borderRadius: "10px" }}
                      >
                        <option value="">Seleciona uma service line</option>
                        {serviceLines.map((sl) => (
                          <option key={sl.id_service_line} value={sl.id_service_line}>
                            {sl.nome_service_line}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Coluna Direita - Pré-visualização */}
            <div className="col-12 col-lg-4">
              <div className="criar-utilizador-preview-card compact">
                <div className="criar-utilizador-preview-title">Pré-visualização</div>

                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="criar-utilizador-preview-avatar compact"
                  />
                ) : (
                  <div className="criar-utilizador-preview-iniciais compact">
                    {getIniciais(nome)}
                  </div>
                )}

                <h4 className="criar-utilizador-preview-nome">
                  {nome || "Novo Utilizador"}
                </h4>
                <p className="criar-utilizador-preview-email">
                  {email || "email@softinsa.pt"}
                </p>

                {rolesSelecionadas.length > 0 ? (
                  <div className="criar-utilizador-preview-roles">
                    {rolesSelecionadas.map((idRole) => {
                      const role = rolesDisponiveis.find((r) => r.id_role === idRole);
                      return (
                        <span key={idRole} className="utilizadores-role-badge">
                          {formatarNomeRole(role?.nome_role)}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="criar-utilizador-preview-sem-roles">
                    Sem roles atribuídas
                  </p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="criar-utilizador-btn-criar"
                >
                  <i className="fi fi-br-user-add"></i>
                  {saving ? "A criar..." : "Criar Utilizador"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/utilizadores")}
                  className="criar-utilizador-btn-cancelar"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Toast Notificação */}
      <ToastNotificacao
        visivel={toast.visivel}
        mensagem={toast.mensagem}
        tipo={toast.tipo}
        onFechar={fecharToast}
      />
    </main>
  );
}
