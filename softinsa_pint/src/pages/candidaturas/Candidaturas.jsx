import React, { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import SeletorAbas from "../../components/ui/SeletorAbas/SeletorAbas_Galeria";
import BarraPesquisa from "../../components/ui/BarraPesquisa/BarraPesquisa";
import BotaoDropdown from "../../components/ui/BotaoDropdown/BotaoDropdown";
import BotaoAcao from "../../components/ui/BotaoAcao/BotaoAcao";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from "../../services/api.js";
import "./candidaturas.css";

// MOCK DATABASE & DATA SCHEMA
const badgesMock = [
  { 
    id: 1, 
    titulo: "Low Code", 
    pontos: 20, 
    descricao: "Aqui estará a descrição do badge de Low Code. Este badge foca-se no desenvolvimento rápido utilizando plataformas visuais.", 
    cor: "#c2d992", 
    borderCor: "#5EA500", 
    icon: "fi-br-microchip" 
  },
  { 
    id: 2, 
    titulo: "Cloud Native", 
    pontos: 35, 
    descricao: "Aqui estará a descrição do badge de Cloud Native. Este badge valida competências de deployment e orquestração de containers.", 
    cor: "#d1e1f0", 
    borderCor: "#45556C", 
    icon: "fi-br-cloud" 
  },
  { 
    id: 3, 
    titulo: "Mobile Developer", 
    pontos: 25, 
    descricao: "Aqui estará a descrição do badge de Mobile Developer. Foca-se em desenvolvimento multiplataforma (iOS e Android) com React Native.", 
    cor: "#e08a90", 
    borderCor: "#AE012F", 
    icon: "fi-br-smartphone" 
  },
  { 
    id: 4, 
    titulo: "UX Designer", 
    pontos: 15, 
    descricao: "Aqui estará a descrição do badge de UX Designer. Foca-se na facilidade de uso, arquitetura de informação e fluxos de utilizador.", 
    cor: "#e9d78e", 
    borderCor: "#E17100", 
    icon: "fi-br-target" 
  }
];

const usersMock = [
  { id: 1, nome: "João Silva", area: "Hybrid Systems", serviceLine: "Hybrid Systems" },
  { id: 2, nome: "Maria Ana", area: "Mobile Solutions", serviceLine: "Mobile Solutions" },
  { id: 3, nome: "Rui Costa", area: "Cloud & DevOps", serviceLine: "Infrastructure" },
  { id: 4, nome: "Ana Reis", area: "Hybrid Systems", serviceLine: "Hybrid Systems" }
];

const initialCandidaturas = [
  { 
    id: 1, 
    userId: 1, 
    badgeId: 1, 
    submetido: "2026-06-06T13:30:00Z", 
    status: "Pendente", 
    progresso: 100, 
    requisitos: [
      "Demonstrar proficiência em ferramentas drag-and-drop", 
      "Completar o tutorial interativo de criação de fluxos",
      "dsadsadsadsa", 
      " o tutorial interativo de criação de fluxos"
    ] 
  },
  { 
    id: 2, 
    userId: 2, 
    badgeId: 3, 
    submetido: "2026-06-06T11:30:00Z", 
    status: "Pendente", 
    progresso: 80, 
    requisitos: [
      "Criar uma aplicação funcional em React Native", 
      "Publicar versão de testes na App Store / Google Play"
    ] 
  },
  { 
    id: 3, 
    userId: 3, 
    badgeId: 2, 
    submetido: "2026-06-05T15:20:00Z", 
    status: "Pendente", 
    progresso: 95, 
    requisitos: [
      "Configurar cluster Kubernetes", 
      "Automatizar pipelines de CI/CD utilizando GitHub Actions"
    ] 
  },
  { 
    id: 4, 
    userId: 4, 
    badgeId: 4, 
    submetido: "2026-06-04T09:15:00Z", 
    status: "Aceite", 
    progresso: 100, 
    requisitos: [
      "Apresentar protótipo navegável em Figma", 
      "Realizar testes de usabilidade com 5 utilizadores reais"
    ] 
  },
  { 
    id: 5, 
    userId: 1, 
    badgeId: 2, 
    submetido: "2026-06-03T18:40:00Z", 
    status: "Recusada", 
    progresso: 100, 
    requisitos: [
      "Configurar cluster Kubernetes", 
      "Automatizar pipelines de CI/CD utilizando GitHub Actions"
    ] 
  }
];

const initialList = initialCandidaturas.map((cand) => {
  const user = usersMock.find((u) => u.id === cand.userId);
  const badge = badgesMock.find((b) => b.id === cand.badgeId);
  return { ...cand, user, badge };
});

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
          backgroundColor: `${badge.cor}25`, 
          borderColor: badge.borderCor
        }}
      >
        <i className={`fi ${badge.icon}`} style={{ fontSize: "1.2rem", color: badge.borderCor }}></i>
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

        <div className="candidatura-progresso-bar-wrap mb-2">
          <div className="candidatura-progresso-bar-fill" style={{ width: `${candidatura.progresso}%` }}></div>
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
function CandidaturaDetalhes({ candidatura, onAccept, onReject, onClose }) {
  const { t, i18n } = useTranslation();
  const { user, badge } = candidatura;
  
  const formatSubmetidoCompleto = (dateStr) => {
    const options = { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" };
    const localeCode = i18n.language === "gb" ? "en-GB" : i18n.language === "es" ? "es-ES" : "pt-PT";
    return new Date(dateStr).toLocaleDateString(localeCode, options);
  };

  return (
    <div className="d-flex flex-column h-100" style={{ minHeight: 0 }}>
      <div className="p-3 border-bottom d-flex justify-content-between align-items-center flex-shrink-0" style={{ borderColor: "var(--contorno) !important" }}>
        <h5 className="fw-bold m-0" style={{ fontSize: "1.15rem", color: "var(--fontes)" }}>{t("ficha_candidatura")}</h5>
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
        <div className="d-flex flex-column gap-4">
          
          <div className="d-flex flex-column flex-sm-row align-items-center align-items-sm-start gap-4">
            <div 
              className="candidatura-detalhe-icon-circle transition-all hover:scale-105"
              style={{ 
                backgroundColor: `${badge.cor}30`,
                borderColor: badge.borderCor
              }}
            >
              <i className={`fi ${badge.icon}`} style={{ fontSize: "2.2rem", color: badge.borderCor }}></i>
            </div>

            <div className="flex-grow-1 text-center text-sm-start w-100">
              <h3 className="fw-bold mb-2" style={{ fontSize: "1.3rem", color: "var(--fontes)" }}>{badge.titulo}</h3>
              
              <div className="d-flex flex-column gap-1.5 mb-3" style={{ fontSize: "0.85rem", color: "var(--fontes)" }}>
                <div className="d-flex align-items-center justify-content-center justify-content-sm-start gap-2">
                  <i className="fi fi-br-user" style={{ color: "var(--barra_lateral)" }}></i>
                  <span className="fw-bold fs-6">{user.nome}</span>
                </div>
                <div className="opacity-75">
                  <strong>{t("area_label")}:</strong> {user.area}
                </div>
                <div className="opacity-75">
                  <strong>{t("submetido_label")}:</strong> {formatSubmetidoCompleto(candidatura.submetido)}
                </div>
                <div className="opacity-75">
                  <strong>{t("pontuacao_label")}:</strong> <span className="badge bg-gray-200 text-gray-700 font-bold px-2 py-0.5">{t("pontos_count", { count: badge.pontos })}</span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-3">
                <div className="candidatura-progresso-bar-wrap">
                  <div className="candidatura-progresso-bar-fill" style={{ width: `${candidatura.progresso}%` }}></div>
                </div>
                <span className="fw-bold fs-6" style={{ color: "var(--barra_progresso)" }}>{candidatura.progresso}%</span>
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
            
            <div className="d-flex flex-column gap-2">
              {candidatura.requisitos.map((req, idx) => (
                <div key={idx} className="requisito-card shadow-xs">
                  <div className="d-flex align-items-center gap-3 min-w-0">
                    <span className="fw-bold" style={{ fontSize: "0.95rem", color: "var(--barra_lateral)" }}>{idx + 1}.</span>
                    <span className="truncate" style={{ fontSize: "0.85rem", color: "var(--fontes)" }}>{req}</span>
                  </div>
                  <button 
                    onClick={() => alert(t("transferindo_documentacao", { req }))}
                    className="requisito-doc-btn"
                    title={t("download_comprovativo")}
                  >
                    <i className="fi fi-br-document" style={{ fontSize: "0.85rem" }}></i>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {candidatura.status === "Pendente" && (
            <div className="d-flex gap-3 justify-content-end mt-2">
              <button 
                onClick={() => onReject(candidatura.id)}
                className="btn rounded-3 d-flex align-items-center justify-content-center gap-2 px-4 py-2 rejeitar_btn font-medium transition-all"
                style={{ fontSize: "0.9rem", height: "44px" }}
              >
                <i className="fi fi-br-cross"></i>
                <span>Rejeitar</span>
              </button>
              
              <button 
                onClick={() => onAccept(candidatura.id)}
                className="btn rounded-3 d-flex align-items-center justify-content-center gap-2 px-4 py-2 aceitar_btn font-medium transition-all"
                style={{ fontSize: "0.9rem", height: "44px" }}
              >
                <i className="fi fi-br-check"></i>
                <span>Aceitar</span>
              </button>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

// MAIN PAGE COMPONENT
export default function Candidaturas({ loggedUser }) {
  const { t } = useTranslation();
  const [candidaturas, setCandidaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidaturaId, setSelectedCandidaturaId] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("Pendente");
  const [filtroArea, setFiltroArea] = useState("Todas");
  const [ordenacao, setOrdenacao] = useState("Mais Recentes");

  useEffect(() => {
    carregarCandidaturas();
  }, [loggedUser]);

  const carregarCandidaturas = async () => {
    try {
      setLoading(true);
      const res = await api.get("/candidaturas");
      
      const coresTemplate = [
        { cor: "#c2d992", borderCor: "#5EA500", icon: "fi-br-microchip" },
        { cor: "#d1e1f0", borderCor: "#45556C", icon: "fi-br-cloud" },
        { cor: "#e08a90", borderCor: "#AE012F", icon: "fi-br-smartphone" },
        { cor: "#e9d78e", borderCor: "#E17100", icon: "fi-br-target" }
      ];

      const mapped = res.data.map((sub, index) => {
        const template = coresTemplate[index % coresTemplate.length];
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
    } finally {
      setLoading(false);
    }
  };
  const [pesquisa, setPesquisa] = useState("");
  const [toastMessage, setToastMessage] = useState(null);
  const [mostrarExportar, setMostrarExportar] = useState(false);
  const exportRef = useRef(null);

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

  // Filtering & Sorting derived state
  const candidaturasFiltradas = useMemo(() => {
    let result = [...candidaturas];

    // 1. Filter by Status Tab
    result = result.filter((c) => c.status === filtroStatus);

    // 2. Filter by Selected Area dropdown
    if (filtroArea !== "Todas") {
      result = result.filter((c) => c.user && c.user.area === filtroArea);
    }

    // 4. Search Filter (by candidate name or badge title)
    if (pesquisa.trim() !== "") {
      const query = pesquisa.toLowerCase();
      result = result.filter(
        (c) =>
          (c.user && c.user.nome.toLowerCase().includes(query)) ||
          (c.badge && c.badge.titulo.toLowerCase().includes(query))
      );
    }

    // 5. Sorting
    result.sort((a, b) => {
      if (ordenacao === "Mais Recentes") {
        return new Date(b.submetido) - new Date(a.submetido);
      } else if (ordenacao === "Mais Antigas") {
        return new Date(a.submetido) - new Date(b.submetido);
      } else if (ordenacao === "Pontos (Decrescente)") {
        return (b.badge ? b.badge.pontos : 0) - (a.badge ? a.badge.pontos : 0);
      } else if (ordenacao === "Pontos (Crescente)") {
        return (a.badge ? a.badge.pontos : 0) - (b.badge ? b.badge.pontos : 0);
      }
      return 0;
    });

    return result;
  }, [candidaturas, filtroStatus, filtroArea, pesquisa, ordenacao]);

  // Resolve currently selected candidacy item
  const candidaturaSelecionada = useMemo(() => {
    return candidaturas.find((c) => c.id === selectedCandidaturaId) || null;
  }, [candidaturas, selectedCandidaturaId]);

  // Handlers for accept/reject actions
  const handleAccept = async (id) => {
    const item = candidaturas.find((c) => c.id === id);
    if (!item) return;

    try {
      await api.put(`/candidaturas/${id}/status`, { status: "Aceite" });
      setCandidaturas((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "Aceite" } : c))
      );
      setSelectedCandidaturaId(null);
      setToastMessage(t("candidatura_aprovada_sucesso", { nome: item.user.nome, badge: item.badge.titulo }));
    } catch (error) {
      console.error("Erro ao aceitar candidatura:", error);
      alert("Não foi possível aceitar a candidatura.");
    }
  };

  const handleReject = async (id) => {
    const item = candidaturas.find((c) => c.id === id);
    if (!item) return;

    try {
      await api.put(`/candidaturas/${id}/status`, { status: "Recusada" });
      setCandidaturas((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "Recusada" } : c))
      );
      setSelectedCandidaturaId(null);
      setToastMessage(t("candidatura_rejeitada_sucesso", { nome: item.user.nome, badge: item.badge.titulo }));
    } catch (error) {
      console.error("Erro ao rejeitar candidatura:", error);
      alert("Não foi possível rejeitar a candidatura.");
    }
  };

  const handleAbrirMenuExportacao = async () => {
    try {
        // FAZER_API_PARA_RECEBER_TOGGLE
        const response = await api.get('/api/permissoes/exportar'); 
        
        if (response.data.toggle) {
            setMostrarExportar(estadoAtual => !estadoAtual);
        } else {
            setMostrarExportar(false);
            alert("Não tens permissões para exportar estes dados.");
        }
    } catch (erro) {
        console.error("Erro ao verificar permissão:", erro);
        // Fallback
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
            backgroundColor: "rgba(0, 153, 102, 0.1)", 
            borderLeft: "5px solid var(--aceitar)", 
            color: "var(--aceitar)"
          }}
        >
          <i className="fi fi-br-check-circle fs-5" style={{ color: "var(--aceitar)" }}></i>
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
                      { valor: "Hybrid Systems", label: "Hybrid Systems" },
                      { valor: "Mobile Solutions", label: "Mobile Solutions" },
                      { valor: "Cloud & DevOps", label: "Cloud & DevOps" },
                      { valor: "Cybersecurity", label: "Cybersecurity" }
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
                    opcoes={[
                      { valor: "Mais Recentes", label: t("ordenar_recentes") },
                      { valor: "Mais Antigas", label: t("ordenar_antigos") },
                      { valor: "Pontos (Decrescente)", label: t("mais_pontos") },
                      { valor: "Pontos (Crescente)", label: t("menos_pontos") }
                    ]}
                    onChange={setOrdenacao}
                  />
                </div>
              </div>
            </div>

            {/* Scrollable list container */}
            <div className="flex-grow-1 overflow-auto custom-scrollbar pe-1 d-flex flex-column gap-3">
              {loading ? (
                <div className="text-center py-5 text-secondary d-flex flex-column align-items-center justify-content-center h-100">
                  <p className="m-0 fs-6 fw-medium text-gray-400">A carregar candidaturas...</p>
                </div>
              ) : candidaturasFiltradas.length === 0 ? (
                <div className="text-center py-5 text-secondary d-flex flex-column align-items-center justify-content-center h-100 bg-gray-50/20 rounded-3">
                  <i className="fi fi-br-document mb-3 text-gray-300" style={{ fontSize: "2.5rem" }}></i>
                  <p className="m-0 fs-6 fw-medium text-gray-400">{t("nenhum_pedido_encontrado")}</p>
                </div>
              ) : (
                candidaturasFiltradas.map((cand) => (
                  <CandidaturaCard 
                    key={cand.id} 
                    candidatura={cand}
                    isSelected={cand.id === selectedCandidaturaId}
                    onClick={() => setSelectedCandidaturaId(cand.id)}
                  />
                ))
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
    </main>
  );
}
