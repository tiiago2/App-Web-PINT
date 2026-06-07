import React, { useState } from 'react';
import BarraPesquisa from "../../components/ui/BarraPesquisa/BarraPesquisa";
import BotaoDropdown from "../../components/ui/BotaoDropdown/BotaoDropdown";
import './Galeria.css';

function Galeria() {
  // Estados
  const [vistaAtiva, setVistaAtiva] = useState('tabela');
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [ordenacao, setOrdenacao] = useState('recentes');

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;

  const [mostrarExportar, setMostrarExportar] = useState(false); // Controla se o pop-up está aberto
  const [formatoExport, setFormatoExport] = useState('csv'); // Guarda o formato (csv ou pdf)
  const [opcaoExport, setOpcaoExport] = useState('atual'); // Guarda o que exportar (atual, todas, selecao)
  const [intervaloPaginas, setIntervaloPaginas] = useState(''); // Guarda o texto "1-3"

  // Dados falsos expandidos (para podermos testar a paginação)
  const badgesData = [
    { id: 1, nome: "Low Code", descricao: "Aqui estará uma descrição breve do badge", requisitos: 5, learningPath: "Jornada Técnica", serviceLine: "Hybrid Systems", data: "2024-03-20" },
    { id: 2, nome: "Agile Master", descricao: "Metodologias ágeis e gestão de projetos", requisitos: 3, learningPath: "Jornada de Gestão", serviceLine: "Consulting", data: "2024-03-15" },
    { id: 3, nome: "Cloud Native", descricao: "Desenvolvimento cloud e arquiteturas", requisitos: 7, learningPath: "Jornada Técnica", serviceLine: "Cloud Solutions", data: "2024-03-25" },
    { id: 4, nome: "Data Hero", descricao: "Análise de dados e visualização", requisitos: 4, learningPath: "Jornada de Dados", serviceLine: "Data & AI", data: "2024-02-10" },
    { id: 5, nome: "Cyber Sec", descricao: "Fundamentos de cibersegurança", requisitos: 6, learningPath: "Jornada Técnica", serviceLine: "Security", data: "2024-03-01" },
    { id: 6, nome: "UX/UI Pro", descricao: "Design de interfaces e experiência", requisitos: 5, learningPath: "Jornada de Design", serviceLine: "Digital", data: "2024-01-20" },
    { id: 7, nome: "DevOps Eng", descricao: "Automação de pipelines e infraestrutura", requisitos: 8, learningPath: "Jornada Técnica", serviceLine: "Cloud Solutions", data: "2024-03-28" },
    { id: 8, nome: "Soft Skills", descricao: "Comunicação e liderança", requisitos: 2, learningPath: "Jornada Pessoal", serviceLine: "Cross-Service", data: "2024-02-25" },
  ];

  // 1. Lógica de Filtragem e Ordenação
  // 1. Lógica de Filtragem e Ordenação
  const badgesFiltrados = badgesData
    .filter((badge) => {
      return badge.nome.toLowerCase().includes(termoPesquisa.toLowerCase()) || 
             badge.descricao.toLowerCase().includes(termoPesquisa.toLowerCase());
    })
    .sort((a, b) => {
      // Se for A-Z, ordena pelo nome
      if (ordenacao === 'az') {
        return a.nome.localeCompare(b.nome);
      } 
      // Caso contrário, ordena por datas
      else {
        const dataA = new Date(a.data);
        const dataB = new Date(b.data);
        return ordenacao === 'recentes' ? dataB - dataA : dataA - dataB;
      }
    });

  // Sempre que a pesquisa muda, voltamos à página 1 para não haver bugs de páginas vazias
  React.useEffect(() => {
    setPaginaAtual(1);
  }, [termoPesquisa]);

  // 2. Lógica de Estatísticas Dinâmicas
  const totalBadges = badgesData.length;
  const totalAreas = new Set(badgesData.map(b => b.learningPath)).size;
  const totalServiceLines = new Set(badgesData.map(b => b.serviceLine)).size;

  // 3. Lógica de Paginação
  const indexUltimoItem = paginaAtual * itensPorPagina;
  const indexPrimeiroItem = indexUltimoItem - itensPorPagina;
  // Os itens que vão efetivamente ser desenhados no ecrã:
  const itensAtuais = badgesFiltrados.slice(indexPrimeiroItem, indexUltimoItem);
  const totalPaginas = Math.ceil(badgesFiltrados.length / itensPorPagina);

  return (
    <div className="galeria-container w-100">      
      {/* 1. Cabeçalho: Título e Botões */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-4">
          <h1 className="texto-titulo-principal m-0">Galeria</h1>
          
          <div className="btn-group shadow-sm" role="group">
            <button 
              type="button" 
              className="btn"
              style={{
                backgroundColor: vistaAtiva === 'galeria' ? "var(--barra_lateral)" : "var(--fundo)",
                color: vistaAtiva === 'galeria' ? "var(--fundo)" : "var(--fontes)",
                borderColor: "var(--contorno)"
              }}
              onClick={() => setVistaAtiva('galeria')}
            >
              <i className="fi fi-br-grid mx-2"></i> Galeria
            </button>
            <button 
              type="button" 
              className="btn"
              style={{
                backgroundColor: vistaAtiva === 'tabela' ? "var(--barra_lateral)" : "var(--fundo)",
                color: vistaAtiva === 'tabela' ? "var(--fundo)" : "var(--fontes)",
                borderColor: "var(--contorno)"
              }}
              onClick={() => setVistaAtiva('tabela')}
            >
              <i className="fi fi-br-list mx-2"></i> Tabela
            </button>
          </div>
        </div>
        
        <button 
          className="btn px-4 shadow-sm" 
          style={{ backgroundColor: "var(--barra_lateral)", color: "var(--fundo)" }}
          onClick={() => setMostrarExportar(true)} // <-- ADICIONA ISTO
        >
          Exportar
        </button>
      </div>

      {/* --- POP-UP DE EXPORTAÇÃO (MODAL) --- */}
      {mostrarExportar && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="card shadow rounded-4 border-0 p-4" style={{ backgroundColor: "var(--fundo)", width: "450px" }}>
            
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="m-0 fw-bold" style={{ color: "var(--fontes)" }}>Exportar Dados</h4>
              <i className="fi fi-br-cross" style={{ cursor: "pointer", color: "var(--fontes)" }} onClick={() => setMostrarExportar(false)}></i>
            </div>

            {/* Escolha do Formato */}
            <div className="mb-4">
              <label className="form-label fw-bold small" style={{ color: "var(--fontes)" }}>Formato do Ficheiro:</label>
              <div className="d-flex gap-3">
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="formato" id="csv" checked={formatoExport === 'csv'} onChange={() => setFormatoExport('csv')} />
                  <label className="form-check-label" htmlFor="csv" style={{ color: "var(--fontes)" }}>CSV (.csv)</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="formato" id="pdf" checked={formatoExport === 'pdf'} onChange={() => setFormatoExport('pdf')} />
                  <label className="form-check-label" htmlFor="pdf" style={{ color: "var(--fontes)" }}>PDF (.pdf)</label>
                </div>
              </div>
            </div>

            {/* Escolha do Conteúdo */}
            <div className="mb-4">
              <label className="form-label fw-bold small" style={{ color: "var(--fontes)" }}>Conteúdo a Exportar:</label>
              
              <div className="form-check mb-2">
                <input className="form-check-input" type="radio" name="conteudo" id="atual" checked={opcaoExport === 'atual'} onChange={() => setOpcaoExport('atual')} />
                <label className="form-check-label" htmlFor="atual" style={{ color: "var(--fontes)" }}>Página Atual</label>
              </div>

              <div className="form-check mb-2">
                <input className="form-check-input" type="radio" name="conteudo" id="todas" checked={opcaoExport === 'todas'} onChange={() => setOpcaoExport('todas')} />
                <label className="form-check-label" htmlFor="todas" style={{ color: "var(--fontes)" }}>Todas as Páginas</label>
              </div>

              <div className="form-check d-flex align-items-center gap-2">
                <input className="form-check-input" type="radio" name="conteudo" id="selecao" checked={opcaoExport === 'selecao'} onChange={() => setOpcaoExport('selecao')} />
                <label className="form-check-label" htmlFor="selecao" style={{ color: "var(--fontes)" }}>Selecionar Páginas:</label>
                {opcaoExport === 'selecao' && (
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    placeholder="Ex: 1-3" 
                    style={{ width: "80px", backgroundColor: "var(--fundo)", borderColor: "var(--contorno)", color: "var(--fontes)" }}
                    value={intervaloPaginas}
                    onChange={(e) => setIntervaloPaginas(e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="d-flex justify-content-end gap-2 mt-2">
              <button 
                className="btn btn-light px-4" 
                style={{ color: "var(--fontes)", border: "1px solid var(--contorno)" }}
                onClick={() => setMostrarExportar(false)}
                >
                Cancelar
              </button>
              <button 
                className="btn px-4" 
                style={{ backgroundColor: "var(--barra_lateral)", color: "var(--fundo)" }}
                onClick={() => {
                  alert(`A exportar em ${formatoExport.toUpperCase()}...`); // Aqui no futuro ligas à função real
                  setMostrarExportar(false);
                }}
              >
                Confirmar
              </button>
            </div>

          </div>
        </div>
      )}
            {/* --- REVER ESTE POP-UP --- */}


      {/* 2. Barra de Pesquisa e Filtros */}
      <div className="d-flex flex-column flex-xl-row gap-3 mb-4">
        <div className="flex-grow-1">
          <BarraPesquisa 
            valor={termoPesquisa} 
            onChange={setTermoPesquisa} 
            placeholder="Pesquisar Badge..." 
          />
        </div>
        
        <div style={{ minWidth: '180px' }}>
          <BotaoDropdown 
            titulo="Ordenar por"
            valor={ordenacao}
            opcoes={[
              { valor: 'recentes', label: 'Mais recentes' },
              { valor: 'antigos', label: 'Mais antigos' },
              { valor: 'az', label: 'A-Z' }
            ]}
            onChange={setOrdenacao}
          />
        </div>

        <div>
          <BotaoDropdown
            titulo="Filtrar"
            valor=""
            opcoes={[
              { valor: "", label: "Todos" },
              { valor: "area", label: "Área" },
              { valor: "serviceLine", label: "Service Line" },
              { valor: "learningPath", label: "Learning Path" },
            ]}
            onChange={() => {}}
            icone="fi fi-br-filter"
            mostrarValor={false}
            mostrarSeta={false}
          />
        </div>
      </div>

      {/* 3. Cartões de Estatísticas */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3" style={{ backgroundColor: "var(--fundo)", border: "1px solid var(--contorno)" }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="mb-1 small" style={{ color: "var(--fontes)", opacity: 0.7 }}>Total de Badges</p>
                <h3 className="m-0" style={{ color: "var(--fontes)" }}>{totalBadges}</h3>
              </div>
              <i className="fi fi-br-badge fs-2" style={{ color: "var(--fontes)" }}></i>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3" style={{ backgroundColor: "var(--fundo)", border: "1px solid var(--contorno)" }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="mb-1 small" style={{ color: "var(--fontes)", opacity: 0.7 }}>Áreas</p>
                <h3 className="m-0" style={{ color: "var(--fontes)" }}>{totalAreas}</h3>
              </div>
              <i className="fi fi-br-target fs-2" style={{ color: "var(--fontes)" }}></i>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3" style={{ backgroundColor: "var(--fundo)", border: "1px solid var(--contorno)" }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="mb-1 small" style={{ color: "var(--fontes)", opacity: 0.7 }}>Service Lines</p>
                <h3 className="m-0" style={{ color: "var(--fontes)" }}>{totalServiceLines}</h3>
              </div>
              <i className="fi fi-br-map fs-2" style={{ color: "var(--fontes)" }}></i>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Secção da Tabela / Galeria */}
      <h4 className="mb-3" style={{ color: "var(--fontes)" }}>Todos:</h4>
      <div className="card rounded-4 shadow-sm overflow-hidden" style={{ backgroundColor: "var(--fundo)", border: "1px solid var(--contorno)" }}>
        
        {vistaAtiva === 'tabela' ? (
          /* --- VISTA DE TABELA --- */
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ backgroundColor: "var(--fundo)", borderBottom: "1px solid var(--contorno)" }}>
                <tr>
                  <th className="border-0 py-3 ps-4" style={{ color: "var(--fontes)", fontWeight: "bold" }}>Badge</th>
                  <th className="border-0 py-3" style={{ color: "var(--fontes)", fontWeight: "bold" }}>Nome</th>
                  <th className="border-0 py-3" style={{ color: "var(--fontes)", fontWeight: "bold" }}>Descrição</th>
                  <th className="border-0 py-3 text-center" style={{ color: "var(--fontes)", fontWeight: "bold" }}>Requisitos</th>
                  <th className="border-0 py-3" style={{ color: "var(--fontes)", fontWeight: "bold" }}>Learning Path</th>
                  <th className="border-0 py-3" style={{ color: "var(--fontes)", fontWeight: "bold" }}>Service Line</th>
                </tr>
              </thead>
              <tbody>
                {/* Aqui fazemos map dos itensAtuais e não dos badgesFiltrados totais */}
                {itensAtuais.map((item, index) => (
                  <tr key={index}>
                    <td className="ps-4 py-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: "35px", height: "35px", backgroundColor: "var(--selecao)", color: "var(--barra_lateral)" }}>
                        <i className="fi fi-br-coffee"></i>
                      </div>
                    </td>
                    <td className="small" style={{ color: "var(--fontes)" }}>{item.nome}</td>
                    <td className="small" style={{ color: "var(--fontes)" }}>{item.descricao}</td>
                    <td className="small text-center" style={{ color: "var(--fontes)" }}>{item.requisitos}</td>
                    <td className="small" style={{ color: "var(--fontes)" }}>{item.learningPath}</td>
                    <td className="small" style={{ color: "var(--fontes)" }}>{item.serviceLine}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* --- VISTA DE GRELHA (GALERIA) --- */
          <div className="p-4 bg-light bg-opacity-10">
            <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
              {/* Aqui fazemos map dos itensAtuais também */}
              {itensAtuais.map((item, index) => (
                <div className="col" key={index}>
                  <div className="card h-100 shadow-sm rounded-4 border-0" style={{ backgroundColor: "var(--fundo)", border: "1px solid var(--contorno) !important" }}>
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex align-items-center mb-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "45px", height: "45px", backgroundColor: "var(--selecao)", color: "var(--barra_lateral)" }}>
                          <i className="fi fi-br-coffee fs-5"></i>
                        </div>
                        <div>
                          <h5 className="card-title m-0 fw-bold" style={{ color: "var(--fontes)" }}>{item.nome}</h5>
                          <small style={{ color: "var(--fontes)", opacity: 0.7 }}>{item.learningPath}</small>
                        </div>
                      </div>
                      <p className="card-text small flex-grow-1" style={{ color: "var(--fontes)" }}>
                        {item.descricao}
                      </p>
                      <div className="d-flex justify-content-between align-items-center mt-3 pt-3" style={{ borderTop: "1px dashed var(--contorno)" }}>
                        <span className="badge rounded-pill fw-normal px-3 py-2" style={{ backgroundColor: "var(--selecao)", color: "var(--barra_lateral)" }}>
                          {item.serviceLine}
                        </span>
                        <div className="d-flex align-items-center gap-1" style={{ color: "var(--fontes)", opacity: 0.8 }}>
                          <i className="fi fi-br-list-check small"></i>
                          <small>{item.requisitos} reqs</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Paginação Dinâmica */}
        <div className="card-footer d-flex justify-content-between align-items-center py-3 px-4" style={{ backgroundColor: "var(--fundo)", borderTop: "1px solid var(--contorno)" }}>
          <span className="small" style={{ color: "var(--fontes)", opacity: 0.8 }}>
            A mostrar {badgesFiltrados.length === 0 ? 0 : indexPrimeiroItem + 1}-{Math.min(indexUltimoItem, badgesFiltrados.length)} de {badgesFiltrados.length} badges
          </span>
          <div className="btn-group gap-1">
            <button 
              className="btn btn-sm rounded" 
              style={{ backgroundColor: "var(--fundo)", color: "var(--fontes)", border: "1px solid var(--contorno)" }}
              onClick={() => setPaginaAtual(paginaAtual - 1)}
              disabled={paginaAtual === 1}
            >
              Anterior
            </button>

            {/* Gera os botões de números das páginas consoante o total de páginas */}
            {[...Array(totalPaginas)].map((_, i) => (
              <button 
                key={i + 1}
                className="btn btn-sm rounded" 
                style={{ 
                  backgroundColor: paginaAtual === i + 1 ? "var(--barra_lateral)" : "var(--fundo)", 
                  color: paginaAtual === i + 1 ? "var(--fundo)" : "var(--fontes)", 
                  border: paginaAtual === i + 1 ? "1px solid var(--barra_lateral)" : "1px solid var(--contorno)" 
                }}
                onClick={() => setPaginaAtual(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button 
              className="btn btn-sm rounded" 
              style={{ backgroundColor: "var(--fundo)", color: "var(--fontes)", border: "1px solid var(--contorno)" }}
              onClick={() => setPaginaAtual(paginaAtual + 1)}
              disabled={paginaAtual === totalPaginas || totalPaginas === 0}
            >
              Próximo
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Galeria;