import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { TabsAdmin } from '../../components/ui/TabsAdmin';
import './editar_Admin.css';

// Importação das Abas
import TabBadges from './EditarTabs/TabBadges';
import TabAreas from './EditarTabs/TabAreas';
import TabServiceLine from './EditarTabs/TabServiceLine';
import TabLearningPaths from './EditarTabs/TabLearningPaths';

function EditarAdmin() {
  const { t } = useTranslation();
  const location = useLocation();
  const [abaAtiva, setAbaAtiva] = useState(location.state?.abaAtiva || 'badges');
  const [viewMode, setViewMode] = useState('galeria'); // 'galeria' ou 'tabela' (usado apenas na aba Badges)

  useEffect(() => {
    if (location.state?.abaAtiva) {
      setAbaAtiva(location.state.abaAtiva);
    }
  }, [location.state]);

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
      <h1 className="texto-titulo-principal d-flex align-items-center" style={{ marginBottom: 'var(--gap-titulo-principal-conteudo)' }}>
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
