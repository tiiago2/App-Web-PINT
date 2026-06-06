import React, { useState } from 'react';
import EditarFiltros from './EditarFiltros';
import EditarMetricas from './EditarMetricas';
import EditarTabela from './EditarTabela';

export default function TabLearningPaths() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ordenacao, setOrdenacao] = useState('recentes');
  const [filtro, setFiltro] = useState('');

  const mockLearningPaths = [
    { id: 1, nome: 'Jornada Técnica', servicelines: 5, elementos: 300, area: 'Tecnologia' },
    { id: 2, nome: 'Liderança e Gestão', servicelines: 3, elementos: 150, area: 'Soft Skills' },
    { id: 3, nome: 'Inovação e Design', servicelines: 4, elementos: 200, area: 'Inovação' },
    { id: 4, nome: 'Certificação Cloud', servicelines: 2, elementos: 120, area: 'Tecnologia' },
    { id: 5, nome: 'Onboarding Corporativo', servicelines: 6, elementos: 500, area: 'Recursos Humanos' },
    { id: 6, nome: 'Vendas Avançadas', servicelines: 2, elementos: 80, area: 'Negócios' },
    { id: 7, nome: 'Agile & Scrum', servicelines: 5, elementos: 250, area: 'Metodologias' },
    { id: 8, nome: 'Análise de Dados', servicelines: 3, elementos: 210, area: 'Dados' },
    { id: 9, nome: 'Segurança Informática', servicelines: 4, elementos: 95, area: 'Tecnologia' },
    { id: 10, nome: 'Gestão de Projetos', servicelines: 7, elementos: 410, area: 'Gestão' },
  ];

  const metricas = [
    { titulo: "Learning Paths", valor: mockLearningPaths.length, icon: "fi-br-road" },
    { titulo: "Áreas", valor: 4, icon: "fi-br-crosshairs" },
    { titulo: "Service Lines", valor: 30, icon: "fi-br-diagram-project" }
  ];

  const colunasTabela = ["Service Lines", "Elementos", "Área"];

  return (
    <>
      <EditarFiltros 
        abaNome="Learning Path"
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        ordenacao={ordenacao} setOrdenacao={setOrdenacao}
        filtro={filtro} setFiltro={setFiltro}
      />
      
      <EditarMetricas metricas={metricas} />

      <EditarTabela 
        abaNome="Learning Path"
        dados={mockLearningPaths}
        searchTerm={searchTerm}
        colunas={colunasTabela}
      />
    </>
  );
}
