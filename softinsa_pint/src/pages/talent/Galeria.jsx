import React, { useState } from 'react';

function Galeria() {
  // Estado para controlar a vista ativa (Galeria vs Tabela)
  const [vistaAtiva, setVistaAtiva] = useState('tabela');

  // Dados falsos para simular a tabela da imagem
  const badgesData = [
    { id: 1, nome: "Low Code", descricao: "Aqui estará uma descrição breve do badge", requisitos: 5, learningPath: "Jornada Técnica", serviceLine: "Hybrid Systems" },
    { id: 2, nome: "Low Code", descricao: "Aqui estará uma descrição breve do badge", requisitos: 5, learningPath: "Jornada Técnica", serviceLine: "Hybrid Systems" },
    { id: 3, nome: "Low Code", descricao: "Aqui estará uma descrição breve do badge", requisitos: 5, learningPath: "Jornada Técnica", serviceLine: "Hybrid Systems" },
    { id: 4, nome: "Low Code", descricao: "Aqui estará uma descrição breve do badge", requisitos: 5, learningPath: "Jornada Técnica", serviceLine: "Hybrid Systems" },
    { id: 5, nome: "Low Code", descricao: "Aqui estará uma descrição breve do badge", requisitos: 5, learningPath: "Jornada Técnica", serviceLine: "Hybrid Systems" },
  ];

  return (
    <div className="p-4" style={{ backgroundColor: "var(--fundo)", minHeight: "100%" }}>      
      {/* 1. Cabeçalho: Título e Botões */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-4">
          <h2 className="m-0 fw-bold" style={{ color: "var(--fontes)" }}>Galeria</h2>
          
          {/* Botões Toggle Vista */}
          <div className="btn-group" role="group">
            <button 
              type="button" 
              className={`btn ${vistaAtiva === 'galeria' ? 'btn-primary' : 'btn-outline-secondary bg-white text-dark'}`}
              onClick={() => setVistaAtiva('galeria')}
            >
              <i className="fi fi-br-grid mx-2"></i> Galeria
            </button>
            <button 
              type="button" 
              className={`btn ${vistaAtiva === 'tabela' ? 'btn-primary' : 'btn-outline-secondary bg-white text-dark'}`}
              style={vistaAtiva === 'tabela' ? { backgroundColor: "var(--barra_lateral)", borderColor: "var(--barra_lateral)" } : {}}
              onClick={() => setVistaAtiva('tabela')}
            >
              <i className="fi fi-br-list mx-2"></i> Tabela
            </button>
          </div>
        </div>
        
        <button className="btn text-white px-4" style={{ backgroundColor: "var(--barra_lateral)" }}>
          Exportar
        </button>
      </div>

      {/* 2. Barra de Pesquisa e Filtros */}
      <div className="d-flex gap-3 mb-4">
        <div className="input-group flex-grow-1 shadow-sm rounded">
          <span className="input-group-text bg-white border-end-0">
            <i className="fi fi-br-search"></i>
          </span>
          <input type="text" className="form-control border-start-0" placeholder="Pesquisar Utilizador..." />
          <select className="form-select border-start-0 text-muted" style={{ maxWidth: "200px" }}>
            <option>Mais recentes</option>
            <option>Mais antigos</option>
          </select>
        </div>
        <button className="btn text-white px-4 d-flex align-items-center gap-2 shadow-sm" style={{ backgroundColor: "var(--barra_lateral)" }}>
          <i className="fi fi-br-filter"></i> Filtrar
        </button>
      </div>

      {/* 3. Cartões de Estatísticas */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1 small">Total de Badges</p>
                <h3 className="m-0" style={{ color: "var(--fontes)" }}>10</h3>
              </div>
              <i className="fi fi-br-badge fs-2 text-muted"></i>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1 small">Áreas</p>
                <h3 className="m-0" style={{ color: "var(--fontes)" }}>1</h3>
              </div>
              <i className="fi fi-br-crosshair fs-2 text-muted"></i>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1 small">Service Lines</p>
                <h3 className="m-0" style={{ color: "var(--fontes)" }}>4</h3>
              </div>
              <i className="fi fi-br-map fs-2 text-muted"></i>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Secção da Tabela */}
      <h4 className="mb-3" style={{ color: "var(--fontes)" }}>Todos:</h4>
      <div className="card border border-light-subtle rounded-4 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: "#F4F7FC" }}>
              <tr>
                <th className="border-0 py-3 text-secondary ps-4">Badge</th>
                <th className="border-0 py-3 text-secondary">Nome</th>
                <th className="border-0 py-3 text-secondary">Descrição</th>
                <th className="border-0 py-3 text-secondary text-center">Requisitos</th>
                <th className="border-0 py-3 text-secondary">Learning Path</th>
                <th className="border-0 py-3 text-secondary">Service Line</th>
              </tr>
            </thead>
            <tbody>
              {badgesData.map((item, index) => (
                <tr key={index}>
                  <td className="ps-4 py-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: "35px", height: "35px", backgroundColor: "#D9DFF7", color: "#6074D4" }}>
                      <i className="fi fi-br-coffee"></i>
                    </div>
                  </td>
                  <td className="text-muted small">{item.nome}</td>
                  <td className="text-muted small">{item.descricao}</td>
                  <td className="text-muted small text-center">{item.requisitos}</td>
                  <td className="text-muted small">{item.learningPath}</td>
                  <td className="text-muted small">{item.serviceLine}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Paginação */}
        <div className="card-footer bg-white border-top-0 d-flex justify-content-between align-items-center py-3 px-4">
          <span className="text-muted small">A mostrar 1-5 de 10 badges</span>
          <div className="btn-group gap-1">
            <button className="btn btn-outline-secondary btn-sm rounded text-muted bg-white">Anterior</button>
            <button className="btn btn-sm rounded text-white" style={{ backgroundColor: "var(--barra_lateral)" }}>1</button>
            <button className="btn btn-outline-secondary btn-sm rounded text-muted bg-white">2</button>
            <button className="btn btn-outline-secondary btn-sm rounded text-muted bg-white">Próximo</button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Galeria;