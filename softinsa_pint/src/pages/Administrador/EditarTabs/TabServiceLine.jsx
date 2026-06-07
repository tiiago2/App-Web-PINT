import React, { useState } from 'react';
import EditarFiltros from './EditarFiltros';
import EditarMetricas from './EditarMetricas';
import EditarTabela from './EditarTabela';
import ServiceLineModal from '../../../components/ServiceLineModal';

export default function TabServiceLine() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ordenacao, setOrdenacao] = useState('recentes');
  const [filtro, setFiltro] = useState('');

  const [serviceLines, setServiceLines] = useState([
    { id: 1, nome: 'Desenvolvimento Web', badges: 12, elementos: 45, learningPath: 'Software Engineering' },
    { id: 2, nome: 'Gestão de Equipas', badges: 8, elementos: 20, learningPath: 'Management' },
    { id: 3, nome: 'UI/UX Mobile', badges: 5, elementos: 15, learningPath: 'Design & Innovation' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [slToEdit, setSlToEdit] = useState(null);

  const metricas = [
    { titulo: "Service Lines", valor: serviceLines.length, icon: "fi-br-diagram-project" },
    { titulo: "Áreas", valor: 4, icon: "fi-br-crosshairs" },
    { titulo: "Learning Paths", valor: 10, icon: "fi-br-road" }
  ];

  // Em vez de "Área" passamos "Learning Path" como coluna, visto ser o pai direto
  const colunasTabela = ["Badges", "Elementos", "Learning Path"];

  const handleOpenCreateModal = () => {
    setSlToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sl) => {
    setSlToEdit(sl);
    setIsModalOpen(true);
  };

  const handleDeleteSL = (id) => {
    setServiceLines(prev => prev.filter(sl => sl.id !== id));
  };

  const handleSaveSL = (slObj) => {
    setServiceLines(prev => {
      const exists = prev.find(sl => sl.id === slObj.id);
      if (exists) {
        return prev.map(sl => sl.id === slObj.id ? slObj : sl);
      }
      return [slObj, ...prev];
    });
  };

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
        dados={serviceLines}
        searchTerm={searchTerm}
        colunas={colunasTabela}
        onAdd={handleOpenCreateModal}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteSL}
      />

      <ServiceLineModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSL}
        serviceLineToEdit={slToEdit}
      />
    </>
  );
}
