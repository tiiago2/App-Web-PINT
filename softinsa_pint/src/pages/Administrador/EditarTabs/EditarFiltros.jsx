import React from 'react';
import BarraPesquisa from '../../../components/ui/BarraPesquisa/BarraPesquisa';
import BotaoDropdown from '../../../components/ui/BotaoDropdown/BotaoDropdown';

export default function EditarFiltros({
  abaNome,
  searchTerm, setSearchTerm,
  ordenacao, setOrdenacao,
  filtro, setFiltro
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
    <div className="d-flex flex-column flex-xl-row align-items-stretch gap-3 mb-4">
      <div className="flex-grow-1">
        <BarraPesquisa
          valor={searchTerm}
          onChange={setSearchTerm}
          placeholder={`Pesquisar ${abaNome}...`}
        />
      </div>

      <div style={{ minWidth: '180px' }}>
        <BotaoDropdown
          titulo="Ordenar por"
          valor={ordenacao}
          opcoes={opcoesOrdenacao}
          onChange={setOrdenacao}
        />
      </div>

      <div>
        <BotaoDropdown
          titulo="Filtrar"
          valor={filtro}
          opcoes={opcoesFiltro}
          onChange={setFiltro}
          icone="fi fi-br-filter"
          mostrarValor={false}
          mostrarSeta={false}
        />
      </div>
    </div>
  );
}
