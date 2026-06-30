import React, { useState } from "react";
import ToggleSwitch from "../../../components/ui/ToggleSwitch/ToggleSwitch";
import { useTranslation } from "react-i18next";

export default function TabRGPD() {
  const { t } = useTranslation();

  const [rgpdConfig, setRgpdConfig] = useState({
    forcar_aceitacao: true,
    galeria_publica: true,
    partilha_linkedin: true,
    paginas_publicas: false,
  });

  const toggleRgpd = (key) => {
    setRgpdConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="d-flex flex-column gap-4 pb-4">
      <div>
        <h3 className="section-title">{t("politicas_rgpd")}</h3>
        <p className="section-subtitle">
          {t("rgpd_subtitulo")}
        </p>
      </div>

      {/* Painel de Auditoria (Métricas) */}
      <div className="row g-3">
        <div className="col-md-6">
          <div className="p-4 border border-2 rounded-4 bg-light shadow-sm h-100 d-flex flex-column justify-content-center">
            <h6
              className="text-muted fw-semibold mb-2"
              style={{
                fontSize: "0.85rem",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {t("taxa_adesao_termos")}
            </h6>
            <div className="d-flex align-items-end gap-2 mt-1">
              <span
                className="fw-bold"
                style={{
                  fontSize: "2.5rem",
                  color: "var(--barra_lateral)",
                  lineHeight: "1",
                }}
              >
                94%
              </span>
              <span
                className="text-muted pb-1 fw-bold"
                style={{ fontSize: "0.95rem" }}
              >
                {t("dos_consultores_ativos")}
              </span>
            </div>
            <div className="d-flex align-items-center gap-3 mt-3 pt-2 border-top">
              <div style={{ fontSize: "0.85rem" }}>
                <span className="badge bg-success-subtle text-success border border-success-subtle me-1">
                  <i className="fi fi-br-check me-1"></i>
                  {t("aceites_count", { count: 412 })}
                </span>
              </div>
              <div style={{ fontSize: "0.85rem" }}>
                <span className="badge bg-warning-subtle text-warning border border-warning-subtle me-1">
                  <i className="fi fi-br-time-past me-1"></i>
                  {t("pendentes_count", { count: 136 })}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="p-4 border border-2 rounded-4 bg-light shadow-sm h-100 d-flex flex-column justify-content-center">
            <h6
              className="text-muted fw-semibold mb-2"
              style={{
                fontSize: "0.85rem",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {t("ultima_revisao_legal")}
            </h6>
            <div className="d-flex align-items-center gap-3 mt-2">
              <div
                className="bg-white border rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "48px",
                  height: "48px",
                  color: "var(--barra_lateral)",
                }}
              >
                <i className="fi fi-br-calendar-check fs-4"></i>
              </div>
              <div>
                <div
                  className="fw-bold fs-5"
                  style={{ color: "var(--fontes)" }}
                >
                  {t("data_ultima_revisao")}
                </div>
                <div
                  className="text-muted mt-1"
                  style={{ fontSize: "0.85rem" }}
                >
                  {t("revisao_por", { hora: "14h30", autor: "Gonçalo" })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card: Automação / Obrigatoriedade */}
      <div className="p-4 border border-2 rounded-4 bg-light shadow-sm">
        <h5
          className="mb-4 fw-semibold"
          style={{ color: "var(--fontes)" }}
        >
          {t("controlo_acesso_consentimento")}
        </h5>

        <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
          <div className="pe-3">
            <label className="form-check-label fw-semibold mb-1">
              {t("forcar_aceitacao_rgpd")}
            </label>
            <p
              className="text-muted mb-0"
              style={{ fontSize: "0.85rem" }}
            >
              {t("forcar_aceitacao_rgpd_desc")}
            </p>
          </div>
          <div className="mb-0">
            <ToggleSwitch
              checked={rgpdConfig.forcar_aceitacao}
              onChange={() => toggleRgpd("forcar_aceitacao")}
            />
          </div>
        </div>
      </div>

      {/* Card: Travas de Consentimento Vinculadas */}
      <div className="p-4 border border-2 rounded-4 bg-light shadow-sm">
        <h5
          className="mb-4 fw-semibold"
          style={{ color: "var(--fontes)" }}
        >
          {t("travas_consentimento_vinculadas")}
        </h5>

        <div className="d-flex flex-column gap-3 mb-2">
          <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3">
              <label className="form-check-label fw-semibold mb-1">
                {t("controlo_galeria_publica")}
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                {t("controlo_galeria_publica_desc")}
              </p>
            </div>
            <div className="mb-0">
              <ToggleSwitch
                checked={rgpdConfig.galeria_publica}
                onChange={() => toggleRgpd("galeria_publica")}
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3">
              <label className="form-check-label fw-semibold mb-1">
                {t("controlo_partilha_externa")}
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                {t("controlo_partilha_externa_desc")}
              </p>
            </div>
            <div className="mb-0">
              <ToggleSwitch
                checked={rgpdConfig.partilha_linkedin}
                onChange={() => toggleRgpd("partilha_linkedin")}
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3">
              <label className="form-check-label fw-semibold mb-1">
                {t("controlo_indexacao_publica")}
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                {t("controlo_indexacao_publica_desc")}
              </p>
            </div>
            <div className="mb-0">
              <ToggleSwitch
                checked={rgpdConfig.paginas_publicas}
                onChange={() => toggleRgpd("paginas_publicas")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Card: Editor do Texto */}
      <div className="p-4 border border-2 rounded-4 bg-light shadow-sm">
        <h5
          className="mb-4 fw-semibold"
          style={{ color: "var(--fontes)" }}
        >
          {t("editor_texto_consentimento")}
        </h5>
        <p className="text-muted mb-3" style={{ fontSize: "0.85rem" }}>
          {t("editor_texto_consentimento_desc")}
        </p>

        <div className="mb-4">
          <textarea
            className="form-control"
            rows="15"
            placeholder={t("escreva_aqui_termos_placeholder")}
            style={{
              resize: "vertical",
              border: "1px solid #CAD5E2",
              backgroundColor: "#FFFFFF",
            }}
            defaultValue="1. Âmbito de Aplicação&#10;Estes termos aplicam-se à utilização da plataforma de atribuição de badges da Softinsa...&#10;&#10;2. Recolha e Tratamento de Dados (RGPD)&#10;A Softinsa compromete-se a proteger a privacidade dos seus colaboradores. Os dados recolhidos (nome, área, badges) destinam-se exclusivamente a fins de gamificação interna e evolução de carreira.&#10;&#10;3. Partilha Externa&#10;Ao ativar a partilha para plataformas externas (ex: LinkedIn), o colaborador consente..."
          ></textarea>
        </div>

        <div className="text-end">
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
    </div>
  );
}
