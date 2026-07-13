import { useTranslation } from "react-i18next";
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
  placeholderPesquisa,
}) {
  const { t } = useTranslation();
  
  const resolvedPlaceholder = placeholderPesquisa || t("pesquisar_item_placeholder", { nome: t("badge") });

  const opcoesOrdenacao = [
    { valor: "recentes", label: t("ordenar_recentes") },
    { valor: "antigos", label: t("ordenar_antigos") },
    { valor: "az", label: t("ordenar_az") },
    { valor: "za", label: t("ordenar_za") },
  ];

  return (
    <section className="galeria-toolbar d-flex flex-column flex-xl-row align-items-stretch gap-3">
      <div className="galeria-toolbar-pesquisa">
        <BarraPesquisa
          valor={pesquisa}
          onChange={onPesquisaChange}
          placeholder={resolvedPlaceholder}
        />
      </div>

      <div className="galeria-toolbar-acao galeria-toolbar-acao--ordenar">
        <BotaoDropdown
          titulo={t("ordenar_por")}
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