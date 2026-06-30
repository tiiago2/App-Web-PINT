import React from 'react';
import { useTranslation } from 'react-i18next';
import BarraPesquisa from '../../../components/ui/BarraPesquisa/BarraPesquisa';
import BotaoDropdown from '../../../components/ui/BotaoDropdown/BotaoDropdown';
import GaleriaFiltroDropdown from '../../../components/Galeria/GaleriaFiltroDropdown/GaleriaFiltroDropdown';

export default function EditarFiltros({
  abaNome,
  searchTerm, setSearchTerm,
  ordenacao, setOrdenacao,
  filtro, setFiltro,
  usarFiltroAvancado = false,
  opcoesFiltroAvancado = {
    learningPath: [],
    serviceLine: [],
    area: [],
  },
}) {
  const { t } = useTranslation();

  const getAbaNomeKey = (nome) => {
    return (nome || "").toLowerCase().replace(" ", "_");
  };

  const opcoesOrdenacao = [
    { valor: "recentes", label: t("ordenar_recentes") },
    { valor: "antigos", label: t("ordenar_antigos") },
    { valor: "az", label: t("ordenar_az") },
    { valor: "za", label: t("ordenar_za") },
  ];

  const opcoesFiltro = [
    { valor: "", label: t("todos") },
    { valor: "learningPath", label: t("learning_path") },
    { valor: "serviceLine", label: t("service_line") },
    { valor: "area", label: t("area") },
  ];

  return (
    <div className="d-flex flex-column flex-xl-row align-items-stretch gap-3 mb-4">
      <div className="flex-grow-1">
        <BarraPesquisa
          valor={searchTerm}
          onChange={setSearchTerm}
          placeholder={t("pesquisar_item_placeholder", { nome: t(getAbaNomeKey(abaNome)) })}
        />
      </div>

      <div style={{ minWidth: '180px' }}>
        <BotaoDropdown
          titulo={t("ordenar_por")}
          valor={ordenacao}
          opcoes={opcoesOrdenacao}
          onChange={setOrdenacao}
        />
      </div>

      <div style={{ minWidth: usarFiltroAvancado ? '260px' : '180px' }}>
        {usarFiltroAvancado ? (
          <GaleriaFiltroDropdown
            valor={filtro}
            opcoes={opcoesFiltroAvancado}
            onChange={setFiltro}
          />
        ) : (
          <BotaoDropdown
            titulo="Filtrar"
            valor={filtro}
            opcoes={opcoesFiltro}
            onChange={setFiltro}
            icone="fi fi-br-filter"
            mostrarValor={false}
            mostrarSeta={false}
          />
        )}
      </div>
    </div>
  );
}