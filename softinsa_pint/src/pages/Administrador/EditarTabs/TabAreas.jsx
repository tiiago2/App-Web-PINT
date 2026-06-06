import React, { useState } from 'react';
import EditarFiltros from './EditarFiltros';
import EditarMetricas from './EditarMetricas';
import EditarTabela from './EditarTabela';

export default function TabAreas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ordenacao, setOrdenacao] = useState('recentes');
  const [filtro, setFiltro] = useState('');

  const mockAreas = [
    { id: 1, nome: 'Tecnologia', servicelines: 3, badges: 40, responsavel: 'Rui Costa' },
    { id: 2, nome: 'Soft Skills', servicelines: 2, badges: 15, responsavel: 'Ana Silva' },
    { id: 3, nome: 'Inovação', servicelines: 1, badges: 10, responsavel: 'João Pires' }
  ];

  const metricas = [
    { titulo: "Áreas", valor: mockAreas.length, icon: "fi-br-crosshairs" },
    { titulo: "Learning Paths", valor: 10, icon: "fi-br-road" },
    { titulo: "Service Lines", valor: 30, icon: "fi-br-diagram-project" }
  ];

  const colunasTabela = ["Service Lines", "Badges", "Responsavel"];

  return (
    <>
      <EditarFiltros 
        abaNome="Área"
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        ordenacao={ordenacao} setOrdenacao={setOrdenacao}
        filtro={filtro} setFiltro={setFiltro}
      />
      
      <EditarMetricas metricas={metricas} />

      <EditarTabela 
        abaNome="Área"
        dados={mockAreas}
        searchTerm={searchTerm}
        colunas={colunasTabela}
      />
    </>
  );
}
