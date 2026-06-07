import React, { useState } from "react";

export default function TabNotificacoes() {
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
  );
}
