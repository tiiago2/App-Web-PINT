import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import BarraPesquisa from "../../components/ui/BarraPesquisa/BarraPesquisa";
import BotaoAcao from "../../components/ui/BotaoAcao/BotaoAcao";
import useToast from "../../hooks/useToast.js";
import api from "../../services/api.js";
import "./Atividade.css";

const activityConfig = {
  received: {
    icon: "fi-br-check",
    colorClass: "success",
    tagKey: "recebido_tag",
    actionKey: "recebeu_acao"
  },
  rejected: {
    icon: "fi-br-cross",
    colorClass: "danger",
    tagKey: "rejeitado_tag",
    actionKey: "rejeitado_acao"
  },
  updated: {
    icon: "fi-br-refresh",
    colorClass: "info",
    tagKey: "atualizado_tag",
    actionKey: "atualizado_acao"
  },
  policy: {
    icon: "fi-br-document",
    colorClass: "secondary",
    tagKey: "politica_tag",
    actionKey: "atualizadas_acao"
  }
};

const statConfig = {
  total: { icon: "fi-br-apps", colorClass: "total", labelKey: "total" },
  received: { icon: "fi-br-check", colorClass: "success", labelKey: "recebidos" },
  rejected: { icon: "fi-br-cross", colorClass: "danger", labelKey: "rejeitados" },
  updated: { icon: "fi-br-refresh", colorClass: "info", labelKey: "atualizados" },
  policy: { icon: "fi-br-document", colorClass: "secondary", labelKey: "politicas" }
};

function formatTimeAgo(date, t) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    return t("menos_uma_hora");
  }
  if (diffHours < 24) {
    return diffHours === 1
      ? t("ha_horas_singular", { count: diffHours })
      : t("ha_horas_plural", { count: diffHours });
  }
  if (diffDays === 1) {
    return t("ontem");
  }
  if (diffDays < 7) {
    return diffDays === 1
      ? t("ha_dias_singular", { count: diffDays })
      : t("ha_dias_plural", { count: diffDays });
  }

  return date.toLocaleDateString();
}

function getGroupKey(timestamp) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const startOfSevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);

  if (timestamp >= startOfToday) return "hoje";
  if (timestamp >= startOfYesterday) return "ontem";
  if (timestamp >= startOfSevenDaysAgo) return "esta_semana";
  return "mais_antigo";
}

function groupActivitiesByDate(activities) {
  const groups = {};
  activities.forEach((activity) => {
    const labelKey = getGroupKey(activity.timestamp);
    if (!groups[labelKey]) groups[labelKey] = [];
    groups[labelKey].push(activity);
  });
  return groups;
}

export default function Atividade() {
  const { t } = useTranslation();
  const { mostrarToast } = useToast();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activitiesList, setActivitiesList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [mostrarExportar, setMostrarExportar] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, received: 0, rejected: 0, updated: 0, policy: 0 });
  const exportRef = useRef(null);

  const carregarAtividades = async (pagina = 1, reset = false) => {
    try {
      setLoading(true);

      const roleGuardada = localStorage.getItem("role_softinsa");
      let perfilAtivo = "";
      if (roleGuardada) {
        try {
          const roleParseada = JSON.parse(roleGuardada);
          perfilAtivo = roleParseada?.nome || "";
        } catch {
          perfilAtivo = roleGuardada;
        }
      }

      const res = await api.get("/atividade/get", {
        params: { page: pagina, limit: 20, perfil: perfilAtivo }
      });
      const atividades = res.data.data || [];
      const pagination = res.data.pagination || {};

      const atividadesFormatadas = atividades.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));

      if (reset) {
        setActivitiesList(atividadesFormatadas);
        setStats(res.data.stats || { total: 0, received: 0, rejected: 0, updated: 0, policy: 0 });
      } else {
        setActivitiesList((prev) => [...prev, ...atividadesFormatadas]);
      }

      setHasMore(pagination.hasMore ?? atividadesFormatadas.length === 20);
      setPage(pagina);
    } catch (err) {
      console.error("Erro ao carregar atividades do backend:", err.message);
      if (reset) {
        setActivitiesList([]);
        setStats({ total: 0, received: 0, rejected: 0, updated: 0, policy: 0 });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAtividades(1, true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setMostrarExportar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filters = [
    { id: "all", labelKey: "todos" },
    { id: "received", labelKey: "recebidos" },
    { id: "rejected", labelKey: "rejeitados" },
    { id: "updated", labelKey: "atualizados" },
    { id: "policy", labelKey: "politicas" }
  ];

  const filteredActivities = useMemo(() => {
    return activitiesList.filter((activity) => {
      const matchesFilter = activeFilter === "all" || activity.type === activeFilter;
      const matchesSearch =
        searchQuery === "" ||
        activity.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.item.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesDate = true;
      if (selectedDate) {
        const actDate = new Date(activity.timestamp);
        matchesDate =
          actDate.getFullYear() === selectedDate.getFullYear() &&
          actDate.getMonth() === selectedDate.getMonth() &&
          actDate.getDate() === selectedDate.getDate();
      }

      return matchesFilter && matchesSearch && matchesDate;
    });
  }, [activitiesList, activeFilter, searchQuery, selectedDate]);

  // As estatísticas dos cards vêm do backend e representam o total global
  // (independentemente do que está carregado/visualmente filtrado)

  const groupedActivities = useMemo(() => groupActivitiesByDate(filteredActivities), [filteredActivities]);

  const orderOfGroups = ["hoje", "ontem", "esta_semana", "mais_antigo"];
  const groupKeys = orderOfGroups.filter((key) => groupedActivities[key]);

  const handleAbrirMenuExportacao = async () => {
    try {
      const response = await api.get('/permissoes/exportar');

      if (response.data.toggle) {
        setMostrarExportar((estadoAtual) => !estadoAtual);
      } else {
        setMostrarExportar(false);
        mostrarToast("Não tens permissões para exportar estes dados.", "erro");
      }
    } catch (erro) {
      console.error("Erro ao verificar permissão:", erro);
      setMostrarExportar(false);
      mostrarToast("Erro ao verificar permissão de exportação.", "erro");
    }
  };

  const handleExportarExcel = () => {
    const livro = XLSX.utils.book_new();

    const dadosExportar = filteredActivities.map((a) => ({
      "Utilizador": a.user,
      "Item": a.item,
      "Tipo": a.type,
      "Data": a.timestamp.toLocaleString()
    }));

    const folha = XLSX.utils.json_to_sheet(dadosExportar);
    XLSX.utils.book_append_sheet(livro, folha, "Atividades");
    XLSX.writeFile(livro, "Atividades_Export.xlsx");
    setMostrarExportar(false);
  };

  const handleExportarPDF = () => {
    try {
      const doc = new jsPDF('p', 'pt', 'a4');

      doc.setFontSize(18);
      doc.setTextColor(0, 86, 179);
      doc.text("Histórico de Atividades", 40, 40);

      doc.setFontSize(11);
      doc.setTextColor(80);
      doc.text(`Total de Registos Exportados: ${filteredActivities.length}`, 40, 70);

      let posiçãoY_Atual = 100;

      const dadosExportar = filteredActivities.map((a) => [
        a.user || "-",
        a.item || "-",
        a.type || "-",
        a.timestamp ? a.timestamp.toLocaleString() : "-"
      ]);

      autoTable(doc, {
        startY: posiçãoY_Atual,
        head: [["Utilizador", "Item", "Tipo", "Data"]],
        body: dadosExportar.length > 0 ? dadosExportar : [["Sem dados", "-", "-", "-"]],
        theme: 'striped',
        headStyles: { fillColor: [0, 86, 179] },
        styles: { fontSize: 10 }
      });

      doc.save("Atividades_Export.pdf");
      setMostrarExportar(false);
    } catch (erro) {
      console.error("Erro CRÍTICO ao gerar o PDF:", erro);
      mostrarToast("Erro ao gerar o PDF.", "erro");
    }
  };

  const renderGroup = (groupKey) => {
    const activities = groupedActivities[groupKey];
    return (
      <div key={groupKey} className="timeline-group-section">
        <div className="timeline-group-header">
          <h2 className="timeline-group-title">{t(groupKey).toUpperCase()}</h2>
          <span className="timeline-group-counter">
            {activities.length}{" "}
            {activities.length === 1 ? t("atividades_singular") : t("atividades_plural")}
          </span>
        </div>

        <div className="timeline-items-list">
          {activities.map((activity) => {
            const config = activityConfig[activity.type];
            return (
              <div key={activity.id} className="timeline-item">
                <div className="timeline-left-col">
                  <div className={`timeline-icon-box ${config.colorClass}`}>
                    <i className={`fi ${config.icon}`}></i>
                  </div>
                </div>

                <div className="timeline-card-col">
                  <div className="timeline-card-body">
                    <div className="timeline-card-main">
                      <p className="activity-text">
                        {activity.type === "updated" || activity.type === "policy" ? (
                          <>
                            <strong>{activity.user}</strong>{" "}
                            <span className="activity-action">{activity.item}</span>
                          </>
                        ) : (
                          <>
                            <strong>{activity.user}</strong>{" "}
                            <span className="activity-action">{t(config.actionKey)}</span>{" "}
                            <strong>{activity.item}</strong>
                          </>
                        )}
                      </p>
                      <div className="activity-time">
                        <i className="fi fi-br-clock"></i>
                        <span>{formatTimeAgo(activity.timestamp, t)}</span>
                      </div>
                    </div>
                    <span className={`activity-badge-tag ${config.colorClass}`}>
                      {t(config.tagKey)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="atividade-container w-100">
      {/* Header */}
      <div className="atividade-header">
        <h1 className="texto-titulo-principal">{t("atividades_titulo")}</h1>
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

      {/* Cards de estatísticas */}
      <div className="atividade-stats-row">
        {Object.entries(statConfig).map(([key, config]) => (
          <div
            key={key}
            className={`atividade-stat-card ${config.colorClass} ${activeFilter === key ? "active" : ""}`}
            onClick={() => setActiveFilter(key === "total" ? "all" : key)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setActiveFilter(key === "total" ? "all" : key);
              }
            }}
          >
            <div className="atividade-stat-info">
              <span className="atividade-stat-value">{stats[key]}</span>
              <span className="atividade-stat-label">{t(config.labelKey)}</span>
            </div>
            <div className={`atividade-stat-icon ${config.colorClass}`}>
              <i className={`fi ${config.icon}`}></i>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de filtros */}
      <div className="atividade-filtros-bar">
        <div className="atividade-pesquisa">
          <BarraPesquisa
            valor={searchQuery}
            onChange={(val) => setSearchQuery(val)}
            placeholder={t("pesquisar_utilizador_item")}
          />
        </div>
        <div className="atividade-data-picker">
          <input
            type="date"
            className="form-control btn-filtrar-data-bootstrap"
            value={selectedDate ? selectedDate.toISOString().split("T")[0] : ""}
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                const [year, month, day] = val.split("-").map(Number);
                setSelectedDate(new Date(year, month - 1, day));
              } else {
                setSelectedDate(null);
              }
            }}
          />
          {selectedDate && (
            <button
              className="btn atividade-data-clear"
              type="button"
              onClick={() => setSelectedDate(null)}
            >
              <i className="fi fi-br-cross"></i>
            </button>
          )}
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="atividade-resultados">
        <strong>{stats.total}</strong>{" "}
        {stats.total === 1 ? t("atividades_singular") : t("atividades_plural")}
      </div>

      {/* Timeline */}
      <main className="atividade-content flex-grow-1">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-5 no-activity-box">
            <div className="inline-flex-circle mb-3">
              <i className="fi fi-br-clock fs-3 text-muted"></i>
            </div>
            <h4 className="fw-semibold">{t("notificacao_vazia")}</h4>
          </div>
        ) : (
          <div className="timeline-groups-container">
            {groupKeys.map(renderGroup)}
          </div>
        )}

        {/* Botão Carregar Mais */}
        {hasMore && (
          <div className="text-center mt-4">
            <button
              className="btn btn-carregar-mais"
              onClick={() => carregarAtividades(page + 1)}
              disabled={loading}
            >
              {loading ? t("a_carregar") : t("carregar_mais")}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
