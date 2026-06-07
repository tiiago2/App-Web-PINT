import React, { useState } from 'react';
import EditarFiltros from './EditarFiltros';
import EditarMetricas from './EditarMetricas';
import EditarTabela from './EditarTabela';
import AreaModal from '../../../components/AreaModal';

export default function TabAreas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ordenacao, setOrdenacao] = useState('recentes');
  const [filtro, setFiltro] = useState('');

  const [areas, setAreas] = useState([
    { id: 1, nome: 'Tecnologia', servicelines: 3, badges: 40 },
    { id: 2, nome: 'Soft Skills', servicelines: 2, badges: 15 },
    { id: 3, nome: 'Inovação', servicelines: 1, badges: 10 }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [areaToEdit, setAreaToEdit] = useState(null);

  const metricas = [
    { titulo: "Áreas", valor: areas.length, icon: "fi-br-crosshairs" },
    { titulo: "Learning Paths", valor: 10, icon: "fi-br-road" },
    { titulo: "Service Lines", valor: 30, icon: "fi-br-diagram-project" }
  ];

  const colunasTabela = ["Service Lines", "Badges"];

  const handleOpenCreateModal = () => {
    setAreaToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (area) => {
    setAreaToEdit(area);
    setIsModalOpen(true);
  };

  const handleDeleteArea = (id) => {
    setAreas(prev => prev.filter(a => a.id !== id));
  };

  const handleSaveArea = (areaObj) => {
    setAreas(prev => {
      const exists = prev.find(a => a.id === areaObj.id);
      if (exists) {
        return prev.map(a => a.id === areaObj.id ? areaObj : a);
      }
      return [areaObj, ...prev];
    });
  };

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
        dados={areas}
        searchTerm={searchTerm}
        colunas={colunasTabela}
        onAdd={handleOpenCreateModal}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteArea}
      />

      <AreaModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveArea}
        areaToEdit={areaToEdit}
      />
    </>
  );
}
