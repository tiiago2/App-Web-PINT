import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  obterUtilizadores,
  obterRoles,
  atualizarUtilizador,
  eliminarUtilizador,
} from "../../services/utilizadorService.js";
import { obterAreas, obterServiceLines } from "../../services/gestaoService.js";
import EditarUtilizadorModal from "../../components/ui/EditarUtilizadorModal/EditarUtilizadorModal.jsx";
import ModalConfirmacao from "../../components/ui/ModalConfirmacao/ModalConfirmacao.jsx";
import ToastNotificacao from "../../components/ui/ToastNotificacao/ToastNotificacao.jsx";
import defaultAvatar from "../../assets/utilizador.png";
import "./utilizadores.css";

const ORDEM_NOME = "nome";
const ORDEM_RECENTE = "recente";

const CARDS_CARGOS = [
  { key: "consultor", label: "Consultor", icon: "fi-br-user", color: "consultor" },
  { key: "service line leader", label: "Service Line Leader", icon: "fi-br-chart-line-up", color: "service" },
  { key: "talent", label: "Talent Manager", icon: "fi-br-briefcase", color: "talent" },
  { key: "admin", label: "Administrador", icon: "fi-br-shield-check", color: "admin" },
];

export default function Utilizadores({ userRole }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [utilizadores, setUtilizadores] = useState([]);
  const [rolesDisponiveis, setRolesDisponiveis] = useState([]);
  const [areas, setAreas] = useState([]);
  const [serviceLines, setServiceLines] = useState([]);

  const [pesquisa, setPesquisa] = useState("");
  const [ordenar, setOrdenar] = useState(ORDEM_NOME);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroRole, setFiltroRole] = useState("");
  const [filtroArea, setFiltroArea] = useState("");
  const [filtroServiceLine, setFiltroServiceLine] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [utilizadorEditar, setUtilizadorEditar] = useState(null);
  const [utilizadorEliminar, setUtilizadorEliminar] = useState(null);

  const [toast, setToast] = useState({ visivel: false, mensagem: "", tipo: "sucesso" });
  const mostrarToast = (mensagem, tipo = "sucesso") => setToast({ visivel: true, mensagem, tipo });
  const fecharToast = () => setToast((prev) => ({ ...prev, visivel: false }));

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

  const cargoEfetivo = userRole || cargoLocal;

  const isAdmin =
    cargoEfetivo?.toLowerCase() === "administrador" ||
    cargoEfetivo?.toLowerCase() === "admin";

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [users, roles, areasRaw, serviceLinesRaw] = await Promise.all([
        obterUtilizadores(),
        obterRoles(),
        obterAreas(),
        obterServiceLines(),
      ]);
      setUtilizadores(users);
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

  const contagemPorCargo = useMemo(() => {
    const contagem = {};
    CARDS_CARGOS.forEach((card) => {
      contagem[card.key] = 0;
    });

    utilizadores.forEach((u) => {
      u.roles?.forEach((role) => {
        const nome = role.nome_role?.toLowerCase() || "";
        CARDS_CARGOS.forEach((card) => {
          if (nome.includes(card.key)) {
            contagem[card.key] += 1;
          }
        });
      });
    });

    return contagem;
  }, [utilizadores]);

  const filtrados = useMemo(() => {
    let lista = [...utilizadores];

    if (pesquisa.trim()) {
      const termo = pesquisa.toLowerCase();
      lista = lista.filter(
        (u) =>
          u.nome_user?.toLowerCase().includes(termo) ||
          u.email?.toLowerCase().includes(termo)
      );
    }

    if (filtroEstado) {
      const ativo = filtroEstado === "ativo";
      lista = lista.filter((u) => u.ativo === ativo);
    }

    if (filtroRole) {
      lista = lista.filter((u) =>
        u.roles?.some((r) => String(r.id_role) === filtroRole)
      );
    }

    if (filtroArea) {
      lista = lista.filter((u) => u.consultor?.id_area === Number(filtroArea));
    }

    if (filtroServiceLine) {
      const areaIds = areas
        .filter((a) => String(a.id_service_line) === filtroServiceLine)
        .map((a) => a.id_area);
      lista = lista.filter((u) => areaIds.includes(u.consultor?.id_area));
    }

    if (ordenar === ORDEM_RECENTE) {
      lista.sort((a, b) => b.id_utilizador - a.id_utilizador);
    } else {
      lista.sort((a, b) =>
        (a.nome_user || "").localeCompare(b.nome_user || "", "pt")
      );
    }

    return lista;
  }, [
    utilizadores,
    pesquisa,
    ordenar,
    filtroRole,
    filtroArea,
    filtroServiceLine,
    filtroEstado,
    areas,
  ]);

  const handleEditar = (utilizador, e) => {
    e.stopPropagation();
    setUtilizadorEditar(utilizador);
  };

  const handleEliminar = (utilizador, e) => {
    e.stopPropagation();
    setUtilizadorEliminar(utilizador);
  };

  const handleGuardarEdicao = async (dados) => {
    setSaving(true);
    try {
      const payload = {
        nome_user: dados.nome_user,
        email: dados.email,
        telefone: dados.telefone,
        ativo: dados.ativo,
        roles: dados.roles,
      };

      if (dados.password?.trim()) {
        payload.password = dados.password;
      }

      if (dados.imagem instanceof File) {
        payload.imagem = dados.imagem;
      }

      const res = await atualizarUtilizador(dados.id_utilizador, payload);

      setUtilizadores((prev) =>
        prev.map((u) =>
          u.id_utilizador === dados.id_utilizador ? res : u
        )
      );
      setUtilizadorEditar(null);
      mostrarToast("Utilizador atualizado com sucesso!", "sucesso");
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      const msg = error.response?.data?.error || "Erro ao atualizar utilizador.";
      mostrarToast(msg, "erro");
    } finally {
      setSaving(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!utilizadorEliminar) return;
    try {
      await eliminarUtilizador(utilizadorEliminar.id_utilizador);
      setUtilizadores((prev) =>
        prev.filter((u) => u.id_utilizador !== utilizadorEliminar.id_utilizador)
      );
      setUtilizadorEliminar(null);
      mostrarToast("Utilizador eliminado com sucesso!", "sucesso");
    } catch (error) {
      console.error("Erro ao eliminar:", error);
      const msg = error.response?.data?.error || "Erro ao eliminar utilizador.";
      mostrarToast(msg, "erro");
    }
  };

  const getFotoUrl = (imagem) => {
    if (!imagem) return defaultAvatar;
    if (imagem.startsWith("http://") || imagem.startsWith("https://")) {
      return imagem;
    }
    return defaultAvatar;
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

  const formatarNomeRole = (nome) => {
    if (!nome) return "";
    return nome
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const areasFiltradas = filtroServiceLine
    ? areas.filter((a) => String(a.id_service_line) === filtroServiceLine)
    : areas;

  return (
    <main className="utilizadores-page">
      <div className="utilizadores-wrapper">
        {/* Header */}
        <div className="utilizadores-header">
          <h1 className="texto-titulo-principal mb-0">Utilizadores</h1>
          {isAdmin && (
            <button
              className="btn btn-primary-utilizadores"
              onClick={() => navigate("/utilizadores/criar-utilizador")}
            >
              <i className="fi fi-br-plus"></i>
              Adicionar Utilizador
            </button>
          )}
        </div>

        {/* Cards de cargos */}
        <div className="utilizadores-cards">
          {CARDS_CARGOS.map((card) => (
            <div
              key={card.key}
              className={`utilizadores-card cargo ${card.color}`}
              onClick={() => {
                const role = rolesDisponiveis.find((r) =>
                  r.nome_role?.toLowerCase().includes(card.key)
                );
                if (role) {
                  setFiltroRole(String(role.id_role));
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <div>
                <span className="utilizadores-card-label">{card.label}</span>
                <strong className="utilizadores-card-value">
                  {contagemPorCargo[card.key] || 0}
                </strong>
              </div>
              <div className={`utilizadores-card-icon ${card.color}`}>
                <i className={`fi ${card.icon}`}></i>
              </div>
            </div>
          ))}
        </div>

        {/* Controles */}
        <div className="utilizadores-controles">
          <div className="utilizadores-search">
            <i className="fi fi-br-search"></i>
            <input
              type="text"
              placeholder="Pesquisar utilizador..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />
          </div>

          <div className="utilizadores-controles-direita">
            <div className="utilizadores-select-wrapper">
              <span className="utilizadores-select-label">Ordenar por:</span>
              <div className="utilizadores-select">
                <select
                  value={ordenar}
                  onChange={(e) => setOrdenar(e.target.value)}
                >
                  <option value={ORDEM_NOME}>Nome (A-Z)</option>
                  <option value={ORDEM_RECENTE}>Mais recente</option>
                </select>
              </div>
            </div>

            <button
              className="btn btn-outline-utilizadores"
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
            >
              <i className="fi fi-br-settings-sliders"></i>
              Filtros
            </button>
          </div>
        </div>

        {/* Filtros avançados */}
        {mostrarFiltros && (
          <div className="utilizadores-filtros-avancados">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="utilizadores-filtro-label">Estado</label>
                <select
                  className="form-select"
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="utilizadores-filtro-label">Role</label>
                <select
                  className="form-select"
                  value={filtroRole}
                  onChange={(e) => setFiltroRole(e.target.value)}
                >
                  <option value="">Todas</option>
                  {rolesDisponiveis.map((role) => (
                    <option key={role.id_role} value={role.id_role}>
                      {formatarNomeRole(role.nome_role)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="utilizadores-filtro-label">Service Line</label>
                <select
                  className="form-select"
                  value={filtroServiceLine}
                  onChange={(e) => {
                    setFiltroServiceLine(e.target.value);
                    setFiltroArea("");
                  }}
                >
                  <option value="">Todas</option>
                  {serviceLines.map((sl) => (
                    <option key={sl.id_service_line} value={sl.id_service_line}>
                      {sl.nome_service_line}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="utilizadores-filtro-label">Área</label>
                <select
                  className="form-select"
                  value={filtroArea}
                  onChange={(e) => setFiltroArea(e.target.value)}
                >
                  <option value="">Todas</option>
                  {areasFiltradas.map((area) => (
                    <option key={area.id_area} value={area.id_area}>
                      {area.nome_area}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tabela */}
        <div className="utilizadores-tabela-wrapper">
          {loading ? (
            <div className="utilizadores-loading">A carregar utilizadores...</div>
          ) : (
            <table className="utilizadores-tabela">
              <thead>
                <tr>
                  <th>Utilizador</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Roles</th>
                  <th>Estado</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="utilizadores-vazio">
                      Nenhum utilizador encontrado.
                    </td>
                  </tr>
                ) : (
                  filtrados.map((u) => (
                    <tr
                      key={u.id_utilizador}
                      onClick={() => navigate(`/perfil/${u.id_utilizador}`)}
                      className="utilizadores-linha"
                    >
                      <td>
                        <div className="utilizadores-user-cell">
                          {u.imagem_perfil &&
                          (u.imagem_perfil.startsWith("http://") ||
                            u.imagem_perfil.startsWith("https://")) ? (
                            <img
                              src={getFotoUrl(u.imagem_perfil)}
                              alt={u.nome_user}
                              className="utilizadores-avatar"
                            />
                          ) : (
                            <div className="utilizadores-avatar-iniciais">
                              {getIniciais(u.nome_user)}
                            </div>
                          )}
                          <span className="utilizadores-nome">{u.nome_user}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>{u.telefone}</td>
                      <td>
                        <div className="utilizadores-roles-cell">
                          {u.roles?.map((role) => (
                            <span
                              key={role.id_role}
                              className="utilizadores-role-badge"
                            >
                              {formatarNomeRole(role.nome_role)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`utilizadores-estado-badge ${
                            u.ativo ? "ativo" : "inativo"
                          }`}
                        >
                          <span className="utilizadores-estado-dot"></span>
                          {u.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td>
                        <div className="utilizadores-acoes">
                          <button
                            className="utilizadores-acao editar"
                            onClick={(e) => handleEditar(u, e)}
                            title="Editar"
                          >
                            <i className="fi fi-br-pencil"></i>
                          </button>
                          <button
                            className="utilizadores-acao eliminar"
                            onClick={(e) => handleEliminar(u, e)}
                            title="Eliminar"
                          >
                            <i className="fi fi-br-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Editar */}
      <EditarUtilizadorModal
        isOpen={!!utilizadorEditar}
        onClose={() => setUtilizadorEditar(null)}
        utilizador={utilizadorEditar}
        rolesDisponiveis={rolesDisponiveis}
        onGuardar={handleGuardarEdicao}
        saving={saving}
      />

      {/* Modal Eliminar */}
      <ModalConfirmacao
        isOpen={!!utilizadorEliminar}
        onClose={() => setUtilizadorEliminar(null)}
        onConfirm={confirmarEliminar}
        titulo="Eliminar utilizador"
        mensagem={`Tem a certeza que pretende eliminar o utilizador "${utilizadorEliminar?.nome_user}"? Esta ação não pode ser desfeita.`}
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        isDanger={true}
      />

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
