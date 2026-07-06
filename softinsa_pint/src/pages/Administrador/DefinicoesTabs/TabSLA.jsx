import React, { useState, useEffect } from "react";
import ToggleSwitch from "../../../components/ui/ToggleSwitch/ToggleSwitch";
import { useTranslation } from "react-i18next";
import { obterConfigSla, guardarConfigSla } from "../../../services/slaService";

export default function TabSLA() {
  const { t } = useTranslation();

  const [slaConfig, setSlaConfig] = useState({
    fase1_dias: 5,
    fase2_dias: 3,
    aviso_objetivo_dias: 7,
    push_interna: true,
  });

  const [metricasSLA, setMetricasSLA] = useState({
    risco: 0,
    foraPrazo: 0,
    mediaDias: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let ativo = true;

    async function carregarConfig() {
      try {
        setIsLoading(true);
        const data = await obterConfigSla();

        if (ativo) {
          setSlaConfig({
            fase1_dias: data.fase1_dias ?? 5,
            fase2_dias: data.fase2_dias ?? 3,
            aviso_objetivo_dias: data.aviso_objetivo_dias ?? 7,
            push_interna: data.push_interna ?? true,
          });

          if (data.metricas) {
            setMetricasSLA({
              risco: data.metricas.risco ?? 0,
              foraPrazo: data.metricas.foraPrazo ?? 0,
              mediaDias: data.metricas.mediaDias ?? 0,
            });
          }
        }
      } catch (error) {
        console.error("Erro ao carregar configuração SLA:", error);
      } finally {
        if (ativo) setIsLoading(false);
      }
    }

    carregarConfig();
    return () => { ativo = false; };
  }, []);

  const toggleSla = (key) => {
    setSlaConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGuardar = async () => {
    try {
      setIsSaving(true);
      setFeedback(null);

      await guardarConfigSla({
        fase1_dias: Number(slaConfig.fase1_dias),
        fase2_dias: Number(slaConfig.fase2_dias),
        aviso_objetivo_dias: Number(slaConfig.aviso_objetivo_dias),
        push_interna: slaConfig.push_interna,
      });

      setFeedback({ tipo: "sucesso", mensagem: t("sla_guardado_sucesso") });

      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error("Erro ao guardar SLA:", error);
      setFeedback({ tipo: "erro", mensagem: t("sla_guardado_erro") });
    } finally {
      setIsSaving(false);
    }
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

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">A carregar...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4 pb-4">
      <div>
        <h3 className="section-title">{t("sla")}</h3>
        <p className="section-subtitle">
          {t("sla_subtitulo")}
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
                {t("pedidos_em_risco")}
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
                {t("menos_24h_sla")}
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
                {t("fora_do_prazo")}
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
                {t("candidaturas_atrasadas_desc")}
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
                {t("media_resposta")}
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
                  {t("dias_lowercase")}
                </span>
              </div>
              <div
                className="text-muted mt-2 fw-medium"
                style={{ fontSize: "0.75rem" }}
              >
                {t("tempo_medio_fechar_desc")}
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
          {t("configuracao_prazos_limite")}
        </h5>

        <div className="d-flex flex-column gap-3">
          <div className="d-flex align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3 flex-grow-1">
              <label className="form-check-label fw-semibold mb-1">
                {t("sla_fase_1")}
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                {t("sla_fase_1_desc")}
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
                  {t("dias_lowercase")}
                </span>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3 flex-grow-1">
              <label className="form-check-label fw-semibold mb-1">
                {t("sla_fase_2")}
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                {t("sla_fase_2_desc")}
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
                  {t("dias_lowercase")}
                </span>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3 flex-grow-1">
              <label className="form-check-label fw-semibold mb-1">
                {t("sla_aviso_objetivo")}
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                {t("sla_aviso_objetivo_desc")}
              </p>
            </div>
            <div style={{ width: "130px" }}>
              <div className="input-group">
                <input
                  type="number"
                  className="form-control text-center px-1"
                  value={slaConfig.aviso_objetivo_dias}
                  onChange={(e) =>
                    setSlaConfig({
                      ...slaConfig,
                      aviso_objetivo_dias: e.target.value,
                    })
                  }
                  min="1"
                  max="99"
                />
                <span className="input-group-text bg-light text-muted px-2">
                  {t("dias_lowercase")}
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
          {t("gatilhos_slas_ultrapassados")}
        </h5>

        <div className="d-flex flex-column gap-3">
          <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
            <div className="pe-3">
              <label className="form-check-label fw-semibold mb-1">
                {t("notificacao_push_interna")}
              </label>
              <p
                className="text-muted mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                {t("notificacao_push_interna_desc")}
              </p>
            </div>
            <div className="mb-0">
              <ToggleSwitch
                checked={slaConfig.push_interna}
                onChange={() => toggleSla("push_interna")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feedback + Botão Guardar */}
      <div className="mt-2 d-flex justify-content-between align-items-center">
        <div>
          {feedback && (
            <span
              className={`fw-medium ${
                feedback.tipo === "sucesso" ? "text-success" : "text-danger"
              }`}
              style={{ fontSize: "0.9rem" }}
            >
              <i
                className={`fi ${
                  feedback.tipo === "sucesso"
                    ? "fi-br-check-circle"
                    : "fi-br-cross-circle"
                } me-1`}
              ></i>
              {feedback.mensagem}
            </span>
          )}
        </div>
        <button
          className="btn d-inline-flex align-items-center gap-2 shadow-sm border-0 px-4 text-white"
          style={{
            backgroundColor: "var(--barra_lateral)",
            height: "44px",
            fontWeight: 500,
            fontSize: "16px",
            borderRadius: "var(--border-radius-pequeno)",
            opacity: isSaving ? 0.7 : 1,
          }}
          onClick={handleGuardar}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              {t("a_guardar")}
            </>
          ) : (
            <>
              <i className="fi fi-br-disk me-2"></i> {t("guardar_prazos_sla")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
