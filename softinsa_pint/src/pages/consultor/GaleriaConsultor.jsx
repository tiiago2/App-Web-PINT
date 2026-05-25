import "./GaleriaConsultor.css";

function GaleriaConsultor() {
  return (
    <main className="galeria-consultor-page">
      <div className="galeria-consultor-header">
        <h1>Galeria de Badges</h1>
      </div>

      <section className="galeria-toolbar">
        <input
          type="text"
          placeholder="Pesquisar Badge..."
          className="galeria-search"
        />

        <button className="galeria-toolbar-btn">
          Ordenar
        </button>

        <button className="galeria-toolbar-btn">
          Filtrar
        </button>
      </section>

      <section className="galeria-status-tabs">
        <button className="status-tab ativo">Todos</button>
        <button className="status-tab">Em Progresso</button>
        <button className="status-tab">Aprovado</button>
        <button className="status-tab">Pendente</button>
        <button className="status-tab">Bloqueado</button>
        <button className="status-tab">Recusado</button>
        <button className="status-tab">Expirado</button>
      </section>
    </main>
  );
}

export default GaleriaConsultor;