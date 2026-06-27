import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import EditarFiltros from '../Administrador/EditarTabs/EditarFiltros';
import EditarMetricas from '../Administrador/EditarTabs/EditarMetricas';
import GaleriaBadges from '../Administrador/EditarTabs/GaleriaBadges';
import EditarTabela from '../Administrador/EditarTabs/EditarTabela';
import BadgeModal from '../../components/Criar_Editar/BadgeModal';
import { MOCK_BADGES_INICIAL } from '../Administrador/EditarTabs/TabBadges';
import "./Galeria.css";

function Galeria() {
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [ordenacao, setOrdenacao] = useState('recentes');
  const [filtro, setFiltro] = useState('');
  const [viewMode, setViewMode] = useState('galeria'); 
  const [badges, setBadges] = useState(MOCK_BADGES_INICIAL);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [badgeToEdit, setBadgeToEdit] = useState(null);

  // Estados para o Pop-Up de Exportação do Colega
  const [mostrarExportar, setMostrarExportar] = useState(false); 
  const [formatoExport, setFormatoExport] = useState("csv"); 
  const [opcaoExport, setOpcaoExport] = useState("atual"); 
  const [intervaloPaginas, setIntervaloPaginas] = useState(""); 

  useEffect(() => {
    // Check for openCreateModal state from Quick Actions navigation
    if (location.state?.openCreateModal) {
      handleOpenCreateModal();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
    <div className="galeria-container w-100 d-flex flex-column h-100">
      
      <div className="d-flex justify-content-between align-items-center flex-shrink-0" style={{ marginBottom: 'var(--gap-titulo-principal-conteudo)' }}>
        <h1 className="texto-titulo-principal m-0 d-flex align-items-center">
          Galeria de Badges
          
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
        </h1>

        <button
          className="btn px-4 shadow-sm fw-semibold"
          style={{
            backgroundColor: "var(--barra_lateral)",
            color: "var(--fundo)",
            borderRadius: "var(--border-radius-pequeno)"
          }}
          onClick={() => setMostrarExportar(true)}
        >
          <i className="fi fi-br-download me-2"></i> Exportar
        </button>
      </div>

      {/* --- POP-UP DE EXPORTAÇÃO (MODAL) DO COLEGA --- */}
      {mostrarExportar && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ zIndex: 2000, backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="card shadow rounded-4 border-0 p-4"
            style={{ backgroundColor: "var(--fundo)", width: "450px", border: "var(--borda-principal) solid var(--contorno) !important" }}
          >
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="m-0 fw-bold" style={{ color: "var(--fontes)" }}>
                Exportar Dados
              </h4>
              <i
                className="fi fi-br-cross"
                style={{ cursor: "pointer", color: "var(--fontes)" }}
                onClick={() => setMostrarExportar(false)}
              ></i>
            </div>

            {/* Escolha do Formato */}
            <div className="mb-4">
              <label
                className="form-label fw-bold small"
                style={{ color: "var(--fontes)" }}
              >
                Formato do Ficheiro:
              </label>
              <div className="d-flex gap-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="formato"
                    id="csv"
                    checked={formatoExport === "csv"}
                    onChange={() => setFormatoExport("csv")}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="csv"
                    style={{ color: "var(--fontes)" }}
                  >
                    CSV (.csv)
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="formato"
                    id="pdf"
                    checked={formatoExport === "pdf"}
                    onChange={() => setFormatoExport("pdf")}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="pdf"
                    style={{ color: "var(--fontes)" }}
                  >
                    PDF (.pdf)
                  </label>
                </div>
              </div>
            </div>

            {/* Escolha do Conteúdo */}
            <div className="mb-4">
              <label
                className="form-label fw-bold small"
                style={{ color: "var(--fontes)" }}
              >
                Conteúdo a Exportar:
              </label>

              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="radio"
                  name="conteudo"
                  id="atual"
                  checked={opcaoExport === "atual"}
                  onChange={() => setOpcaoExport("atual")}
                />
                <label
                  className="form-check-label"
                  htmlFor="atual"
                  style={{ color: "var(--fontes)" }}
                >
                  Página Atual
                </label>
              </div>

              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="radio"
                  name="conteudo"
                  id="todas"
                  checked={opcaoExport === "todas"}
                  onChange={() => setOpcaoExport("todas")}
                />
                <label
                  className="form-check-label"
                  htmlFor="todas"
                  style={{ color: "var(--fontes)" }}
                >
                  Todas as Páginas
                </label>
              </div>

              <div className="form-check d-flex align-items-center gap-2">
                <input
                  className="form-check-input"
                  type="radio"
                  name="conteudo"
                  id="selecao"
                  checked={opcaoExport === "selecao"}
                  onChange={() => setOpcaoExport("selecao")}
                />
                <label
                  className="form-check-label"
                  htmlFor="selecao"
                  style={{ color: "var(--fontes)" }}
                >
                  Selecionar Páginas:
                </label>
                {opcaoExport === "selecao" && (
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Ex: 1-3"
                    style={{
                      width: "80px",
                      backgroundColor: "var(--fundo)",
                      borderColor: "var(--contorno)",
                      color: "var(--fontes)",
                    }}
                    value={intervaloPaginas}
                    onChange={(e) => setIntervaloPaginas(e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="d-flex justify-content-end gap-2 mt-2">
              <button
                className="btn btn-light px-4 fw-semibold"
                style={{
                  color: "var(--fontes)",
                  border: "var(--borda-principal) solid var(--contorno)",
                  borderRadius: "var(--border-radius-pequeno)"
                }}
                onClick={() => setMostrarExportar(false)}
              >
                Cancelar
              </button>
              <button
                className="btn px-4 fw-semibold"
                style={{
                  backgroundColor: "var(--barra_lateral)",
                  color: "var(--fundo)",
                  borderRadius: "var(--border-radius-pequeno)"
                }}
                onClick={() => {
                  alert(`A exportar em ${formatoExport.toUpperCase()}...`);
                  setMostrarExportar(false);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Componentes de Filtragem e Métricas Reutilizáveis */}
      <EditarFiltros 
        abaNome="Badge"
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        ordenacao={ordenacao} setOrdenacao={setOrdenacao}
        filtro={filtro} setFiltro={setFiltro}
      />
      
      <EditarMetricas metricas={metricas} />

      <div className="d-flex flex-column flex-grow-1 pb-2">
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
      </div>

      <BadgeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBadge}
        badgeToEdit={badgeToEdit}
      />
    </div>
  );
}

export default Galeria;
