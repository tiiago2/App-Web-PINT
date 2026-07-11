import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../../../services/api.js";
import ToastNotificacao from "../../../components/ui/ToastNotificacao/ToastNotificacao.jsx";
import LoadingSpinner from "../../../components/ui/Loading/LoadingSpinner";

export default function TabRGPD() {
  const { t } = useTranslation();

  const [textoConsentimento, setTextoConsentimento] = useState("");
  const [dataAlteracao, setDataAlteracao] = useState(null);
  const [nomeAutor, setNomeAutor] = useState("");
  const [estatisticas, setEstatisticas] = useState({
    aceites: 0,
    pendentes: 0,
    taxaAdesao: 0
  });

  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState({ visivel: false, mensagem: "", tipo: "sucesso" });
  const mostrarToast = (mensagem, tipo = "sucesso") => setToast({ visivel: true, mensagem, tipo });
  const fecharToast = () => setToast((prev) => ({ ...prev, visivel: false }));

  // Carregar os dados dinâmicos do backend
  useEffect(() => {
    async function carregarRGPD() {
      try {
        const response = await api.get("/rgpd");
        setTextoConsentimento(response.data.textoConsentimento || "");
        setDataAlteracao(response.data.dataAlteracao);
        setNomeAutor(response.data.nomeAutor || "Sistema");
        setEstatisticas(response.data.estatisticas || { aceites: 0, pendentes: 0, taxaAdesao: 0 });
      } catch (error) {
        console.error("Erro ao carregar políticas RGPD:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarRGPD();
  }, []);

  const handleGuardar = async () => {
    try {
      if (!textoConsentimento.trim()) {
        mostrarToast("O texto de consentimento não pode estar vazio.", "erro");
        return;
      }

      await api.put("/rgpd", { textoConsentimento });
      
      // Recarregar os dados para atualizar as estatísticas e última revisão legal
      const response = await api.get("/rgpd");
      setTextoConsentimento(response.data.textoConsentimento || "");
      setDataAlteracao(response.data.dataAlteracao);
      setNomeAutor(response.data.nomeAutor || "Sistema");
      setEstatisticas(response.data.estatisticas || { aceites: 0, pendentes: 0, taxaAdesao: 0 });

      mostrarToast(t("rgpd_guardado_sucesso", "Políticas RGPD guardadas e consentimentos repostos com sucesso!"), "sucesso");
    } catch (error) {
      console.error("Erro ao guardar políticas RGPD:", error);
      mostrarToast(t("erro_guardar_rgpd", "Ocorreu um erro ao guardar as políticas RGPD."), "erro");
    }
  };

  // Formatar a data para o ecrã
  const formatarData = (dataStr) => {
    if (!dataStr) return "-";
    const data = new Date(dataStr);
    return data.toLocaleDateString("pt-PT") + " às " + data.toLocaleTimeString("pt-PT", { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <LoadingSpinner tamanho="md" texto={t("a_carregar", "A carregar...")} centralizado />
      </div>
    );
  }

  return (
    <>
    <div className="d-flex flex-column gap-4 pb-4">
      <div>
        <h3 className="section-title">{t("politicas_rgpd")}</h3>
        <p className="section-subtitle">
          {t("rgpd_subtitulo")}
        </p>
      </div>

      {/* Painel de Auditoria (Métricas) */}
      <div className="row g-3">
        <div className="col-12 col-md-6">
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
                {estatisticas.taxaAdesao}%
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
                  {t("aceites_count", { count: estatisticas.aceites })}
                </span>
              </div>
              <div style={{ fontSize: "0.85rem" }}>
                <span className="badge bg-warning-subtle text-warning border border-warning-subtle me-1">
                  <i className="fi fi-br-time-past me-1"></i>
                  {t("pendentes_count", { count: estatisticas.pendentes })}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6">
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
                  className="fw-bold fs-6"
                  style={{ color: "var(--fontes)", wordBreak: "break-all" }}
                >
                  {formatarData(dataAlteracao)}
                </div>
                <div
                  className="text-muted mt-1"
                  style={{ fontSize: "0.85rem" }}
                >
                  {t("revisao_por_autor", `Revisão por: ${nomeAutor}`)}
                </div>
              </div>
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

        <div
          className="mb-3 p-3 rounded-3"
          style={{
            backgroundColor: "var(--fundo2)",
            border: "1px solid var(--contorno)",
            fontSize: "0.8rem",
            color: "var(--fontes)",
          }}
        >
          <strong>{t("markdown_ajuda_titulo")}</strong>
          <div className="mt-1" style={{ opacity: 0.85 }}>
            {t("markdown_ajuda_desc")}
          </div>
        </div>

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
            value={textoConsentimento}
            onChange={(e) => setTextoConsentimento(e.target.value)}
          ></textarea>
        </div>

        <div className="text-end definicoes-acao-guardar">
          <button
            onClick={handleGuardar}
            className="btn d-inline-flex align-items-center gap-2 shadow-sm border-0 px-4 text-white definicoes-btn-guardar"
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
    </div>

      {/* Toast Notificação */}
      <ToastNotificacao
        visivel={toast.visivel}
        mensagem={toast.mensagem}
        tipo={toast.tipo}
        onFechar={fecharToast}
      />
    </>
  );
}
