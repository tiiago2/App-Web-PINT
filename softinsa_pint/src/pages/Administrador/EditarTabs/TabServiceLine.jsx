import React, { useState } from 'react';
import EditarFiltros from './EditarFiltros';
import EditarMetricas from './EditarMetricas';
import EditarTabela from './EditarTabela';

export default function TabServiceLine() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ordenacao, setOrdenacao] = useState('recentes');
  const [filtro, setFiltro] = useState('');

  const mockServiceLines = [
    { id: 1, nome: 'Desenvolvimento Web', badges: 12, elementos: 45, area: 'Tecnologia' },
    { id: 2, nome: 'Gestão de Equipas', badges: 8, elementos: 20, area: 'Soft Skills' },
    { id: 3, nome: 'UI/UX Mobile', badges: 5, elementos: 15, area: 'Inovação' }
  ];

  const metricas = [
    { titulo: "Service Lines", valor: mockServiceLines.length, icon: "fi-br-diagram-project" },
    { titulo: "Áreas", valor: 4, icon: "fi-br-crosshairs" },
    { titulo: "Learning Paths", valor: 10, icon: "fi-br-road" }
  ];

  const colunasTabela = ["Badges", "Elementos", "Área"];

  return (
    <>
      <EditarFiltros 
        abaNome="Service Line"
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        ordenacao={ordenacao} setOrdenacao={setOrdenacao}
        filtro={filtro} setFiltro={setFiltro}
      />
      
      <EditarMetricas metricas={metricas} />

      <EditarTabela 
        abaNome="Service Line"
        dados={mockServiceLines}
        searchTerm={searchTerm}
        colunas={colunasTabela}
      />
    </>
  );
}
