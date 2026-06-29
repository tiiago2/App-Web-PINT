import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import SeletorAbas from "../../components/ui/SeletorAbas/SeletorAbas_Galeria";
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
    { valor: "utilizadores", label: t("utilizadores") },
    { valor: "notificacoes", label: t("notificacoes") },
    { valor: "rgpd", label: t("politicas_rgpd") },
    { valor: "sla", label: "SLA" },
  ];

  return (
    <div className="definicoes-container w-100">
      <h1 className="texto-titulo-principal" style={{ marginBottom: 'var(--gap-titulo-principal-conteudo)' }}>{t("definicoes")}</h1>

      <div style={{ marginBottom: "2rem", width: "50%" }}>
        <SeletorAbas 
          opcoes={abasDefinicoes} 
          valorAtivo={abaAtiva} 
          onChange={setAbaAtiva} 
        />
      </div>

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
