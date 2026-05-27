import { useState } from "react";
import SeletorAbas from "../../components/ui/SeletorAbas/SeletorAbas_Galeria";
import GaleriaSugeridos from "../../components/Galeria/GaleriaSugeridos/GaleriaSugeridos";
import GaleriaTodosBadges from "../../components/Galeria/GaleriaTodosBadges/GaleriaTodosBadges";
import "./GaleriaConsultor.css";

function GaleriaConsultor() {
  const [abaAtiva, setAbaAtiva] = useState("sugeridos");

  return (
    <main className="galeria-consultor-page">
      <div className="galeria-consultor-topo">
        <h1 className="texto-titulo-principal galeria-consultor-titulo">
          Galeria de Badges
        </h1>

        <SeletorAbas
          valorAtivo={abaAtiva}
          onChange={setAbaAtiva}
          opcoes={[
            { valor: "sugeridos", label: "Sugeridos" },
            { valor: "todos", label: "Todos os Badges" },
          ]}
        />
      </div>

      <div className="galeria-consultor-conteudo">
        {abaAtiva === "sugeridos" && <GaleriaSugeridos />}
        {abaAtiva === "todos" && <GaleriaTodosBadges />}
      </div>
    </main>
  );
}

export default GaleriaConsultor;