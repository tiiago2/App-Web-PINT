import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ToggleSwitch from "../../../components/ui/ToggleSwitch/ToggleSwitch";

export default function TabNotificacoes() {
  const { t } = useTranslation();
  const [notifConfig, setNotifConfig] = useState({
    email_registo: true,
    email_candidatura: true,
    email_veredito: true,
    alerta_talent: true,
    alerta_service: false,
    alerta_expiracao: true,
    dias_expiracao: 30,
    teams_ativo: false,
    slack_ativo: false,
  });

  const toggleNotif = (key) => {
    setNotifConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="d-flex flex-column gap-4 pb-4">
      <div>
        <h3 className="section-title fw-bold">{t("notificacoes_alertas")}</h3>
        <p className="section-subtitle">
          {t("notificacoes_alertas_desc")}
        </p>
      </div>

      {/* Card 1: Notificações de Processo */}
      <div className="p-4 border border-2 rounded-4 bg-light shadow-sm">
        <h5
          className="mb-4 fw-semibold"
          style={{ color: "var(--fontes)" }}
        >
          {t("notif_processo_emails")}
        </h5>

        <h6 className="fw-bold mb-3 text-secondary">
          {t("eventos_consultor")}
        </h6>
        <div className="d-flex flex-column gap-3 mb-4">
          <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3">
              <label className="form-check-label fw-semibold mb-1">
                {t("email_registo_label")}
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                {t("email_registo_desc")}
              </p>
            </div>
            <div className="mb-0">
              <ToggleSwitch
                checked={notifConfig.email_registo}
                onChange={() => toggleNotif("email_registo")}
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3">
              <label className="form-check-label fw-semibold mb-1">
                {t("email_candidatura_label")}
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                {t("email_candidatura_desc")}
              </p>
            </div>
            <div className="mb-0">
              <ToggleSwitch
                checked={notifConfig.email_candidatura}
                onChange={() => toggleNotif("email_candidatura")}
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3">
              <label className="form-check-label fw-semibold mb-1">
                {t("email_veredito_label")}
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                {t("email_veredito_desc")}
              </p>
            </div>
            <div className="mb-0">
              <ToggleSwitch
                checked={notifConfig.email_veredito}
                onChange={() => toggleNotif("email_veredito")}
              />
            </div>
          </div>
        </div>

        <h6 className="fw-bold mb-3 text-secondary">
          {t("eventos_validadores")}
        </h6>
        <div className="d-flex flex-column gap-3">
          <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3">
              <label className="form-check-label fw-semibold mb-1">
                {t("alerta_talent_label")}
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                {t("alerta_talent_desc")}
              </p>
            </div>
            <div className="mb-0">
              <ToggleSwitch
                checked={notifConfig.alerta_talent}
                onChange={() => toggleNotif("alerta_talent")}
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3">
              <label className="form-check-label fw-semibold mb-1">
                {t("alerta_service_label")}
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                {t("alerta_service_desc")}
              </p>
            </div>
            <div className="mb-0">
              <ToggleSwitch
                checked={notifConfig.alerta_service}
                onChange={() => toggleNotif("alerta_service")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Alertas de Validade */}
      <div className="p-4 border border-2 rounded-4 bg-light shadow-sm">
        <h5
          className="mb-4 fw-semibold"
          style={{ color: "var(--fontes)" }}
        >
          {t("alertas_expiracao_badges")}
        </h5>

        <div className="d-flex flex-column gap-3">
          <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3">
              <label className="form-check-label fw-semibold mb-1">
                {t("lembrete_recertificacao_label")}
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                {t("lembrete_recertificacao_desc")}
              </p>
            </div>
            <div className="mb-0">
              <ToggleSwitch
                checked={notifConfig.alerta_expiracao}
                onChange={() => toggleNotif("alerta_expiracao")}
              />
            </div>
          </div>

          <div className="d-flex align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3 flex-grow-1">
              <label className="form-check-label fw-semibold mb-1">
                {t("dias_antecedencia_alerta_label")}
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                {t("dias_antecedencia_alerta_desc")}
              </p>
            </div>
            <div style={{ width: "130px" }}>
              <div className="input-group">
                <input
                  type="number"
                  className="form-control text-center px-1"
                  value={notifConfig.dias_expiracao}
                  onChange={(e) =>
                    setNotifConfig({
                      ...notifConfig,
                      dias_expiracao: e.target.value,
                    })
                  }
                  min="1"
                  max="365"
                />
                <span className="input-group-text bg-light text-muted px-2">
                  {t("dias_lowercase")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Integrações Externas */}
      <div className="p-4 border border-2 rounded-4 bg-light shadow-sm">
        <h5
          className="mb-4 fw-semibold"
          style={{ color: "var(--fontes)" }}
        >
          {t("integracoes_corporativas")}
        </h5>
        <p className="text-muted mb-4" style={{ fontSize: "0.85rem" }}>
          {t("integracoes_corporativas_desc")}
        </p>

        <div className="row g-3">
          <div className="col-md-6">
            <div
              className={`p-3 rounded-3 border d-flex flex-column align-items-center text-center transition-all ${notifConfig.teams_ativo ? "border-primary bg-white shadow-sm" : "bg-white"}`}
            >
              <div className="fs-1 text-primary mb-2">
                <i className="fi fi-brands-microsoft"></i>
              </div>
              <h6 className="fw-bold mb-1">Microsoft Teams</h6>
              <p className="text-muted small mb-3">
                {t("partilha_teams_desc")}
              </p>
              <div className="mb-0">
                <ToggleSwitch
                  checked={notifConfig.teams_ativo}
                  onChange={() => toggleNotif("teams_ativo")}
                />
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div
              className={`p-3 rounded-3 border d-flex flex-column align-items-center text-center transition-all ${notifConfig.slack_ativo ? "border-info bg-white shadow-sm" : "bg-white"}`}
            >
              <div className="fs-1 text-info mb-2">
                <i className="fi fi-brands-slack"></i>
              </div>
              <h6 className="fw-bold mb-1">Slack</h6>
              <p className="text-muted small mb-3">
                {t("partilha_slack_desc")}
              </p>
              <div className="mb-0">
                <ToggleSwitch
                  checked={notifConfig.slack_ativo}
                  onChange={() => toggleNotif("slack_ativo")}
                />
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
          <i className="fi fi-br-disk me-2"></i> {t("guardar_configuracoes")}
        </button>
      </div>
    </div>
  );
}
