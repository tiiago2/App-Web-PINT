import BadgeCirculo from "../BadgeCirculo/BadgeCirculo";
import BadgeStatusIndicador from "../BadgeStatusIndicador/BadgeStatusIndicador";
import BadgeProgresso from "../BadgeProgresso/BadgeProgresso";
import "./BadgeItem.css";

function BadgeItem({ badge, mostrarEstado = true, onBadgeClick }) {
  if (!badge) {
    return null;
  }

  const {
    nomeBadge,
    imagemBadge,
    icone,
    estado,
    especial,
    tipoEspecial,
    progresso,
  } = badge;

  const mostrarIndicadorEstado = mostrarEstado && estado !== "emProgresso";
  const mostrarProgresso = mostrarEstado && estado === "emProgresso";

  function handleClick() {
    if (onBadgeClick) {
      onBadgeClick(badge);
    }
  }

  return (
    <button
      type="button"
      className="badge-item"
      onClick={handleClick}
      aria-label={`Abrir badge ${nomeBadge}`}
    >
      <div className="badge-item-visual">
        <BadgeCirculo
          imagemBadge={imagemBadge}
          icone={icone}
          nomeBadge={nomeBadge}
          estado={mostrarEstado ? estado : undefined}
          especial={especial}
          tipoEspecial={tipoEspecial}
        />

        {mostrarIndicadorEstado && <BadgeStatusIndicador estado={estado} />}
      </div>

      <span className="texto-nome-badge badge-item-nome">{nomeBadge}</span>

      {mostrarProgresso && <BadgeProgresso progresso={progresso} />}
    </button>
  );
}

export default BadgeItem;