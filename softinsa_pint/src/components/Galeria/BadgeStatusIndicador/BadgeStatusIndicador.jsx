import "./BadgeStatusIndicador.css";

const MAPA_ESTADOS_BADGE = {
  conquistados: {
    icone: "fi-br-check",
    classe: "conquistado",
  },
  pendentes: {
    icone: "fi-br-clock",
    classe: "pendente",
  },
  recusados: {
    icone: "fi-br-cross-small",
    classe: "recusado",
  },
  expirados: {
    icone: "fi-br-time-past",
    classe: "expirado",
  },
  bloqueados: {
    icone: "fi-br-lock",
    classe: "bloqueado",
  },
};

function BadgeStatusIndicador({ estado }) {
  const configuracao = MAPA_ESTADOS_BADGE[estado];

  if (!configuracao) {
    return null;
  }

  return (
    <span
      className={`badge-status-indicador badge-status-indicador-${configuracao.classe}`}
      aria-hidden="true"
    >
      <i className={`fi ${configuracao.icone}`}></i>
    </span>
  );
}

export default BadgeStatusIndicador;