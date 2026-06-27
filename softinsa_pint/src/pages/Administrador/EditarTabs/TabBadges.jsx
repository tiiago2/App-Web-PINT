import React, { useState } from 'react';
import EditarFiltros from './EditarFiltros';
import EditarMetricas from './EditarMetricas';
import GaleriaBadges from './GaleriaBadges';
import EditarTabela from './EditarTabela';
import BadgeModal from '../../../components/Criar_Editar/BadgeModal';

export const MOCK_BADGES_INICIAL = [
  { id: 1, nome: 'Low Code', categoria: 'Hybrid Systems', cor: '#b0baf0', icon: 'fi-br-mug-hot' },
  { id: 2, nome: 'Angular Master', categoria: 'Web UI', cor: '#dce5f0', icon: 'fi-br-cloud', especial: true, tipoEspecial: 'silver' },
  { id: 3, nome: 'AWS Architect', categoria: 'Cloud Native', cor: '#f0df81', icon: 'fi-br-target', especial: true, tipoEspecial: 'gold' },
  { id: 4, nome: 'Low Code', categoria: 'Hybrid Systems', cor: '#df7983', icon: 'fi-br-trophy' },
  { id: 5, nome: 'Low Code', categoria: 'Hybrid Systems', cor: '#aec87e', icon: 'fi-br-microchip' },
  { id: 6, nome: 'Spring Guru', categoria: 'Backend', cor: '#76a8ef', icon: 'fi-br-bolt', especial: true, tipoEspecial: 'gold' },
  { id: 7, nome: 'Low Code', categoria: 'Hybrid Systems', cor: '#f4ce5a', icon: 'fi-br-target' },
  { id: 8, nome: 'Low Code', categoria: 'Hybrid Systems', cor: '#c2c9f5', icon: 'fi-br-mug-hot' },
  { id: 9, nome: 'React Expert', categoria: 'Web UI', cor: '#df7983', icon: 'fi-br-trophy', especial: true, tipoEspecial: 'silver' },
  { id: 10, nome: 'Low Code', categoria: 'Hybrid Systems', cor: '#a0e4b8', icon: 'fi-br-database' },
  { id: 11, nome: 'Low Code', categoria: 'Hybrid Systems', cor: '#aec87e', icon: 'fi-br-microchip' },
  { id: 12, nome: 'React Native', categoria: 'Mobile', cor: '#61dafb', icon: 'fi-br-smartphone' },
  { id: 13, nome: 'Angular Pro', categoria: 'Web UI', cor: '#dd0031', icon: 'fi-br-browser' },
  { id: 14, nome: 'CyberSec', categoria: 'Security', cor: '#4a4e69', icon: 'fi-br-shield-check' },
  { id: 15, nome: 'DevOps Master', categoria: 'Infrastructure', cor: '#f4a261', icon: 'fi-br-server' },
  { id: 16, nome: 'UI/UX Design', categoria: 'Design', cor: '#e76f51', icon: 'fi-br-palette' },
  { id: 17, nome: 'Python AI', categoria: 'Data Science', cor: '#2a9d8f', icon: 'fi-br-chart-histogram' },
];

export default function TabBadges({ viewMode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [ordenacao, setOrdenacao] = useState('recentes');
  const [filtro, setFiltro] = useState('');
  
  // Estado local para os badges
  const [badges, setBadges] = useState(MOCK_BADGES_INICIAL);
  
  // Estado do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [badgeToEdit, setBadgeToEdit] = useState(null);

  const metricas = [
    { titulo: "Total de Badges", valor: badges.length, icon: "fi-br-badge" },
    { titulo: "Áreas", valor: 4, icon: "fi-br-crosshairs" },
    { titulo: "Service Lines", valor: 30, icon: "fi-br-diagram-project" }
  ];

  const colunasTabela = ["Categoria"]; // Apenas categoria, pois os outros campos são ícone/cor

  const handleOpenCreateModal = () => {
    setBadgeToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (badge) => {
    setBadgeToEdit(badge);
    setIsModalOpen(true);
  };

  const handleDeleteBadge = (id) => {
    setBadges(prev => prev.filter(b => b.id !== id));
  };

  const handleSaveBadge = (badgeObj) => {
    setBadges(prev => {
      // Se já existir, é edição
      const exists = prev.find(b => b.id === badgeObj.id);
      if (exists) {
        return prev.map(b => b.id === badgeObj.id ? badgeObj : b);
      }
      // Senão, é criação
      return [badgeObj, ...prev]; // Adiciona ao início da lista
    });
  };

  return (
    <>
      <EditarFiltros 
        abaNome="Badge"
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        ordenacao={ordenacao} setOrdenacao={setOrdenacao}
        filtro={filtro} setFiltro={setFiltro}
      />
      
      <EditarMetricas metricas={metricas} />

      {viewMode === 'galeria' ? (
        <GaleriaBadges 
          mockBadges={badges}
          searchTerm={searchTerm}
          onAdd={handleOpenCreateModal}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteBadge}
        />
      ) : (
        <EditarTabela 
          abaNome="Badge"
          dados={badges}
          searchTerm={searchTerm}
          colunas={colunasTabela}
          onAdd={handleOpenCreateModal}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteBadge}
        />
      )}

      <BadgeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBadge}
        badgeToEdit={badgeToEdit}
      />
    </>
  );
}
