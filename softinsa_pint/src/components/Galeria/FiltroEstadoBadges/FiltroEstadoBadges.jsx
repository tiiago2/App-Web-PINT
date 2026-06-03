import "./FiltroEstadoBadges.css";

function FiltroEstadoBadges({ opcoes, valorAtivo, onChange, contagens = {} }) {
  return (
    <nav
      className="filtro-estado-badges d-flex flex-wrap align-items-center"
      aria-label="Filtrar badges por estado"
    >
      {opcoes.map((opcao) => {
        const estaAtivo = valorAtivo === opcao.valor;
        const total = contagens[opcao.valor] ?? 0;

        return (
          <button
            key={opcao.valor}
            type="button"
            className={`filtro-estado-botao ${estaAtivo ? "ativo" : ""}`}
            onClick={() => onChange(opcao.valor)}
          >
            <span
              className={`filtro-estado-label ${
                estaAtivo
                  ? "texto-filtro-estado-label-ativo"
                  : "texto-filtro-estado-label"
              }`}
            >
              {opcao.label}
            </span>

            <span className="filtro-estado-contador texto-filtro-estado-contador">
              {total}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default FiltroEstadoBadges;