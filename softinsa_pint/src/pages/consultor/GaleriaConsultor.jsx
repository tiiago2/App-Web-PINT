import { useState } from "react";
import SeletorAbas from "../../components/ui/SeletorAbas/SeletorAbas_Galeria";
import GaleriaSugeridos from "../../components/Galeria/GaleriaSugeridos/GaleriaSugeridos";
import GaleriaTodosBadges from "../../components/Galeria/GaleriaTodosBadges/GaleriaTodosBadges";
import GaleriaToolbar from "../../components/Galeria/GaleriaToolbar/GaleriaToolbar";
import "./GaleriaConsultor.css";

function GaleriaConsultor() {
  const [abaAtiva, setAbaAtiva] = useState("sugeridos");
  const [pesquisa, setPesquisa] = useState("");
  const [ordenacao, setOrdenacao] = useState("recentes");
  const [filtro, setFiltro] = useState("");

  return (
    <main className="galeria-consultor-page">
      <div className="galeria-consultor-topo">
        <h1 className="texto-titulo-principal galeria-consultor-titulo">
          Galeria de Badges
        </h1>

        <div className="galeria-consultor-seletor">
          <SeletorAbas
            valorAtivo={abaAtiva}
            onChange={setAbaAtiva}
            opcoes={[
              { valor: "sugeridos", label: "Sugeridos" },
              { valor: "todos", label: "Todos os Badges" },
            ]}
          />
        </div>
      </div>

      <div className="galeria-consultor-conteudo">
        {abaAtiva === "todos" && (
          <GaleriaToolbar
            pesquisa={pesquisa}
            onPesquisaChange={setPesquisa}
            ordenacao={ordenacao}
            onOrdenacaoChange={setOrdenacao}
            filtro={filtro}
            onFiltroChange={setFiltro}
          />
        )}

        <div className={`galeria-consultor-resultados ${abaAtiva === "todos" ? "com-toolbar" : ""}`}>
          {abaAtiva === "sugeridos" && <GaleriaSugeridos />}
          {abaAtiva === "todos" && <GaleriaTodosBadges />}
        </div>
      </div>
    </main>
  );
}

export default GaleriaConsultor;