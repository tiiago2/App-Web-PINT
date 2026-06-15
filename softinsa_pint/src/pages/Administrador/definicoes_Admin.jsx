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

  return (
    <div className="definicoes-container w-100">
      <h1 className="texto-titulo-principal" style={{ marginBottom: 'var(--gap-titulo-principal-conteudo)' }}>{t("definicoes")}</h1>

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
