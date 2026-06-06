import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TabsAdmin } from '../../components/ui/TabsAdmin';
import './editar_Admin.css';

// Importação das Abas
import TabBadges from './EditarTabs/TabBadges';
import TabAreas from './EditarTabs/TabAreas';
import TabServiceLine from './EditarTabs/TabServiceLine';
import TabLearningPaths from './EditarTabs/TabLearningPaths';

function EditarAdmin() {
  const { t } = useTranslation();
  const [abaAtiva, setAbaAtiva] = useState('badges');
  const [viewMode, setViewMode] = useState('galeria'); // 'galeria' ou 'tabela' (usado apenas na aba Badges)

  const abasEditar = [
    { id: 'badges', label: 'Badges' },
    { id: 'areas', label: 'Áreas' },
    { id: 'service_line', label: 'Service Line' },
    { id: 'learning_paths', label: 'Learning Paths' }
  ];

  const getNomeAba = () => {
    switch(abaAtiva) {
      case 'learning_paths': return 'Learning Path';
      case 'service_line': return 'Service Line';
      case 'areas': return 'Área';
      case 'badges': return 'Badge';
      default: return '';
    }
  };

  const renderAbaConteudo = () => {
    switch(abaAtiva) {
      case 'badges':
        return <TabBadges viewMode={viewMode} />;
      case 'areas':
        return <TabAreas />;
      case 'service_line':
        return <TabServiceLine />;
      case 'learning_paths':
        return <TabLearningPaths />;
      default:
        return null;
    }
  };

  return (
    <div className="editar-container w-100">
      <h1 className="texto-titulo-principal d-flex align-items-center mb-4">
        Editar {getNomeAba()}{abaAtiva !== 'areas' ? 's' : ''}
        
        {abaAtiva === 'badges' && (
          <div className="view-toggle-container">
            <button 
              className={`view-toggle-btn ${viewMode === 'galeria' ? 'active' : ''}`}
              onClick={() => setViewMode('galeria')}
            >
              <i className="fi fi-br-grid"></i> Galeria
            </button>
            <button 
              className={`view-toggle-btn ${viewMode === 'tabela' ? 'active' : ''}`}
              onClick={() => setViewMode('tabela')}
            >
              <i className="fi fi-br-table"></i> Tabela
            </button>
          </div>
        )}
      </h1>

      {/* Navegação de Abas */}
      <TabsAdmin abas={abasEditar} abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva} />

      {/* Conteúdo dinâmico da Aba */}
      <div className="d-flex flex-column flex-grow-1 pb-2">
        {renderAbaConteudo()}
      </div>

    </div>
  );
}

export default EditarAdmin;
