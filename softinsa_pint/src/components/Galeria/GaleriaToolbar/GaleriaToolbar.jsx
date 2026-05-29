import BarraPesquisa from "../../ui/BarraPesquisa/BarraPesquisa";
import BotaoDropdown from "../../ui/BotaoDropdown/BotaoDropdown";
import "./GaleriaToolbar.css";

function GaleriaToolbar({
  pesquisa,
  onPesquisaChange,
  ordenacao,
  onOrdenacaoChange,
  filtro,
  onFiltroChange,
}) {
  const opcoesOrdenacao = [
    { valor: "recentes", label: "Mais recentes" },
    { valor: "antigos", label: "Mais antigos" },
    { valor: "az", label: "A-Z" },
    { valor: "za", label: "Z-A" },
  ];

  const opcoesFiltro = [
    { valor: "", label: "Todos" },
    { valor: "learningPath", label: "Learning Path" },
    { valor: "serviceLine", label: "Service Line" },
    { valor: "area", label: "Área" },
  ];

  return (
    <section className="galeria-toolbar d-flex flex-column flex-xl-row align-items-stretch gap-3">
      <div className="galeria-toolbar-pesquisa">
        <BarraPesquisa
          valor={pesquisa}
          onChange={onPesquisaChange}
          placeholder="Pesquisar Badge..."
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
        <BotaoDropdown
        titulo="Filtrar"
        valor={filtro}
        opcoes={opcoesFiltro}
        onChange={onFiltroChange}
        icone="fi fi-br-filter"
        mostrarValor={false}
        mostrarSeta={false}
        />
      </div>
    </section>
  );
}

export default GaleriaToolbar;