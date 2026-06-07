import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { TabsAdmin } from "../../components/ui/TabsAdmin";
import "./definicoes_Admin.css";

// Import das Abas Separadas
import TabUtilizadores from "./DefinicoesTabs/TabUtilizadores";
import TabNotificacoes from "./DefinicoesTabs/TabNotificacoes";
import TabRGPD from "./DefinicoesTabs/TabRGPD";
import TabSLA from "./DefinicoesTabs/TabSLA";

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

<<<<<<< HEAD
  // Estado para o seletor de tipo de utilizador
  const [roleSelecionada, setRoleSelecionada] = useState("");


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

=======
>>>>>>> d2d37181fde97e08d660870e6fef9c7eec16d2ae
  return (
    <div className="definicoes-container w-100">
      <h1 className="texto-titulo-principal mb-4">{t("definicoes")}</h1>

      {/* Navegação de Abas */}
      <TabsAdmin 
        abas={abasDefinicoes} 
        abaAtiva={abaAtiva} 
        setAbaAtiva={setAbaAtiva} 
      />

      {/* Conteúdo da aba ativa */}
      <div className="content-card mt-4">
        {abaAtiva === "utilizadores" && <TabUtilizadores />}
        {abaAtiva === "notificacoes" && <TabNotificacoes />}
        {abaAtiva === "rgpd" && <TabRGPD />}
        {abaAtiva === "sla" && <TabSLA />}
      </div>
    </div>
  );
}

export default DefinicoesAdmin;
