import React, { useState, useEffect } from "react";

import { useLocation } from "react-router-dom";
import SeletorAbas from "../../components/ui/SeletorAbas/SeletorAbas_Galeria";
import BotaoAcao from "../../components/ui/BotaoAcao/BotaoAcao";
import "./editar_Admin.css";

// Importação das Abas
import TabBadges from "./EditarTabs/TabBadges";
import TabAreas from "./EditarTabs/TabAreas";
import TabServiceLine from "./EditarTabs/TabServiceLine";
import TabLearningPaths from "./EditarTabs/TabLearningPaths";

function getTextoBotaoAdicionar(abaAtiva) {
    switch (abaAtiva) {
        case "badges":
            return "Adicionar Badge";
        case "areas":
            return "Adicionar Área";
        case "service_line":
            return "Adicionar Service Line";
        case "learning_paths":
            return "Adicionar Learning Path";
        default:
            return "Adicionar";
    }
}

function EditarAdmin() {
  const location = useLocation();
  const [abaAtiva, setAbaAtiva] = useState(
    location.state?.abaAtiva || "badges",
  );
  const [abrirCriarEntidade, setAbrirCriarEntidade] = useState(null);

  useEffect(() => {
    if (location.state?.abaAtiva) {
      setAbaAtiva(location.state.abaAtiva);
    }
  }, [location.state]);

  const abasEditar = [
    { valor: "badges", label: "Badges" },
    { valor: "areas", label: "Áreas" },
    { valor: "service_line", label: "Service Line" },
    { valor: "learning_paths", label: "Learning Paths" },
  ];

  const getNomeAba = () => {
    switch (abaAtiva) {
      case "learning_paths":
        return "Learning Path";
      case "service_line":
        return "Service Line";
      case "areas":
        return "Área";
      case "badges":
        return "Badge";
      default:
        return "";
    }
  };

  const renderAbaConteudo = () => {
    switch (abaAtiva) {
      case "badges":
        return (
          <TabBadges
            onRegisterAdicionar={setAbrirCriarEntidade}
          />
        );
      case "areas":
        return (
          <TabAreas
            onRegisterAdicionar={setAbrirCriarEntidade}
          />
        );
      case "service_line":
        return (
          <TabServiceLine
            onRegisterAdicionar={setAbrirCriarEntidade}
          />
        );
      case "learning_paths":
        return (
            <TabLearningPaths
                onRegisterAdicionar={setAbrirCriarEntidade}
            />
        );
      default:
        return null;
    }
  };

  return (
    <div className="editar-container w-100">
      <div className="editar-cabecalho">
        <div className="editar-cabecalho-esquerda">
          <h1 className="texto-titulo-principal editar-titulo">
            Editar
          </h1>

          <div className="editar-seletor-entidade">
            <SeletorAbas
              opcoes={abasEditar}
              valorAtivo={abaAtiva}
              onChange={setAbaAtiva}
            />
          </div>
        </div>

        <div className="editar-cabecalho-acoes">
          <BotaoAcao
            variante="secundario"
            icone="fi-br-plus"
            onClick={() => {
              if (abrirCriarEntidade) {
                abrirCriarEntidade();
              }
            }}
          >
            {getTextoBotaoAdicionar(abaAtiva)}
          </BotaoAcao>
        </div>
      </div>

      {/* Conteúdo dinâmico da Aba */}
      <div className="d-flex flex-column flex-grow-1 pb-2">
        {renderAbaConteudo()}
      </div>
    </div>
  );
}

export default EditarAdmin;
