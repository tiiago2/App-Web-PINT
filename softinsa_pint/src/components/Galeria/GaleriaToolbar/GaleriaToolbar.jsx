import BarraPesquisa from "../../ui/BarraPesquisa/BarraPesquisa";
import BotaoDropdown from "../../ui/BotaoDropdown/BotaoDropdown";
import GaleriaFiltroDropdown from "../GaleriaFiltroDropdown/GaleriaFiltroDropdown";
import "./GaleriaToolbar.css";

function GaleriaToolbar({
  pesquisa,
  onPesquisaChange,
  ordenacao,
  onOrdenacaoChange,
  filtro,
  onFiltroChange,
  opcoesFiltro,
  placeholderPesquisa = "Pesquisar Badge...",
}) {
  const opcoesOrdenacao = [
    { valor: "recentes", label: "Mais recentes" },
    { valor: "antigos", label: "Mais antigos" },
    { valor: "az", label: "A-Z" },
    { valor: "za", label: "Z-A" },
  ];

  return (
    <section className="galeria-toolbar d-flex flex-column flex-xl-row align-items-stretch gap-3">
      <div className="galeria-toolbar-pesquisa">
        <BarraPesquisa
          valor={pesquisa}
          onChange={onPesquisaChange}
          placeholder={placeholderPesquisa}
        />
      </div>

      <div className="galeria-toolbar-acao galeria-toolbar-acao--ordenar">
        <BotaoDropdown
          titulo="Ordenar por"
          valor={ordenacao}
          opcoes={opcoesOrdenacao}
          onChange={onOrdenacaoChange}
        />
      </div>

      <div className="galeria-toolbar-acao galeria-toolbar-acao--filtrar">
        <GaleriaFiltroDropdown
          valor={filtro}
          opcoes={opcoesFiltro}
          onChange={onFiltroChange}
        />
      </div>
    </section>
  );
}

export default GaleriaToolbar;