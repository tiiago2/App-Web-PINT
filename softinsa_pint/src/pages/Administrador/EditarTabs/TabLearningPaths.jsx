import React, { useState } from 'react';
import EditarFiltros from './EditarFiltros';
import EditarMetricas from './EditarMetricas';
import EditarTabela from './EditarTabela';
import LearningPathModal from '../../../components/Criar_Editar/LearningPathModal';

export default function TabLearningPaths() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ordenacao, setOrdenacao] = useState('recentes');
  const [filtro, setFiltro] = useState('');

  const [learningPaths, setLearningPaths] = useState([
    { id: 1, nome: 'Jornada Técnica', servicelines: 5, elementos: 300 }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lpToEdit, setLpToEdit] = useState(null);

  const metricas = [
    { titulo: "Learning Paths", valor: learningPaths.length, icon: "fi-br-road" },
    { titulo: "Áreas", valor: 4, icon: "fi-br-crosshairs" },
    { titulo: "Service Lines", valor: 30, icon: "fi-br-diagram-project" }
  ];

  const colunasTabela = ["Service Lines", "Elementos"];

  const handleOpenCreateModal = () => {
    setLpToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (lp) => {
    setLpToEdit(lp);
    setIsModalOpen(true);
  };

  const handleDeleteLP = (id) => {
    setLearningPaths(prev => prev.filter(lp => lp.id !== id));
  };

  const handleSaveLP = (lpObj) => {
    setLearningPaths(prev => {
      const exists = prev.find(lp => lp.id === lpObj.id);
      if (exists) {
        return prev.map(lp => lp.id === lpObj.id ? lpObj : lp);
      }
      return [lpObj, ...prev];
    });
  };

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
        dados={learningPaths}
        searchTerm={searchTerm}
        colunas={colunasTabela}
        onAdd={handleOpenCreateModal}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteLP}
      />

      <LearningPathModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLP}
        lpToEdit={lpToEdit}
      />
    </>
  );
}
