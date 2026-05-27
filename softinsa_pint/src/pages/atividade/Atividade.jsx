import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
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

function groupActivitiesByDate(activities) {
  const groups = {};
  
  activities.forEach((activity) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOfSevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    let labelKey;
    if (activity.timestamp >= startOfToday) {
      labelKey = "hoje";
    } else if (activity.timestamp >= startOfYesterday) {
      labelKey = "ontem";
    } else if (activity.timestamp >= startOfSevenDaysAgo) {
      labelKey = "esta_semana";
    } else {
      labelKey = "mais_antigo";
    }
    
    if (!groups[labelKey]) {
      groups[labelKey] = [];
    }
    groups[labelKey].push(activity);
  });
  
  return groups;
}

export default function Atividade() {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activitiesList, setActivitiesList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/atividade")
      .then((res) => {
        const parsed = res.data.map((item) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setActivitiesList(parsed);
      })
      .catch((err) => {
        console.error("Erro ao carregar atividades do backend com Axios:", err.message);
      });
  }, []);

  const filters = [
    { id: "all", labelKey: "todos" },
    { id: "received", labelKey: "recebidos" },
    { id: "rejected", labelKey: "rejeitados" },
    { id: "updated", labelKey: "atualizados" },
    { id: "policy", labelKey: "politicas" }
  ];

  const filteredActivities = activitiesList.filter((activity) => {
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

  const displayedActivities = filteredActivities.slice(0, visibleCount);
  const groupedActivities = groupActivitiesByDate(displayedActivities);

  // Ordenação das chaves de agrupamento para garantir que aparecem por ordem correta
  const orderOfGroups = ["hoje", "ontem", "esta_semana", "mais_antigo"];
  const sortedGroupKeys = Object.keys(groupedActivities).sort(
    (a, b) => orderOfGroups.indexOf(a) - orderOfGroups.indexOf(b)
  );  return (
    <div className="atividade-page">
      {/* Barra de Pesquisa e Filtros (Top) */}
      <div className="atividade-filtros-bar d-flex flex-column flex-md-row gap-3 align-items-center justify-content-between">
        <div className="search-wrapper position-relative flex-grow-1">
          <i className="fi fi-br-search search-icon position-absolute"></i>
          <input
            type="text"
            className="form-control search-input"
            placeholder={t("pesquisar_utilizador_item")}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(10);
            }}
          />
        </div>
        <div className="filters-wrapper d-flex gap-2 overflow-x-auto pb-2 pb-md-0">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                setActiveFilter(filter.id);
                setVisibleCount(10);
              }}
              className={`btn filter-tab-btn ${
                activeFilter === filter.id ? "filter-tab-active" : "filter-tab-inactive"
              }`}
            >
              {t(filter.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Calendário e Exportar (Debaixo dos Filtros) */}
      <div className="atividade-actions-bar d-flex justify-content-end gap-2 mt-2">
        <div className="position-relative" style={{ width: "200px" }}>
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
              setVisibleCount(10);
            }}
            style={{ fontSize: "14px", height: "38px", paddingRight: selectedDate ? "35px" : "12px" }}
          />
          {selectedDate && (
            <button
              className="btn border-0 bg-transparent p-0 position-absolute end-0 top-50 translate-middle-y me-2 d-flex align-items-center justify-content-center"
              type="button"
              onClick={() => {
                setSelectedDate(null);
                setVisibleCount(10);
              }}
              style={{ width: "20px", height: "20px", zIndex: 5 }}
            >
              <i className="fi fi-br-cross" style={{ fontSize: "10px", color: "var(--rejeitar)" }}></i>
            </button>
          )}
        </div>
        <button className="btn btn-exportar d-flex align-items-center gap-2" style={{ height: "38px" }}>
          <i className="fi fi-br-filter"></i>
          {t("exportar")}
        </button>
      </div>

      {/* Linha de Tempo de Atividades */}
      <main className="atividade-content flex-grow-1">
        {sortedGroupKeys.length === 0 ? (
          <div className="text-center py-5 no-activity-box">
            <div className="inline-flex-circle mb-3">
              <i className="fi fi-br-clock fs-3 text-muted"></i>
            </div>
            <h4 className="fw-semibold">{t("notificacao_vazia")}</h4>
          </div>
        ) : (
          <div className="timeline-groups-container">
            {sortedGroupKeys.map((groupKey) => {
              const activities = groupedActivities[groupKey];
              return (
                <div key={groupKey} className="timeline-group-section">
                  {/* Cabeçalho do Grupo */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="timeline-group-title m-0">{t(groupKey).toUpperCase()}</h2>
                    <span className="timeline-group-counter text-muted">
                      {activities.length}{" "}
                      {activities.length === 1
                        ? t("atividades_singular")
                        : t("atividades_plural")}
                    </span>
                  </div>

                  {/* Lista de Atividades do Grupo */}
                  <div className="timeline-items-list position-relative">
                    {activities.map((activity) => {
                      const config = activityConfig[activity.type];
                      return (
                        <div key={activity.id} className="timeline-item d-flex gap-4">
                          {/* Coluna da Esquerda: Caixa do Ícone */}
                          <div className="timeline-left-col position-relative">
                            <div
                              className={`timeline-icon-box d-flex align-items-center justify-content-center ${config.colorClass}`}
                            >
                              <i className={`fi ${config.icon}`}></i>
                            </div>
                          </div>

                          {/* Coluna da Direita: Cartão com Detalhes */}
                          <div className="timeline-card-col card flex-grow-1">
                            <div className="card-body p-3">
                              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-2">
                                <div className="activity-text m-0">
                                  <strong>{activity.user}</strong>{" "}
                                  <span className="text-muted-dark">{t(config.actionKey)}</span>{" "}
                                  <strong>{activity.item}</strong>
                                </div>
                                <div className="activity-time text-muted d-flex align-items-center gap-1">
                                  <i className="fi fi-br-clock"></i>
                                  <span>{formatTimeAgo(activity.timestamp, t)}</span>
                                </div>
                              </div>

                              {/* Tag correspondente ao tipo de atividade */}
                              <div className="activity-tag-row mt-2">
                                <span className={`activity-badge-tag ${config.colorClass}`}>
                                  {t(config.tagKey)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Botão Carregar Mais */}
        {visibleCount < filteredActivities.length && (
          <div className="text-center mt-4">
            <button 
              className="btn btn-carregar-mais"
              onClick={() => setVisibleCount((prev) => prev + 10)}
            >
              {t("carregar_mais")}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
