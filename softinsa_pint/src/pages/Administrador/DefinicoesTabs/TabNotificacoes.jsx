import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ToggleSwitch from "../../../components/ui/ToggleSwitch/ToggleSwitch";
import api from "../../../services/api.js";

const DB_MAPPING = {
  8: "email_candidatura",
  9: "email_veredito",
  10: "alerta_talent",
  11: "alerta_service"
};

const FRONTEND_TO_DB_ID = {
  "email_candidatura": 8,
  "email_veredito": 9,
  "alerta_talent": 10,
  "alerta_service": 11
};

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

  const [estadoOriginal, setEstadoOriginal] = useState({});

  useEffect(() => {
    async function carregarConfiguracoes() {
      try {
        const response = await api.get("/defs-permissoes");
        const novoEstado = { ...notifConfig };
        response.data.forEach((perm) => {
          const key = DB_MAPPING[perm.id_permissao];
          if (key) {
            novoEstado[key] = perm.toggle;
          }
        });
        setNotifConfig(novoEstado);
        setEstadoOriginal(novoEstado);
      } catch (error) {
        console.error("Erro ao carregar configurações de notificações:", error);
      }
    }
    carregarConfiguracoes();
  }, []);

  const toggleNotif = (key) => {
    setNotifConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGuardar = async () => {
    try {
      const alteracoes = [];
      const chavesParaGuardar = ["email_candidatura", "email_veredito", "alerta_talent", "alerta_service"];
      
      chavesParaGuardar.forEach((key) => {
        if (notifConfig[key] !== estadoOriginal[key]) {
          alteracoes.push({
            id_permissao: FRONTEND_TO_DB_ID[key],
            toggle: notifConfig[key]
          });
        }
      });

      if (alteracoes.length === 0) {
        alert(t("sem_alteracoes", "Não existem alterações para guardar."));
        return;
      }

      await api.put("/defs-permissoes", { alteracoes });
      setEstadoOriginal({ ...notifConfig });
      alert(t("configuracoes_guardadas_sucesso", "Configurações guardadas com sucesso!"));
    } catch (error) {
      console.error("Erro ao guardar configurações de notificações:", error);
      alert(t("erro_guardar_configuracoes", "Ocorreu um erro ao guardar as configurações."));
    }
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

      <div className="mt-2 text-end">
        <button
          onClick={handleGuardar}
          className="btn d-inline-flex align-items-center gap-2 shadow-sm border-0 px-4 text-white"
          style={{
            backgroundColor: "var(--barra_lateral)",
            height: "44px",
            fontWeight: 500,
            fontSize: "16px",
            borderRadius: "var(--border-radius-pequeno)"
          }}
        >
          <i className="fi fi-br-disk me-2"></i> {t("guardar_configuracoes")}
        </button>
      </div>
    </div>
  );
}
