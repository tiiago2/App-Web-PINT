import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { TabsAdmin } from "../../components/ui/TabsAdmin";
import "./definicoes_Admin.css";

function DefinicoesAdmin() {
  const { t } = useTranslation();

  // Estado para controlar qual aba está ativa (por defeito: 'utilizadores')
  const [abaAtiva, setAbaAtiva] = useState("utilizadores");

  const abasDefinicoes = [
    { id: "utilizadores", label: t("utilizadores") },
    { id: "notificacoes", label: t("notificacoes") },
    { id: "rgpd", label: t("politicas_rgpd") },
    { id: "sla", label: "SLA" },
  ];

  // Estado para o seletor de tipo de utilizador
  const [roleSelecionada, setRoleSelecionada] = useState("");
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownAberto(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const roles = ["consultor", "talent", "service"];

  // Dados das permissões por role
  const checkboxesPermissoes = {
    consultor: [
      {
        id: "cons_2",
        label: "Upload de Evidências",
        desc: "Habilita a submissão de documentação comprobatória para candidaturas a badges.",
      },
      {
        id: "cons_3",
        label: "Partilha Externa (LinkedIn)",
        desc: "Autoriza a integração e partilha pública de certificações no LinkedIn, em conformidade com o RGPD.",
      },
      {
        id: "cons_4",
        label: "Download de PDFs",
        desc: "Disponibiliza a funcionalidade de extração de certificados em formato PDF.",
      },
    ],
    talent: [
      {
        id: "tal_1",
        label: "Validar Evidências",
        desc: "Garante acesso para análise e validação documental das candidaturas submetidas.",
      },
      {
        id: "tal_3",
        label: "Exportação de Dados",
        desc: "Autoriza a extração e exportação de relatórios gerenciais e dados globais do sistema.",
      },
    ],
    service: [
      {
        id: "serv_1",
        label: "Validação Final",
        desc: "Atribui competência para a emissão do parecer final (Aprovação, Rejeição ou Send Back) no fluxo de atribuição.",
      },
      {
        id: "serv_3",
        label: "Gerar Relatórios de Área",
        desc: "Habilita a geração de relatórios segmentados e estatísticas operacionais específicas da sua área.",
      },
    ],
  };

  // Estado para guardar os valores (ligado/desligado) das permissões
  const [permissoesAtivas, setPermissoesAtivas] = useState({});

  const togglePermissao = (id) => {
    setPermissoesAtivas((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Estado para configurações de notificações
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

  // Estado para configurações do RGPD
  const [rgpdConfig, setRgpdConfig] = useState({
    forcar_aceitacao: true,
    galeria_publica: true,
    partilha_linkedin: true,
    paginas_publicas: false,
  });

  const toggleRgpd = (key) => {
    setRgpdConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Estado para configurações de SLA
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

  // Mock Data e Lógica Dinâmica para Painel de Monitorização
  const metricasSLA = {
    risco: 0, // Muda este valor para testar o semáforo
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
    <div className="definicoes-container w-100">
      <h1 className="definicoes-title">{t("definicoes")}</h1>

      {/* Navegação de Abas */}
      <TabsAdmin 
        abas={abasDefinicoes} 
        abaAtiva={abaAtiva} 
        setAbaAtiva={setAbaAtiva} 
      />

      {/* Conteúdo da aba ativa */}
      <div className="content-card">
        {abaAtiva === "utilizadores" && (
          <>
            <h3 className="section-title">{t("niveis_permissoes")}</h3>
            <p className="section-subtitle">{t("gerir_roles")}</p>

            <div className="mt-4 def-dropdown-wrap" ref={dropdownRef}>
              <label className="form-label fw-medium mb-2">
                Selecionar Tipo de Utilizador
              </label>
              <div>
                <button
                  className={`def-filtro-btn ${dropdownAberto ? "active" : ""}`}
                  onClick={() => setDropdownAberto((o) => !o)}
                  style={{ minWidth: "200px", justifyContent: "space-between" }}
                >
                  {roleSelecionada
                    ? t(roleSelecionada)
                    : "-- Selecione uma opção --"}
                  <i
                    className="fi fi-br-angle-small-down"
                    style={{ fontSize: "0.9rem" }}
                  ></i>
                </button>

                {dropdownAberto && (
                  <div className="def-dropdown mt-1">
                    <div className="def-dropdown-header">
                      Tipos de Utilizador
                    </div>
                    {roles.map((op) => (
                      <div
                        key={op}
                        className={`def-dropdown-item ${roleSelecionada === op ? "selected" : ""}`}
                        onClick={() => {
                          setRoleSelecionada(op);
                          setDropdownAberto(false);
                        }}
                      >
                        {t(op)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {roleSelecionada && (
              <div className="mt-4 p-4 border border-2 rounded-4 bg-light shadow-sm">
                <h5
                  className="mb-4 fw-semibold"
                  style={{ color: "var(--fontes)" }}
                >
                  Permissões para {t(roleSelecionada)}
                </h5>

                <div className="d-flex flex-column gap-3">
                  {checkboxesPermissoes[roleSelecionada]?.map((permissao) => (
                    <div
                      key={permissao.id}
                      className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border"
                    >
                      <div className="pe-3">
                        <label
                          className="form-check-label fw-semibold mb-1"
                          htmlFor={permissao.id}
                        >
                          {permissao.label}
                        </label>
                        <p
                          className="text-muted mb-0"
                          style={{ fontSize: "0.85rem" }}
                        >
                          {permissao.desc}
                        </p>
                      </div>
                      <div className="form-check form-switch fs-4 mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={permissao.id}
                          checked={permissoesAtivas[permissao.id] || false}
                          onChange={() => togglePermissao(permissao.id)}
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-end">
                  <button
                    className="btn px-4 rounded-pill text-white"
                    style={{
                      backgroundColor: "var(--barra_lateral)",
                      border: "none",
                    }}
                  >
                    <i className="fi fi-br-disk me-2"></i> Guardar Alterações
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {abaAtiva === "notificacoes" && (
          <div className="d-flex flex-column gap-4 pb-4">
            <div>
              <h3 className="section-title fw-bold">Notificações e Alertas</h3>
              <p className="section-subtitle">
                Gere os gatilhos de comunicação e alertas do sistema.
              </p>
            </div>

            {/* Card 1: Notificações de Processo */}
            <div className="p-4 border border-2 rounded-4 bg-light shadow-sm">
              <h5
                className="mb-4 fw-semibold"
                style={{ color: "var(--fontes)" }}
              >
                Notificações de Processo (E-mails)
              </h5>

              <h6 className="fw-bold mb-3 text-secondary">
                Eventos do Consultor
              </h6>
              <div className="d-flex flex-column gap-3 mb-4">
                <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
                  <div className="pe-3">
                    <label className="form-check-label fw-semibold mb-1">
                      E-mail de Confirmação de Registo
                    </label>
                    <p
                      className="text-muted mb-0"
                      style={{ fontSize: "0.85rem" }}
                    >
                      Notifica automaticamente o utilizador após a conclusão do
                      seu registo na plataforma.
                    </p>
                  </div>
                  <div className="form-check form-switch fs-4 mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={notifConfig.email_registo}
                      onChange={() => toggleNotif("email_registo")}
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
                  <div className="pe-3">
                    <label className="form-check-label fw-semibold mb-1">
                      Confirmação de Candidatura
                    </label>
                    <p
                      className="text-muted mb-0"
                      style={{ fontSize: "0.85rem" }}
                    >
                      Confirma a submissão bem-sucedida de uma nova candidatura
                      a badge.
                    </p>
                  </div>
                  <div className="form-check form-switch fs-4 mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={notifConfig.email_candidatura}
                      onChange={() => toggleNotif("email_candidatura")}
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
                  <div className="pe-3">
                    <label className="form-check-label fw-semibold mb-1">
                      Veredito de Validação
                    </label>
                    <p
                      className="text-muted mb-0"
                      style={{ fontSize: "0.85rem" }}
                    >
                      Informa o consultor sobre a decisão (Aprovação, Rejeição
                      ou Send Back) do seu processo de avaliação.
                    </p>
                  </div>
                  <div className="form-check form-switch fs-4 mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={notifConfig.email_veredito}
                      onChange={() => toggleNotif("email_veredito")}
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>

              <h6 className="fw-bold mb-3 text-secondary">
                Eventos dos Validadores
              </h6>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
                  <div className="pe-3">
                    <label className="form-check-label fw-semibold mb-1">
                      Alerta de Nova Candidatura
                    </label>
                    <p
                      className="text-muted mb-0"
                      style={{ fontSize: "0.85rem" }}
                    >
                      Alerta a equipa de Talent Management sobre a submissão de
                      novas candidaturas a aguardar análise.
                    </p>
                  </div>
                  <div className="form-check form-switch fs-4 mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={notifConfig.alerta_talent}
                      onChange={() => toggleNotif("alerta_talent")}
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
                  <div className="pe-3">
                    <label className="form-check-label fw-semibold mb-1">
                      Alerta de Validação Final
                    </label>
                    <p
                      className="text-muted mb-0"
                      style={{ fontSize: "0.85rem" }}
                    >
                      Informa os Service Line Leaders da necessidade de efetuar
                      a validação final técnica e comportamental.
                    </p>
                  </div>
                  <div className="form-check form-switch fs-4 mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={notifConfig.alerta_service}
                      onChange={() => toggleNotif("alerta_service")}
                      style={{ cursor: "pointer" }}
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
                Alertas de Expiração de Badges
              </h5>

              <div className="d-flex flex-column gap-3">
                <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
                  <div className="pe-3">
                    <label className="form-check-label fw-semibold mb-1">
                      Lembrete de Re-certificação
                    </label>
                    <p
                      className="text-muted mb-0"
                      style={{ fontSize: "0.85rem" }}
                    >
                      Alerta proativamente o consultor sobre a aproximação do
                      termo de validade das suas certificações ativas.
                    </p>
                  </div>
                  <div className="form-check form-switch fs-4 mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={notifConfig.alerta_expiracao}
                      onChange={() => toggleNotif("alerta_expiracao")}
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                </div>

                <div className="d-flex align-items-center bg-white p-3 rounded-3 border">
                  <div className="pe-3 flex-grow-1">
                    <label className="form-check-label fw-semibold mb-1">
                      Dias de Antecedência do Alerta
                    </label>
                    <p
                      className="text-muted mb-0"
                      style={{ fontSize: "0.85rem" }}
                    >
                      Define a margem temporal de antecedência com que os
                      lembretes de expiração são despoletados pelo sistema.
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
                        dias
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
                Integrações Corporativas
              </h5>
              <p className="text-muted mb-4" style={{ fontSize: "0.85rem" }}>
                Ative webhooks para enviar notificações sobre rankings e novos
                badges diretamente para as ferramentas de comunicação da
                empresa.
              </p>

              <div className="row g-3">
                <div className="col-md-6">
                  <div
                    className={`p-3 rounded-3 border d-flex flex-column align-items-center text-center transition-all ${notifConfig.teams_ativo ? "border-primary bg-white shadow-sm" : "bg-white"}`}
                  >
                    <div className="fs-1 text-primary mb-2">
                      {/* Simulação de icone teams */}
                      <i className="fi fi-brands-microsoft"></i>
                    </div>
                    <h6 className="fw-bold mb-1">Microsoft Teams</h6>
                    <p className="text-muted small mb-3">
                      Ativa a partilha automática de atualizações via canal
                      Microsoft Teams.
                    </p>
                    <div className="form-check form-switch fs-5 mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={notifConfig.teams_ativo}
                        onChange={() => toggleNotif("teams_ativo")}
                        style={{ cursor: "pointer" }}
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
                      Estabelece a ligação para envio de relatórios e
                      notificações no Slack.
                    </p>
                    <div className="form-check form-switch fs-5 mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={notifConfig.slack_ativo}
                        onChange={() => toggleNotif("slack_ativo")}
                        style={{ cursor: "pointer" }}
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
                <i className="fi fi-br-disk me-2"></i> Guardar Definições de
                Notificação
              </button>
            </div>
          </div>
        )}

        {abaAtiva === "rgpd" && (
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
        )}

        {abaAtiva === "sla" && (
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
        )}
      </div>
    </div>
  );
}

export default DefinicoesAdmin;
