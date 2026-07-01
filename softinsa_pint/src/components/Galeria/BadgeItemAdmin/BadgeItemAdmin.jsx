import BadgeItem from "../BadgeItem/BadgeItem";
import "./BadgeItemAdmin.css";

function obterNomeBadge(badge) {
  return badge.nomeBadge || badge.nome_badge || badge.nome || "badge";
}

function BadgeItemAdmin({
  badge,
  onEdit,
  onDelete,
  onBadgeClick,
}) {
  if (!badge) {
    return null;
  }

  const nomeBadge = obterNomeBadge(badge);

  return (
    <div className="badge-item-admin">
      <BadgeItem
        badge={badge}
        mostrarEstado={false}
        onBadgeClick={onBadgeClick}
      />

      <div className="badge-item-admin-acoes">
        <button
          type="button"
          className="badge-item-admin-acao badge-item-admin-acao-editar"
          title="Editar badge"
          aria-label={`Editar badge ${nomeBadge}`}
          onClick={(event) => {
            event.stopPropagation();

            if (onEdit) {
              onEdit(badge);
            }
          }}
        >
          <i className="fi fi-br-pencil"></i>
        </button>

        <button
          type="button"
          className="badge-item-admin-acao badge-item-admin-acao-eliminar"
          title="Eliminar badge"
          aria-label={`Eliminar badge ${nomeBadge}`}
          onClick={(event) => {
            event.stopPropagation();

            if (onDelete) {
              onDelete(badge);
            }
          }}
        >
          <i className="fi fi-br-trash"></i>
        </button>
      </div>
    </div>
  );
}

export default BadgeItemAdmin;