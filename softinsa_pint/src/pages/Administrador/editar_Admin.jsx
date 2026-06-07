import React, { useState } from 'react';

import { TabsAdmin } from '../../components/ui/TabsAdmin';
import BarraPesquisa from '../../components/ui/BarraPesquisa/BarraPesquisa';
import BotaoDropdown from '../../components/ui/BotaoDropdown/BotaoDropdown';
import './editar_Admin.css';

function EditarAdmin() {

  const [abaAtiva, setAbaAtiva] = useState('badges');
  const [viewMode, setViewMode] = useState('galeria'); // 'galeria' ou 'tabela'
  const [searchTerm, setSearchTerm] = useState('');
  const [ordenacao, setOrdenacao] = useState('recentes');
  const [filtro, setFiltro] = useState('');
  const [visibleBadgesCount, setVisibleBadgesCount] = useState(15);

  const abasEditar = [
    { id: 'badges', label: 'Badges' },
    { id: 'areas', label: 'Áreas' },
    { id: 'service_line', label: 'Service Line' },
    { id: 'learning_paths', label: 'Learning Paths' }
  ];

  // Mock data for Learning Paths (simulando um grande número para ver o scroll infinito)
  const mockLearningPaths = [
    { id: 1, nome: 'Jornada Técnica', serviceLines: 5, elementos: 300, area: 'Tecnologia' },
    { id: 2, nome: 'Liderança e Gestão', serviceLines: 3, elementos: 150, area: 'Soft Skills' },
    { id: 3, nome: 'Inovação e Design', serviceLines: 4, elementos: 200, area: 'Inovação' },
    { id: 4, nome: 'Certificação Cloud', serviceLines: 2, elementos: 120, area: 'Tecnologia' },
    { id: 5, nome: 'Onboarding Corporativo', serviceLines: 6, elementos: 500, area: 'Recursos Humanos' },
    { id: 6, nome: 'Vendas Avançadas', serviceLines: 2, elementos: 80, area: 'Negócios' },
    { id: 7, nome: 'Agile & Scrum', serviceLines: 5, elementos: 250, area: 'Metodologias' },
    { id: 8, nome: 'Análise de Dados', serviceLines: 3, elementos: 210, area: 'Dados' },
    { id: 9, nome: 'Segurança Informática', serviceLines: 4, elementos: 95, area: 'Tecnologia' },
    { id: 10, nome: 'Gestão de Projetos', serviceLines: 7, elementos: 410, area: 'Gestão' },
  ];

  // Mock data for Badges
  const mockBadges = [
    { id: 1, nome: 'Low Code', categoria: 'Hybrid Systems', cor: '#b0baf0', icon: 'fi-br-mug-hot' },
    { id: 2, nome: 'Low Code', categoria: 'Hybrid Systems', cor: '#dce5f0', icon: 'fi-br-cloud' },
    { id: 3, nome: 'Low Code', categoria: 'Hybrid Systems', cor: '#f0df81', icon: 'fi-br-target' },
    { id: 4, nome: 'Low Code', categoria: 'Hybrid Systems', cor: '#df7983', icon: 'fi-br-trophy' },
    { id: 5, nome: 'Low Code', categoria: 'Hybrid Systems', cor: '#aec87e', icon: 'fi-br-microchip' },
    { id: 6, nome: 'Low Code', categoria: 'Hybrid Systems', cor: '#76a8ef', icon: 'fi-br-bolt' },
    { id: 7, nome: 'Low Code', categoria: 'Hybrid Systems', cor: '#f4ce5a', icon: 'fi-br-target' },
    { id: 8, nome: 'Low Code', categoria: 'Hybrid Systems', cor: '#c2c9f5', icon: 'fi-br-mug-hot' },
    { id: 9, nome: 'Low Code', categoria: 'Hybrid Systems', cor: '#df7983', icon: 'fi-br-trophy' },
    { id: 10, nome: 'Low Code', categoria: 'Hybrid Systems', cor: '#a0e4b8', icon: 'fi-br-database' },
    { id: 11, nome: 'Low Code', categoria: 'Hybrid Systems', cor: '#aec87e', icon: 'fi-br-microchip' },
    { id: 12, nome: 'React Native', categoria: 'Mobile', cor: '#61dafb', icon: 'fi-br-smartphone' },
    { id: 13, nome: 'Angular Pro', categoria: 'Web UI', cor: '#dd0031', icon: 'fi-br-browser' },
    { id: 14, nome: 'CyberSec', categoria: 'Security', cor: '#4a4e69', icon: 'fi-br-shield-check' },
    { id: 15, nome: 'DevOps Master', categoria: 'Infrastructure', cor: '#f4a261', icon: 'fi-br-server' },
    { id: 16, nome: 'UI/UX Design', categoria: 'Design', cor: '#e76f51', icon: 'fi-br-palette' },
    { id: 17, nome: 'Python AI', categoria: 'Data Science', cor: '#2a9d8f', icon: 'fi-br-chart-histogram' },
  ];

  // Métricas mock
  const metricas = {
    totalLp: 10,
    totalSl: 30,
    totalAreas: 4
  };

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

  const renderFiltros = () => (
    <div className="d-flex flex-column flex-xl-row align-items-stretch gap-3 mb-4">
      <div className="flex-grow-1">
        <BarraPesquisa
          valor={searchTerm}
          onChange={setSearchTerm}
          placeholder={`Pesquisar ${abaAtiva.replace('_', ' ')}...`}
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

  const renderMetricas = () => (
    <div className="row g-3 mb-4">
      <div className="col-md-4">
        <div className="p-3 border border-2 rounded-4 bg-white shadow-sm d-flex justify-content-between align-items-center h-100">
          <div>
            <h6 className="text-muted fw-semibold mb-1" style={{ fontSize: '0.85rem' }}>Total de Learning Paths</h6>
            <div className="fw-bold" style={{ fontSize: '2rem', color: 'var(--fontes)', lineHeight: '1' }}>{metricas.totalLp}</div>
          </div>
          <div className="text-muted fs-1 opacity-50">
            <i className="fi fi-br-road"></i>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="p-3 border border-2 rounded-4 bg-white shadow-sm d-flex justify-content-between align-items-center h-100">
          <div>
            <h6 className="text-muted fw-semibold mb-1" style={{ fontSize: '0.85rem' }}>Total de Service Lines</h6>
            <div className="fw-bold" style={{ fontSize: '2rem', color: 'var(--fontes)', lineHeight: '1' }}>{metricas.totalSl}</div>
          </div>
          <div className="text-muted fs-1 opacity-50">
            <i className="fi fi-br-diagram-project"></i>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="p-3 border border-2 rounded-4 bg-white shadow-sm d-flex justify-content-between align-items-center h-100">
          <div>
            <h6 className="text-muted fw-semibold mb-1" style={{ fontSize: '0.85rem' }}>Áreas</h6>
            <div className="fw-bold" style={{ fontSize: '2rem', color: 'var(--fontes)', lineHeight: '1' }}>{metricas.totalAreas}</div>
          </div>
          <div className="text-muted fs-1 opacity-50">
            <i className="fi fi-br-crosshairs"></i>
          </div>
        </div>
      </div>
    </div>
  );

  const getNomeAba = () => {
    switch(abaAtiva) {
      case 'learning_paths': return 'Learning Path';
      case 'service_line': return 'Service Line';
      case 'areas': return 'Área';
      case 'badges': return 'Badge';
      default: return '';
    }
  };

  const renderTabela = () => {
    // Filtrar mock data. Na versão final isto será alimentado pela API da aba atual.
    const filtrados = mockLearningPaths.filter(lp => lp.nome.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      <div className="d-flex flex-column" style={{ minHeight: '400px' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-semibold mb-0" style={{ color: 'var(--fontes)' }}>Todos:</h4>
          <button className="btn rounded-pill px-4 text-white shadow-sm d-flex align-items-center gap-2" style={{ backgroundColor: 'var(--barra_lateral)' }}>
            <i className="fi fi-br-plus"></i> Adicionar {getNomeAba()}
          </button>
        </div>

        <div className="table-wrapper shadow-sm flex-grow-1">
          <div className="table-scrollable">
            <table className="table table-hover text-center align-middle mb-0">
              <thead>
                <tr>
                  <th className="text-start ps-4">Nome ({getNomeAba()})</th>
                  <th>Service Lines</th>
                  <th>Nº Elementos</th>
                  <th>Área</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length > 0 ? filtrados.map(lp => (
                  <tr key={lp.id}>
                    <td className="text-start ps-4 fw-medium text-dark">{lp.nome}</td>
                    <td>{lp.serviceLines}</td>
                    <td>{lp.elementos}</td>
                    <td>{lp.area}</td>
                    <td>
                      <button className="action-btn me-2" title="Editar"><i className="fi fi-br-edit"></i></button>
                      <button className="action-btn action-btn-danger" title="Eliminar"><i className="fi fi-br-trash"></i></button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="text-muted py-5">Nenhum registo encontrado para a tua pesquisa.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderGaleria = () => {
    const filtrados = mockBadges.filter(b => b.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    const batch1 = filtrados.slice(0, 15);
    const batch2 = visibleBadgesCount > 15 ? filtrados.slice(15) : [];

    return (
      <div className="d-flex flex-column" style={{ minHeight: '400px' }}>
        <h4 className="fw-semibold mb-3" style={{ color: 'var(--fontes)' }}>Todos:</h4>
        
        <div className="badge-gallery-grid">
          {/* Botão Criar Badge */}
          <div className="badge-item-wrapper">
            <div className="badge-circle create-badge">
              <i className="fi fi-br-plus"></i>
            </div>
            <div className="badge-name">Criar Badge</div>
            <div className="badge-category">Adicionar novo</div>
          </div>

          {/* Lista de Badges - Primeiro Lote (Até 15) */}
          {batch1.map(badge => (
            <div key={badge.id} className="badge-item-wrapper">
              <div className="badge-circle" style={{ backgroundColor: badge.cor }}>
                <i className={`fi ${badge.icon}`}></i>
                <div className="badge-delete-btn" title="Eliminar Badge">
                  <i className="fi fi-br-trash"></i>
                </div>
              </div>
              <div className="badge-name">{badge.nome}</div>
              <div className="badge-category">{badge.categoria}</div>
            </div>
          ))}
        </div>

        {/* Lista de Badges - Segundo Lote (Restantes) */}
        {batch2.length > 0 && (
          <div className="badge-gallery-grid" style={{ paddingTop: '0' }}>
            {batch2.map(badge => (
              <div key={badge.id} className="badge-item-wrapper">
                <div className="badge-circle" style={{ backgroundColor: badge.cor }}>
                  <i className={`fi ${badge.icon}`}></i>
                  <div className="badge-delete-btn" title="Eliminar Badge">
                    <i className="fi fi-br-trash"></i>
                  </div>
                </div>
                <div className="badge-name">{badge.nome}</div>
                <div className="badge-category">{badge.categoria}</div>
              </div>
            ))}
          </div>
        )}

        {filtrados.length > visibleBadgesCount && (
          <button 
            className="ver-mais-badges-btn"
            onClick={() => setVisibleBadgesCount(filtrados.length)}
          >
            Ver mais Badges
          </button>
        )}
      </div>
    );
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
        
        {renderFiltros()}
        {renderMetricas()}
        {abaAtiva === 'badges' && viewMode === 'galeria' ? renderGaleria() : renderTabela()}
      </div>

    </div>
  );
}

export default EditarAdmin;
