import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function TabSLA() {
  const { t } = useTranslation();

  const [slaConfig, setSlaConfig] = useState({
    fase1_dias: 5,
    fase2_dias: 3,
    push_interna: true,
    aviso_email: true,
    escalada_horas: 24,
  });

  const toggleSla = (key) => {
    setSlaConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const metricasSLA = {
    risco: 0,
    foraPrazo: 3,
    mediaDias: 2.4,
  };

  const getRiscoConfig = (val) => {
    if (val === 0) return { color: "#2ecc71", icon: "fi-br-check-circle" };
    if (val <= 5) return { color: "#f39c12", icon: "fi-br-engine-warning" };
    return { color: "#e74c3c", icon: "fi-br-flame" };
  };

  const getForaPrazoConfig = (val) => {
    if (val === 0) return { color: "#2ecc71", icon: "fi-br-check-circle" };
    if (val <= 2) return { color: "#f39c12", icon: "fi-br-engine-warning" };
    return { color: "#e74c3c", icon: "fi-br-time-past" };
  };

  const getMediaConfig = (val) => {
    if (val < 2) return { color: "#2ecc71", icon: "fi-br-rocket" };
    if (val <= 4) return { color: "#f39c12", icon: "fi-br-stats" };
    return { color: "#e74c3c", icon: "fi-br-hourglass-end" };
  };

  const configRisco = getRiscoConfig(metricasSLA.risco);
  const configForaPrazo = getForaPrazoConfig(metricasSLA.foraPrazo);
  const configMedia = getMediaConfig(metricasSLA.mediaDias);

  return (
    <div className="d-flex flex-column gap-4 pb-4">
      <div>
        <h3 className="section-title">{t("sla")}</h3>
        <p className="section-subtitle">
          Configura as métricas e tempos de resposta acordados para o
          fluxo de badges.
        </p>
      </div>

      {/* Painel de Monitorização Ativa */}
      <div className="row g-3">
        <div className="col-md-4">
          <div className="p-4 border border-2 rounded-4 bg-light shadow-sm h-100 d-flex flex-column justify-content-center position-relative overflow-hidden">
            <div
              className="position-absolute opacity-25"
              style={{
                top: "15px",
                right: "20px",
                fontSize: "3rem",
                color: configRisco.color,
                zIndex: 0,
              }}
            >
              <i className={`fi ${configRisco.icon}`}></i>
            </div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <h6
                className="text-muted fw-semibold mb-2"
                style={{
                  fontSize: "0.85rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Pedidos em Risco
              </h6>
              <div className="d-flex align-items-end gap-2 mt-1">
                <span
                  className="fw-bold"
                  style={{
                    fontSize: "2.5rem",
                    color: configRisco.color,
                    lineHeight: "1",
                  }}
                >
                  {metricasSLA.risco}
                </span>
              </div>
              <div
                className="text-muted mt-2 fw-medium"
                style={{ fontSize: "0.75rem" }}
              >
                A menos de 24h de estoirar o SLA
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="p-4 border border-2 rounded-4 bg-light shadow-sm h-100 d-flex flex-column justify-content-center position-relative overflow-hidden">
            <div
              className="position-absolute opacity-25"
              style={{
                top: "15px",
                right: "20px",
                fontSize: "3rem",
                color: configForaPrazo.color,
                zIndex: 0,
              }}
            >
              <i className={`fi ${configForaPrazo.icon}`}></i>
            </div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <h6
                className="text-muted fw-semibold mb-2"
                style={{
                  fontSize: "0.85rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Fora do Prazo
              </h6>
              <div className="d-flex align-items-end gap-2 mt-1">
                <span
                  className="fw-bold"
                  style={{
                    fontSize: "2.5rem",
                    color: configForaPrazo.color,
                    lineHeight: "1",
                  }}
                >
                  {metricasSLA.foraPrazo}
                </span>
              </div>
              <div
                className="text-muted mt-2 fw-medium"
                style={{ fontSize: "0.75rem" }}
              >
                Candidaturas atualmente atrasadas
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="p-4 border border-2 rounded-4 bg-light shadow-sm h-100 d-flex flex-column justify-content-center position-relative overflow-hidden">
            <div
              className="position-absolute opacity-25"
              style={{
                top: "15px",
                right: "20px",
                fontSize: "3rem",
                color: configMedia.color,
                zIndex: 0,
              }}
            >
              <i className={`fi ${configMedia.icon}`}></i>
            </div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <h6
                className="text-muted fw-semibold mb-2"
                style={{
                  fontSize: "0.85rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Média de Resposta
              </h6>
              <div className="d-flex align-items-end gap-1 mt-1">
                <span
                  className="fw-bold"
                  style={{
                    fontSize: "2.5rem",
                    color: configMedia.color,
                    lineHeight: "1",
                  }}
                >
                  {metricasSLA.mediaDias}
                </span>
                <span
                  className="text-muted pb-1 fw-bold"
                  style={{ fontSize: "0.9rem" }}
                >
                  dias
                </span>
              </div>
              <div
                className="text-muted mt-2 fw-medium"
                style={{ fontSize: "0.75rem" }}
              >
                Tempo médio p/ fechar processo
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card: Prazos Limite */}
      <div className="p-4 border border-2 rounded-4 bg-light shadow-sm">
        <h5
          className="mb-4 fw-semibold"
          style={{ color: "var(--fontes)" }}
        >
          Configuração de Prazos Limite
        </h5>

        <div className="d-flex flex-column gap-3">
          <div className="d-flex align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3 flex-grow-1">
              <label className="form-check-label fw-semibold mb-1">
                SLA - Fase 1 (Talent Manager)
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                Tempo máximo para o Talent Manager avaliar as evidências
                submetidas e prosseguir com o processo ou solicitar
                retificações.
              </p>
            </div>
            <div style={{ width: "130px" }}>
              <div className="input-group">
                <input
                  type="number"
                  className="form-control text-center px-1"
                  value={slaConfig.fase1_dias}
                  onChange={(e) =>
                    setSlaConfig({
                      ...slaConfig,
                      fase1_dias: e.target.value,
                    })
                  }
                  min="1"
                  max="99"
                />
                <span className="input-group-text bg-light text-muted px-2">
                  dias
                </span>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3 flex-grow-1">
              <label className="form-check-label fw-semibold mb-1">
                SLA - Fase 2 (Service Line Leader)
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                Tempo máximo para o Líder de Área emitir o parecer técnico
                final (Aprovar, Rejeitar ou Send Back) após validação
                inicial.
              </p>
            </div>
            <div style={{ width: "130px" }}>
              <div className="input-group">
                <input
                  type="number"
                  className="form-control text-center px-1"
                  value={slaConfig.fase2_dias}
                  onChange={(e) =>
                    setSlaConfig({
                      ...slaConfig,
                      fase2_dias: e.target.value,
                    })
                  }
                  min="1"
                  max="99"
                />
                <span className="input-group-text bg-light text-muted px-2">
                  dias
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card: Gatilhos para SLAs Ultrapassados */}
      <div className="p-4 border border-2 rounded-4 bg-light shadow-sm">
        <h5
          className="mb-4 fw-semibold"
          style={{ color: "var(--fontes)" }}
        >
          Gatilhos para SLAs Ultrapassados (Automações)
        </h5>

        <div className="d-flex flex-column gap-3">
          <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3">
              <label className="form-check-label fw-semibold mb-1">
                Notificação PUSH Interna
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                Dispara um alerta visual e sonoro na plataforma Web e
                Mobile sempre que um prazo de SLA é ultrapassado.
              </p>
            </div>
            <div className="form-check form-switch fs-4 mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                checked={slaConfig.push_interna}
                onChange={() => toggleSla("push_interna")}
                style={{ cursor: "pointer" }}
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3">
              <label className="form-check-label fw-semibold mb-1">
                Aviso por E-mail Automático
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                Envia um e-mail de cobrança automatizado diretamente à
                equipa (Talent Manager ou Service Line) em incumprimento.
              </p>
            </div>
            <div className="form-check form-switch fs-4 mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                checked={slaConfig.aviso_email}
                onChange={() => toggleSla("aviso_email")}
                style={{ cursor: "pointer" }}
              />
            </div>
          </div>

          <div className="d-flex align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3 flex-grow-1">
              <label className="form-check-label fw-semibold mb-1">
                Escalada de Alerta (Administrador)
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                Define após quantas horas de atraso crítico o sistema
                escala a notificação para intervenção do Administrador
                Geral.
              </p>
            </div>
            <div style={{ width: "130px" }}>
              <div className="input-group">
                <input
                  type="number"
                  className="form-control text-center px-1"
                  value={slaConfig.escalada_horas}
                  onChange={(e) =>
                    setSlaConfig({
                      ...slaConfig,
                      escalada_horas: e.target.value,
                    })
                  }
                  min="1"
                  max="72"
                />
                <span className="input-group-text bg-light text-muted px-2">
                  horas
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 text-end">
        <button
          className="btn px-4 rounded-pill text-white"
          style={{
            backgroundColor: "var(--barra_lateral)",
            border: "none",
          }}
        >
          <i className="fi fi-br-disk me-2"></i> Guardar Prazos SLA
        </button>
      </div>
    </div>
  );
}
