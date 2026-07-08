import React, { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import SeletorAbas from "../../components/ui/SeletorAbas/SeletorAbas_Galeria";
import BarraPesquisa from "../../components/ui/BarraPesquisa/BarraPesquisa";
import BotaoDropdown from "../../components/ui/BotaoDropdown/BotaoDropdown";
import BotaoAcao from "../../components/ui/BotaoAcao/BotaoAcao";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from "../../services/api.js";
import "./candidaturas.css";
import "../../components/BadgeDetalhe/BadgeDetalheRequisitos.css";

function isUrlDocumento(valor = "") {
    try {
        const url = new URL(valor);
        return ["http:", "https:"].includes(url.protocol);
    } catch {
        return false;
    }
}

// Paleta de cores rotativas para os ícones dos badges (determinística por badge ID)
const CORES_TEMPLATE = [
  { cor: "#c2d992", borderCor: "#5EA500", icon: "fi-br-microchip" },
  { cor: "#d1e1f0", borderCor: "#45556C", icon: "fi-br-cloud" },
  { cor: "#e08a90", borderCor: "#AE012F", icon: "fi-br-smartphone" },
  { cor: "#e9d78e", borderCor: "#E17100", icon: "fi-br-target" },
  { cor: "#b5d8f7", borderCor: "#2979C1", icon: "fi-br-database" },
  { cor: "#d4b5f7", borderCor: "#7B2FBE", icon: "fi-br-rocket" }
];

// REUSABLE SUB-COMPONENT: CANDIDATURA CARD
function CandidaturaCard({ candidatura, isSelected, onClick }) {
  const { t } = useTranslation();
  const { user, badge } = candidatura;
  
  const formatSubmetido = (dateStr) => {
    const diffMs = new Date() - new Date(dateStr);
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) {
      return diffHours === 0 
        ? t("submetido_ha_menos_uma_hora") 
        : t("submetido_ha_horas", { hours: diffHours });
    }
    const diffDays = Math.floor(diffHours / 24);
    return t("submetido_ha_dias", { days: diffDays });
  };

  const statusClass = candidatura.status === "Pendente" 
    ? "pendente" 
    : candidatura.status === "Aceite"
    ? "aceite"
    : "recusada";

  return (
    <button
      onClick={onClick}
      className={`candidatura-card w-100 text-start p-3 d-flex align-items-center gap-3 ${
        isSelected ? "active" : ""
      }`}
      style={{ outline: "none" }}
    >
      <div 
        className="candidatura-card-icon-circle"
        style={{ 
          backgroundColor: badge.imagem ? "transparent" : `${badge.cor}25`, 
          borderColor: badge.imagem ? "transparent" : badge.borderCor,
          border: badge.imagem ? "none" : undefined
        }}
      >
        {badge.imagem ? (
          <img src={badge.imagem} alt={badge.titulo} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <i className={`fi ${badge.icon}`} style={{ fontSize: "1.2rem", color: badge.borderCor }}></i>
        )}
      </div>

      <div className="flex-grow-1 min-w-0">
        <div className="d-flex justify-content-between align-items-start mb-1 gap-2">
          <h6 className="fw-bold m-0 truncate" style={{ fontSize: "0.95rem" }}>{badge.titulo}</h6>
          <span className={`status-pill ${statusClass}`}>
            {t(candidatura.status.toLowerCase())}
          </span>
        </div>

        <div className="d-flex align-items-center gap-2 mb-2 text-muted" style={{ fontSize: "0.75rem" }}>
          <i className="fi fi-br-user text-gray-500"></i>
          <span className="fw-medium text-gray-700 truncate">{user.nome}</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500 truncate">{user.area}</span>
        </div>
        
        <div className="d-flex justify-content-between align-items-center text-gray-400" style={{ fontSize: "0.7rem" }}>
          <span>{formatSubmetido(candidatura.submetido)}</span>
          <span className="fw-semibold text-gray-600 bg-gray-100 px-1.5 py-0.25 rounded">
            {t("pontos_curto", { pontos: badge.pontos })}
          </span>
        </div>
      </div>
    </button>
  );
}

// REUSABLE SUB-COMPONENT: CANDIDATURA DETALHES
function CandidaturaDetalhes({ candidatura, userRole, onAccept, onReject, onClose }) {
  const { t, i18n } = useTranslation();
  const { user, badge } = candidatura;
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  
  const isSll = userRole === 'service line leader' || userRole === 'service';
  const showTalentApproved = isSll && candidatura.dbStatus === 'aceite talent';

  const formatSubmetidoCompleto = (dateStr) => {
    const options = { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" };
    const localeCode = i18n.language === "gb" ? "en-GB" : i18n.language === "es" ? "es-ES" : "pt-PT";
    return new Date(dateStr).toLocaleDateString(localeCode, options);
  };

  return (
    <div className="d-flex flex-column h-100" style={{ minHeight: 0 }}>
      <div className="p-3 border-bottom d-flex justify-content-between align-items-center flex-shrink-0" style={{ borderColor: "var(--contorno) !important" }}>
        <h5 className="fw-bold m-0" style={{ fontSize: "1.15rem", color: "var(--fontes)" }}>{t("ficha_candidatura")}</h5>
        
        {/* Button to toggle view between details and history */}
        <div className="d-flex align-items-center gap-2 mx-auto ms-sm-auto me-sm-3">
          <button 
            onClick={() => setMostrarHistorico(prev => !prev)}
            className="btn btn-sm rounded-3 px-3 py-1.5 candidatura-botao-historico"
          >
            <i className={`fi ${mostrarHistorico ? "fi-br-document" : "fi-br-history"} me-1.5`} style={{ fontSize: "0.75rem", verticalAlign: "middle" }}></i>
            <span>
              {mostrarHistorico ? t("ver_candidatura") : t("ver_historico")}
            </span>
          </button>
        </div>

        <button 
          onClick={onClose}
          className="btn btn-link text-gray-400 hover:text-gray-600 p-1 border-0"
          style={{ textDecoration: "none" }}
          aria-label="Fechar ficha"
        >
          <i className="fi fi-br-cross" style={{ fontSize: "0.9rem" }}></i>
        </button>
      </div>

      <div className="overflow-auto p-4 custom-scrollbar bg-gray-50/20" style={{ height: "calc(100% - 60px)" }}>
        {mostrarHistorico ? (
          // evaluation history view
          <div className="d-flex flex-column gap-3">
            <h6 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ fontSize: "0.95rem", color: "var(--fontes)" }}>
              <i className="fi fi-br-history" style={{ color: "var(--barra_lateral)" }}></i>
              <span>{t("historico_avaliacoes") || "Histórico de Avaliações"}</span>
            </h6>
            
            {(!candidatura.historico || candidatura.historico.length === 0) ? (
              <div className="text-center py-5 text-secondary d-flex flex-column align-items-center justify-content-center h-100 bg-gray-50/10 rounded-3 border border-dashed py-5">
                <i className="fi fi-br-info mb-3 text-gray-300" style={{ fontSize: "2.5rem" }}></i>
                <p className="m-0 fs-6 fw-medium text-gray-400">{t("sem_historico") || "Ainda sem registo de avaliações."}</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {candidatura.historico.map((hist, idx) => {
                  const histStatusClass = hist.aceite ? "aceite" : "recusada";
                  return (
                    <div 
                      key={idx} 
                      className="p-3 rounded-3 shadow-xs border d-flex flex-column gap-2" 
                      style={{ 
                        backgroundColor: "var(--fundo)", 
                        borderColor: "var(--contorno)"
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                          <i className="fi fi-br-user text-gray-500" style={{ fontSize: "0.9rem" }}></i>
                          <span className="fw-semibold text-gray-700" style={{ fontSize: "0.85rem" }}>{hist.avaliador}</span>
                        </div>
                        <span className={`status-pill ${histStatusClass}`}>
                          {hist.aceite ? t("aceite") : t("rejeitada")}
                        </span>
                      </div>
                      
                      {hist.feedback && (
                        <p 
                          className="m-0 text-muted p-2 rounded-2" 
                          style={{ 
                            fontSize: "0.85rem", 
                            fontStyle: "italic", 
                            backgroundColor: "var(--fundo_submenu_hover)",
                            borderLeft: "3px solid var(--barra_lateral)"
                          }}
                        >
                          "{hist.feedback}"
                        </p>
                      )}
                      
                      <div className="d-flex justify-content-end align-items-center gap-2 text-gray-400" style={{ fontSize: "0.7rem" }}>
                        <i className="fi fi-br-calendar"></i>
                        <span>{new Date(hist.dataAvaliacao).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // normal details view
          <div className="d-flex flex-column gap-4">
            
            <div className="d-flex flex-column flex-sm-row align-items-center align-items-sm-start gap-4">
              <div 
                className="candidatura-detalhe-icon-circle transition-all hover:scale-105"
                style={{ 
                  backgroundColor: badge.imagem ? "transparent" : `${badge.cor}30`,
                  borderColor: badge.imagem ? "transparent" : badge.borderCor,
                  border: badge.imagem ? "none" : undefined
                }}
              >
                {badge.imagem ? (
                  <img src={badge.imagem} alt={badge.titulo} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <i className={`fi ${badge.icon}`} style={{ fontSize: "2.2rem", color: badge.borderCor }}></i>
                )}
              </div>

              <div className="flex-grow-1 text-center text-sm-start w-100">
                <h3 className="fw-bold mb-2" style={{ fontSize: "1.3rem", color: "var(--fontes)" }}>{badge.titulo}</h3>
                
                <div className="d-flex flex-column gap-1.5 mb-3" style={{ fontSize: "0.85rem", color: "var(--fontes)" }}>
                  <div className="d-flex align-items-center justify-content-center justify-content-sm-start gap-2">
                    <i className="fi fi-br-user" style={{ color: "var(--barra_lateral)" }}></i>
                    <span className="fw-bold fs-6">{user.nome}</span>
                  </div>
                  <div>
                    <strong>{t("area_label")}:</strong> {user.area}
                  </div>
                  <div>
                    <strong>{t("submetido_label")}:</strong> {formatSubmetidoCompleto(candidatura.submetido)}
                  </div>
                  <div>
                    <strong>{t("pontuacao_label")}:</strong> {t("pontos_count", { count: badge.pontos })}
                  </div>
                </div>
                
                <div className="mt-3 text-start">
                  <span className={`status-pill ${
                    showTalentApproved
                      ? "aceite" // Green for SLL on details panel
                      : (candidatura.status === "Pendente" 
                        ? "pendente" 
                        : candidatura.status === "Aceite"
                        ? "aceite"
                        : "recusada")
                  }`}>
                    {showTalentApproved ? t("aceite_pelo_talent") : t(candidatura.status.toLowerCase())}
                  </span>
                </div>
              </div>
            </div>

            <hr className="my-0" style={{ color: "var(--contorno)" }} />

            <div>
              <h6 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ fontSize: "0.95rem", color: "var(--fontes)" }}>
                <i className="fi fi-br-align-justify" style={{ color: "var(--barra_lateral)" }}></i>
                <span>{t("descricao_badge")}</span>
              </h6>
              <p className="lh-relaxed p-3 rounded-3 m-0 shadow-xs" style={{ fontSize: "0.85rem", backgroundColor: "var(--fundo)", border: "var(--borda-principal) solid var(--contorno)" }}>
                {badge.descricao}
              </p>
            </div>

            <div>
              <h6 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ fontSize: "0.95rem", color: "var(--fontes)" }}>
                <i className="fi fi-br-list" style={{ color: "var(--barra_lateral)" }}></i>
                <span>{t("requisitos_comprovados")}</span>
              </h6>
              
              <div className="badge-detalhe-requisitos-lista mt-3">
                {candidatura.requisitos.map((req, idx) => {
                    const ficheiroDocumento = req.documento?.ficheiro || "";
                    const documentoTemUrl = isUrlDocumento(ficheiroDocumento);
                    const textoDocumento = documentoTemUrl ? "Ver documento" : (req.documento?.nomeFicheiro || "Documento Anexado");
                    
                    return (
                        <article key={req.id || idx} className={`badge-detalhe-requisito ${req.temAnexo ? "badge-detalhe-requisito--anexado" : ""}`}>
                            <div className="badge-detalhe-requisito-icon">
                                <i className={`fi ${req.temAnexo ? "fi-br-file-check" : "fi-br-clock"}`}></i>
                            </div>
                            <div className="badge-detalhe-requisito-info">
                                <h5>{req.nome}</h5>
                                <p>{req.descricao}</p>
                                {req.temAnexo && (
                                    <span className="badge-detalhe-requisito-ficheiro">
                                        <i className="fi fi-br-clip"></i>
                                        <a 
                                            href={`${api.defaults.baseURL}/documentos/${req.documento.id_ficheiro}/download?token=${localStorage.getItem("token_softinsa") || ""}`}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="fw-medium text-decoration-none"
                                            style={{ fontSize: "0.85rem", color: "var(--barra_lateral)" }}
                                        >
                                            Download documento
                                        </a>
                                    </span>
                                )}
                            </div>
                        </article>
                    );
                })}
              </div>
            </div>

            {candidatura.status === "Pendente" && userRole !== "consultor" && (
              <div className="d-flex gap-3 justify-content-end mt-2">
                <button 
                  onClick={() => onReject(candidatura.id)}
                  className="btn rounded-3 d-flex align-items-center justify-content-center gap-2 px-4 py-2 rejeitar_btn font-medium transition-all"
                  style={{ fontSize: "0.9rem", height: "44px" }}
                >
                  <i className="fi fi-br-cross"></i>
                  <span>{t("rejeitar")}</span>
                </button>
                
                <button 
                  onClick={() => onAccept(candidatura.id)}
                  className="btn rounded-3 d-flex align-items-center justify-content-center gap-2 px-4 py-2 aceitar_btn font-medium transition-all"
                  style={{ fontSize: "0.9rem", height: "44px" }}
                >
                  <i className="fi fi-br-check"></i>
                  <span>{t("aceitar")}</span>
                </button>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}

// MAIN PAGE COMPONENT
export default function Candidaturas({ loggedUser }) {
  const { t } = useTranslation();
  const location = useLocation();

  // --- Todos os useState agrupados no topo ---
  const [candidaturas, setCandidaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [selectedCandidaturaId, setSelectedCandidaturaId] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("Pendente");

  // Handle navigation from homepage targeting a specific candidacy
  useEffect(() => {
    if (location.state?.selectedCandidaturaId && candidaturas.length > 0) {
      const match = candidaturas.find(c => c.id === location.state.selectedCandidaturaId);
      if (match) {
        setFiltroStatus(match.status);
        setFiltroArea("Todas");
        setPesquisa("");
        setSelectedCandidaturaId(match.id);
        // Clean navigation state
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, candidaturas]);

  // Predefine sorting options when tab changes
  useEffect(() => {
    if (filtroStatus === "Pendente") {
      setOrdenacao("Mais Recentes");
    } else if (filtroStatus === "Aceite") {
      setOrdenacao("Aceites Recentemente");
    } else if (filtroStatus === "Recusada") {
      setOrdenacao("Recusadas Recentemente");
    }
  }, [filtroStatus]);
  const [filtroArea, setFiltroArea] = useState("Todas");
  const [ordenacao, setOrdenacao] = useState("Mais Recentes");
  const [pesquisa, setPesquisa] = useState("");
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState("success"); // "success" ou "reject"
  const [mostrarExportar, setMostrarExportar] = useState(false);
  const exportRef = useRef(null);
  const [limiteExibicao, setLimiteExibicao] = useState(20);
  const [modalConfirmacao, setModalConfirmacao] = useState({
    visible: false,
    type: "", // "Aceite" ou "Recusada"
    id: null,
    motivo: ""
  });

  // Reset pagination limit when any filter changes
  useEffect(() => {
    setLimiteExibicao(20);
  }, [filtroStatus, filtroArea, pesquisa, ordenacao]);

  // Resolve user role with localStorage fallback
  const userRole = useMemo(() => {
    if (loggedUser?.cargo) return loggedUser.cargo.toLowerCase();
    try {
      const roleGuardada = localStorage.getItem("role_softinsa");
      if (roleGuardada) {
        const roleParseada = JSON.parse(roleGuardada);
        const cargo = typeof roleParseada === "string" 
          ? roleParseada 
          : (roleParseada.nome ? roleParseada.nome : null);
        if (cargo) return cargo.toLowerCase();
      }
    } catch (e) {}
    return "";
  }, [loggedUser]);

  // --- Carregar candidaturas da API ---
  useEffect(() => {
    carregarCandidaturas();
  }, [loggedUser]);

  const carregarCandidaturas = async () => {
    try {
      setLoading(true);
      setErro(null);
      const res = await api.get("/candidaturas");

      const mapped = res.data.map((sub) => {
        // Cor determinística pelo badge ID para consistência visual
        const template = CORES_TEMPLATE[(sub.badgeId || 0) % CORES_TEMPLATE.length];
        return {
          ...sub,
          badge: {
            ...sub.badge,
            cor: template.cor,
            borderCor: template.borderCor,
            icon: template.icon
          }
        };
      });
      
      setCandidaturas(mapped);
    } catch (error) {
      console.error("Erro ao carregar candidaturas:", error);
      setErro("Não foi possível carregar as candidaturas. Verifica a ligação ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
        if (exportRef.current && !exportRef.current.contains(e.target)) {
            setMostrarExportar(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set timeout to automatically hide success toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // --- Áreas dinâmicas extraídas dos dados reais ---
  const areasDisponiveis = useMemo(() => {
    const setAreas = new Set();
    candidaturas.forEach(c => {
      if (c.user && c.user.area && c.user.area !== "-") {
        setAreas.add(c.user.area);
      }
    });
    return Array.from(setAreas).sort();
  }, [candidaturas]);

  // Filtering & Sorting derived state
  const candidaturasFiltradas = useMemo(() => {
    let result = [...candidaturas];

    // 1. Filter by Status Tab
    result = result.filter((c) => c.status === filtroStatus);

    // 2. Filter by Selected Area dropdown
    if (filtroArea !== "Todas") {
      result = result.filter((c) => c.user && c.user.area === filtroArea);
    }

    // 3. Search Filter (by candidate name or badge title)
    if (pesquisa.trim() !== "") {
      const query = pesquisa.toLowerCase();
      result = result.filter(
        (c) =>
          (c.user && c.user.nome.toLowerCase().includes(query)) ||
          (c.badge && c.badge.titulo.toLowerCase().includes(query))
      );
    }

    const getEvaluationDate = (cand) => {
      if (cand.historico && cand.historico.length > 0) {
        const dates = cand.historico.map(h => new Date(h.dataAvaliacao).getTime());
        return Math.max(...dates);
      }
      return new Date(cand.submetido).getTime();
    };

    // 4. Sorting
    result.sort((a, b) => {
      if (ordenacao === "Mais Recentes") {
        return new Date(b.submetido) - new Date(a.submetido);
      } else if (ordenacao === "Mais Antigas") {
        return new Date(a.submetido) - new Date(b.submetido);
      } else if (ordenacao === "Aceites Recentemente" || ordenacao === "Recusadas Recentemente") {
        return getEvaluationDate(b) - getEvaluationDate(a);
      } else if (ordenacao === "Pontos (Decrescente)") {
        return (b.badge ? b.badge.pontos : 0) - (a.badge ? a.badge.pontos : 0);
      } else if (ordenacao === "Pontos (Crescente)") {
        return (a.badge ? a.badge.pontos : 0) - (b.badge ? b.badge.pontos : 0);
      }
      return 0;
    });

    return result;
  }, [candidaturas, filtroStatus, filtroArea, pesquisa, ordenacao]);

  // Derived state to limit rendered cards
  const candidaturasExibidas = useMemo(() => {
    return candidaturasFiltradas.slice(0, limiteExibicao);
  }, [candidaturasFiltradas, limiteExibicao]);

  // Resolve currently selected candidacy item
  const candidaturaSelecionada = useMemo(() => {
    return candidaturas.find((c) => c.id === selectedCandidaturaId) || null;
  }, [candidaturas, selectedCandidaturaId]);

  // Handlers for accept/reject actions
  const handleAccept = (id) => {
    setModalConfirmacao({
      visible: true,
      type: "Aceite",
      id: id,
      motivo: "Validado com sucesso."
    });
  };

  const handleReject = (id) => {
    setModalConfirmacao({
      visible: true,
      type: "Recusada",
      id: id,
      motivo: ""
    });
  };

  const confirmarAcaoModal = async () => {
    const { id, type, motivo } = modalConfirmacao;
    const item = candidaturas.find((c) => c.id === id);
    if (!item) return;

    if (type === "Recusada" && (!motivo || motivo.trim() === "")) {
      alert(t("motivo_obrigatorio") || "O motivo de rejeição é obrigatório!");
      return;
    }

    try {
      setLoading(true);
      await api.put(`/candidaturas/${id}/status`, { status: type, motivo: motivo });
      await carregarCandidaturas();
      setSelectedCandidaturaId(null);
      setModalConfirmacao({ visible: false, type: "", id: null, motivo: "" });
      
      if (type === "Aceite") {
        setToastType("success");
        setToastMessage(t("candidatura_aprovada_sucesso", { nome: item.user.nome, badge: item.badge.titulo }));
      } else {
        setToastType("reject");
        setToastMessage(t("candidatura_rejeitada_sucesso", { nome: item.user.nome, badge: item.badge.titulo }));
      }
    } catch (error) {
      console.error(`Erro ao atualizar candidatura (${type}):`, error);
      alert(type === "Aceite" ? "Não foi possível aceitar a candidatura." : "Não foi possível rejeitar a candidatura.");
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirMenuExportacao = async () => {
    try {
        const response = await api.get('/permissoes/exportar'); 
        
        if (response.data.toggle) {
            setMostrarExportar(estadoAtual => !estadoAtual);
        } else {
            setMostrarExportar(false);
            alert("Não tens permissões para exportar estes dados.");
        }
    } catch (erro) {
        console.error("Erro ao verificar permissão:", erro);
        // Fallback — abre na mesma se a rota não existir
        setMostrarExportar(estadoAtual => !estadoAtual);
    }
  };

  const handleExportarExcel = () => {
    const livro = XLSX.utils.book_new();

    const dadosExportar = candidaturasFiltradas.map(c => ({
        "ID": c.id,
        "Candidato": c.user ? c.user.nome : "Desconhecido",
        "Área": c.user ? c.user.area : "-",
        "Service Line": c.user ? c.user.serviceLine : "-",
        "Badge": c.badge ? c.badge.titulo : "-",
        "Pontos": c.badge ? c.badge.pontos : 0,
        "Data Submissão": new Date(c.submetido).toLocaleDateString(),
        "Estado": c.status,
        "Progresso (%)": c.progresso
    }));

    const folhaCandidaturas = XLSX.utils.json_to_sheet(dadosExportar);
    XLSX.utils.book_append_sheet(livro, folhaCandidaturas, "Candidaturas");

    XLSX.writeFile(livro, "Candidaturas_Export.xlsx");
    setMostrarExportar(false);
  };

  const handleExportarPDF = () => {
    try {
      const doc = new jsPDF('p', 'pt', 'a4');

      doc.setFontSize(18);
      doc.setTextColor(0, 86, 179);
      doc.text("Relatório de Candidaturas", 40, 40);

      doc.setFontSize(11);
      doc.setTextColor(80);
      doc.text(`Total de Registos Exportados: ${candidaturasFiltradas.length}`, 40, 70);

      let posiçãoY_Atual = 100;

      const dadosExportar = candidaturasFiltradas.map(c => [
        c.user ? c.user.nome : "Desconhecido",
        c.badge ? c.badge.titulo : "-",
        c.status || "-",
        c.progresso !== undefined ? `${c.progresso}%` : "-",
        c.submetido ? new Date(c.submetido).toLocaleDateString() : "-"
      ]);

      autoTable(doc, {
        startY: posiçãoY_Atual,
        head: [["Candidato", "Badge", "Estado", "Progresso", "Data Submissão"]],
        body: dadosExportar.length > 0 ? dadosExportar : [["Sem dados", "-", "-", "-", "-"]],
        theme: 'striped',
        headStyles: { fillColor: [0, 86, 179] },
        styles: { fontSize: 10 }
      });

      doc.save("Candidaturas_Export.pdf");
      setMostrarExportar(false);

    } catch (erro) {
      console.error("Erro CRÍTICO ao gerar o PDF:", erro);
      alert("Erro ao gerar o PDF.");
    }
  };



  return (
    <main className="candidaturas-page position-relative">
      
      {/* Visual Feedback Toast */}
      {toastMessage && (
        <div 
          className="alert alert-dismissible fade show position-absolute start-50 translate-middle-x z-3 shadow-md rounded-3 d-flex align-items-center gap-2 border-0 px-4 py-3" 
          role="alert"
          style={{ 
            top: "24px", 
            backgroundColor: toastType === "reject" ? "rgba(212, 42, 42, 0.1)" : "rgba(0, 153, 102, 0.1)", 
            borderLeft: toastType === "reject" ? "5px solid var(--vermelho_eliminar)" : "5px solid var(--aceitar)", 
            color: toastType === "reject" ? "var(--vermelho_eliminar)" : "var(--aceitar)"
          }}
        >
          <i className={`fi ${toastType === "reject" ? "fi-br-cross-circle" : "fi-br-check-circle"} fs-5`} style={{ color: toastType === "reject" ? "var(--vermelho_eliminar)" : "var(--aceitar)" }}></i>
          <span className="fw-medium">{toastMessage}</span>
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setToastMessage(null)} 
            aria-label="Close"
            style={{ fontSize: "0.75rem", padding: "1.2rem" }}
          ></button>
        </div>
      )}

      {/* Responsive Header Section */}
      <div className="candidaturas-topo d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-3">
        <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-4 flex-grow-1">
          <h1 className="texto-titulo-principal m-0">{t("candidaturas")}</h1>
          
          <div className="candidaturas-seletor">
            <SeletorAbas
              valorAtivo={filtroStatus}
              onChange={(val) => {
                setFiltroStatus(val);
                setSelectedCandidaturaId(null);
              }}
              opcoes={[
                { valor: "Pendente", label: t("pendentes") },
                { valor: "Aceite", label: t("aceites") },
                { valor: "Recusada", label: t("recusadas") }
              ]}
            />
          </div>
        </div>

        {/* Filters Panel right */}
        <div className="d-flex align-items-center gap-3 flex-wrap">

          <div className="estat-talent-export-wrap" ref={exportRef}>
            <BotaoAcao
              variante="primario"
              icone="fi-br-download"
              onClick={handleAbrirMenuExportacao}
            >
              {t("exportar")}
            </BotaoAcao>
            {mostrarExportar && (
              <div className="estat-talent-export-menu">
                <div className="estat-talent-export-item" onClick={handleExportarExcel}>Excel</div>
                <div className="estat-talent-export-item" onClick={handleExportarPDF}>PDF</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="candidaturas-conteudo row flex-grow-1 overflow-hidden" style={{ minHeight: 0 }}>
        
        {/* Left column: List view */}
        <div className="col-12 col-md-5 d-flex flex-column overflow-hidden candidaturas-col-lista" style={{ minHeight: 0 }}>
          <div className="rounded-4 p-3 flex-grow-1 d-flex flex-column overflow-hidden shadow-xs" style={{ minHeight: 0, backgroundColor: "var(--fundo)", border: "var(--borda-principal) solid var(--contorno)" }}>
            
            {/* Search and Filters */}
            <div className="d-flex flex-column gap-3 mb-4">
              <BarraPesquisa
                valor={pesquisa}
                onChange={setPesquisa}
                placeholder={t("pesquisar_candidato_badge_placeholder")}
              />

              <div className="d-flex flex-wrap gap-2">
                <div style={{ flex: "1 1 160px" }}>
                  <BotaoDropdown
                    titulo={t("area_label")}
                    valor={filtroArea}
                    opcoes={[
                      { valor: "Todas", label: t("todas_areas") },
                      ...areasDisponiveis.map(area => ({ valor: area, label: area }))
                    ]}
                    onChange={(val) => {
                      setFiltroArea(val);
                      setSelectedCandidaturaId(null);
                    }}
                  />
                </div>

                <div style={{ flex: "1 1 160px" }}>
                  <BotaoDropdown
                    titulo={t("ordenar_por")}
                    valor={ordenacao}
                    opcoes={
                      filtroStatus === "Aceite"
                        ? [
                            { valor: "Aceites Recentemente", label: t("aceites_recentemente") || "Aceites recentemente" },
                            { valor: "Mais Recentes", label: t("ordenar_recentes") },
                            { valor: "Mais Antigas", label: t("ordenar_antigos") },
                            { valor: "Pontos (Decrescente)", label: t("mais_pontos") },
                            { valor: "Pontos (Crescente)", label: t("menos_pontos") }
                          ]
                        : filtroStatus === "Recusada"
                        ? [
                            { valor: "Recusadas Recentemente", label: t("recusadas_recently") || "Recusadas recentemente" },
                            { valor: "Mais Recentes", label: t("ordenar_recentes") },
                            { valor: "Mais Antigas", label: t("ordenar_antigos") },
                            { valor: "Pontos (Decrescente)", label: t("mais_pontos") },
                            { valor: "Pontos (Crescente)", label: t("menos_pontos") }
                          ]
                        : [
                            { valor: "Mais Recentes", label: t("ordenar_recentes") },
                            { valor: "Mais Antigas", label: t("ordenar_antigos") },
                            { valor: "Pontos (Decrescente)", label: t("mais_pontos") },
                            { valor: "Pontos (Crescente)", label: t("menos_pontos") }
                          ]
                    }
                    onChange={setOrdenacao}
                  />
                </div>
              </div>
            </div>

            {/* Scrollable list container */}
            <div className="flex-grow-1 overflow-auto custom-scrollbar pe-1 d-flex flex-column gap-3">
              {loading ? (
                <div className="text-center py-5 text-secondary d-flex flex-column align-items-center justify-content-center h-100">
                  <p className="m-0 fs-6 fw-medium text-gray-400">{t("a_carregar")}...</p>
                </div>
              ) : erro ? (
                <div className="text-center py-5 text-secondary d-flex flex-column align-items-center justify-content-center h-100 bg-gray-50/20 rounded-3">
                  <i className="fi fi-br-exclamation mb-3 text-gray-300" style={{ fontSize: "2.5rem" }}></i>
                  <p className="m-0 fs-6 fw-medium text-gray-400">{erro}</p>
                  <button 
                    className="btn btn-link mt-2" 
                    onClick={carregarCandidaturas}
                    style={{ fontSize: "0.85rem" }}
                  >
                    {t("tentar_novamente") || "Tentar novamente"}
                  </button>
                </div>
              ) : candidaturasFiltradas.length === 0 ? (
                <div className="text-center py-5 text-secondary d-flex flex-column align-items-center justify-content-center h-100 bg-gray-50/20 rounded-3">
                  <i className="fi fi-br-document mb-3 text-gray-300" style={{ fontSize: "2.5rem" }}></i>
                  <p className="m-0 fs-6 fw-medium text-gray-400">{t("nenhum_pedido_encontrado")}</p>
                </div>
              ) : (
                <>
                  {candidaturasExibidas.map((cand) => (
                    <CandidaturaCard 
                      key={cand.id} 
                      candidatura={cand}
                      isSelected={cand.id === selectedCandidaturaId}
                      onClick={() => setSelectedCandidaturaId(cand.id)}
                    />
                  ))}
                  {candidaturasFiltradas.length > limiteExibicao && (
                    <button 
                      onClick={() => setLimiteExibicao(prev => prev + 20)}
                      className="btn w-100 rounded-3 py-2 mt-2 font-medium transition-all"
                      style={{ 
                        fontSize: "0.85rem", 
                        border: "1px dashed var(--contorno)",
                        backgroundColor: "var(--fundo_submenu_hover)",
                        color: "var(--barra_lateral)"
                      }}
                    >
                      {t("carregar_mais") || "Carregar mais"} ({candidaturasFiltradas.length - limiteExibicao} restantes)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Review Panel */}
        <div className="col-12 col-md-7 d-flex flex-column overflow-hidden candidaturas-col-detalhes" style={{ minHeight: 0 }}>
          <div className="candidatura-detalhes-panel d-flex flex-column overflow-hidden shadow-xs" style={{ minHeight: 0 }}>
            {candidaturaSelecionada ? (
              <CandidaturaDetalhes 
                candidatura={candidaturaSelecionada}
                userRole={userRole}
                onAccept={handleAccept}
                onReject={handleReject}
                onClose={() => setSelectedCandidaturaId(null)}
              />
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 p-4 text-center">
                <div 
                  className="d-flex align-items-center justify-content-center rounded-circle mb-3" 
                  style={{ 
                    width: "80px", 
                    height: "80px", 
                    backgroundColor: "var(--fundo_submenu_hover)",
                    border: "var(--borda-principal) solid var(--contorno)"
                  }}
                >
                  <i className="fi fi-br-eye" style={{ fontSize: "2rem", color: "var(--barra_lateral)" }}></i>
                </div>
                <h5 className="fw-bold mb-1" style={{ fontSize: "1.1rem", color: "var(--fontes)" }}>{t("analise_requisitos")}</h5>
                <p className="m-0 text-muted" style={{ maxWidth: "320px", fontSize: "0.85rem", color: "var(--fontes)", opacity: 0.8 }}>
                  {t("selecione_candidatura_instrucao")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Modal for Validation Motif */}
      {modalConfirmacao.visible && (
        <div className="candidatura-modal-overlay" onClick={() => setModalConfirmacao(prev => ({ ...prev, visible: false }))}>
          <div className="candidatura-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="candidatura-modal-header">
              <h4 className="fw-bold m-0 d-flex align-items-center gap-2" style={{ color: "white", fontSize: "1.1rem" }}>
                <i className={modalConfirmacao.type === "Aceite" ? "fi fi-br-check-circle" : "fi fi-br-cross-circle"} style={{ fontSize: "1.15rem", verticalAlign: "middle" }}></i>
                <span>
                  {modalConfirmacao.type === "Aceite" ? t("confirmar_aceitacao") : t("confirmar_rejeicao")}
                </span>
              </h4>
              <button 
                className="candidatura-modal-close-btn" 
                onClick={() => setModalConfirmacao(prev => ({ ...prev, visible: false }))}
                aria-label="Fechar"
              >
                <i className="fi fi-br-cross" style={{ fontSize: "0.95rem" }}></i>
              </button>
            </div>

            <div className="candidatura-modal-body">
              <p className="m-0" style={{ fontSize: "0.85rem", color: "var(--fontes)", opacity: 0.9 }}>
                {modalConfirmacao.type === "Aceite" 
                  ? t("descricao_aceitar_modal") 
                  : t("descricao_rejeitar_modal")}
              </p>
              <div className="d-flex flex-column gap-2 mt-1">
                <textarea
                  className="candidatura-modal-input"
                  rows="3"
                  value={modalConfirmacao.motivo}
                  onChange={(e) => setModalConfirmacao(prev => ({ ...prev, motivo: e.target.value }))}
                  placeholder={modalConfirmacao.type === "Aceite" ? "Ex: Validado com sucesso." : "Ex: Evidências não comprovam o nível exigido."}
                  style={{ resize: "none" }}
                  autoFocus
                />
              </div>
            </div>

            <div className="candidatura-modal-footer">
              <button 
                className="btn rounded-3 d-flex align-items-center justify-content-center gap-2 px-4 py-2 candidatura-modal-btn-cancelar font-medium transition-all"
                style={{ fontSize: "0.9rem", height: "44px" }}
                onClick={() => setModalConfirmacao(prev => ({ ...prev, visible: false }))}
                disabled={loading}
              >
                <span>{t("cancelar")}</span>
              </button>
              <button 
                className={`btn rounded-3 d-flex align-items-center justify-content-center gap-2 px-4 py-2 font-medium transition-all ${modalConfirmacao.type === "Aceite" ? "aceitar_btn" : "rejeitar_btn"}`}
                style={{ fontSize: "0.9rem", height: "44px" }}
                onClick={confirmarAcaoModal}
                disabled={loading}
              >
                {loading ? (
                  <i className="fi fi-br-spinner hc-spinner"></i>
                ) : (
                  <i className={modalConfirmacao.type === "Aceite" ? "fi fi-br-check" : "fi fi-br-cross"}></i>
                )}
                <span>{modalConfirmacao.type === "Aceite" ? t("confirmar") : t("rejeitar")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
