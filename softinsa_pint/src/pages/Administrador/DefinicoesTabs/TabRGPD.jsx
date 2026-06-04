import React, { useState } from "react";
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
          Gere os textos legais e de consentimento apresentados aos
          utilizadores.
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
              Taxa de Adesão Aos Termos
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
                67%
              </span>
              <span
                className="text-muted pb-1 fw-medium"
                style={{ fontSize: "0.9rem" }}
              >
                dos consultores ativos
              </span>
            </div>
            <div
              className="d-flex justify-content-between text-muted mt-3 mb-1"
              style={{ fontSize: "0.75rem" }}
            >
              <span>412 Aceites</span>
              <span>136 Pendentes</span>
            </div>
            <div className="progress" style={{ height: "6px" }}>
              <div
                className="progress-bar"
                role="progressbar"
                style={{
                  width: "67%",
                  backgroundColor: "var(--barra_lateral)",
                }}
                aria-valuenow="67"
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
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
              Última Revisão Legal
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
                  24 de Maio, 2026
                </div>
                <div
                  className="text-muted mt-1"
                  style={{ fontSize: "0.85rem" }}
                >
                  às 14h30 por{" "}
                  <span
                    className="fw-semibold"
                    style={{ color: "var(--barra_lateral)" }}
                  >
                    Gonçalo
                  </span>
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
          Controlo de Acesso e Consentimento
        </h5>

        <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
          <div className="pe-3">
            <label className="form-check-label fw-semibold mb-1">
              Forçar aceitação do RGPD no primeiro login
            </label>
            <p
              className="text-muted mb-0"
              style={{ fontSize: "0.85rem" }}
            >
              Bloqueia o acesso do Consultor ao Dashboard pessoal no
              primeiro acesso (ou após uma atualização do texto) até que
              este declare explicitamente ter lido e aceite os termos.
            </p>
          </div>
          <div className="form-check form-switch fs-4 mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              checked={rgpdConfig.forcar_aceitacao}
              onChange={() => toggleRgpd("forcar_aceitacao")}
              style={{ cursor: "pointer" }}
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
          Travas de Consentimento Vinculadas (Regras de Negócio)
        </h5>

        <div className="d-flex flex-column gap-3 mb-2">
          <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3">
              <label className="form-check-label fw-semibold mb-1">
                Controlo da Galeria Pública
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                Permitir visualização na Galeria Pública (Se ativo, só
                mostra badges de consultores que aceitaram o RGPD).
              </p>
            </div>
            <div className="form-check form-switch fs-4 mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                checked={rgpdConfig.galeria_publica}
                onChange={() => toggleRgpd("galeria_publica")}
                style={{ cursor: "pointer" }}
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3">
              <label className="form-check-label fw-semibold mb-1">
                Controlo de Partilha Externa
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                Ativar botão "Partilhar no LinkedIn" (Se ativo, liberta a
                API/botão de partilha no perfil do consultor).
              </p>
            </div>
            <div className="form-check form-switch fs-4 mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                checked={rgpdConfig.partilha_linkedin}
                onChange={() => toggleRgpd("partilha_linkedin")}
                style={{ cursor: "pointer" }}
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3">
              <label className="form-check-label fw-semibold mb-1">
                Controlo de Indexação Pública
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                Permitir Páginas de Badges Públicas (Gere se o link único
                e público do badge do consultor pode ser acedido por
                utilizadores externos/anónimos).
              </p>
            </div>
            <div className="form-check form-switch fs-4 mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                checked={rgpdConfig.paginas_publicas}
                onChange={() => toggleRgpd("paginas_publicas")}
                style={{ cursor: "pointer" }}
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
          Editor do Texto de Consentimento
        </h5>
        <p className="text-muted mb-3" style={{ fontSize: "0.85rem" }}>
          O texto gravado abaixo será o documento oficial que o Consultor
          terá de ler e aceitar (Termos e Condições e Política de
          Privacidade).
        </p>

        <div className="mb-4">
          <textarea
            className="form-control"
            rows="15"
            placeholder="Escreva ou cole aqui os termos e condições e a política de privacidade..."
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
            <i className="fi fi-br-disk me-2"></i> Guardar Texto de
            Consentimento
          </button>
        </div>
      </div>
    </div>
  );
}
