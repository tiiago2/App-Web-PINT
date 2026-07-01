import { Fragment } from "react";
import BadgeItem from "../BadgeItem/BadgeItem";
import "./BadgeSeccao.css";

function obterIdBadge(badge, index) {
  return (
    badge.idBadge ??
    badge.id_badge ??
    badge.id ??
    index
  );
}

function BadgeSeccao({
  titulo,
  tipo = "azul",
  icone = null,
  badges = [],
  mostrarEstado = true,
  onBadgeClick,
  renderBadge,
  children,
}) {
  if (!badges.length && !children) {
    return null;
  }

  return (
    <section className={`badge-seccao badge-seccao-${tipo}`}>
      <div className="badge-seccao-cabecalho">
        {icone && (
          <i
            className={`fi ${icone} badge-seccao-icone`}
            aria-hidden="true"
          ></i>
        )}

        <h2 className="texto-secao-badges badge-seccao-titulo">
          {titulo}
        </h2>

        <span className="badge-seccao-linha" aria-hidden="true"></span>
      </div>

      <div className="badge-seccao-grid">
        {badges.map((badge, index) => {
          const key = obterIdBadge(badge, index);

          if (renderBadge) {
            return (
              <Fragment key={key}>
                {renderBadge(badge)}
              </Fragment>
            );
          }

          return (
            <BadgeItem
              key={key}
              badge={badge}
              mostrarEstado={mostrarEstado}
              onBadgeClick={onBadgeClick}
            />
          );
        })}

        {children}
      </div>
    </section>
  );
}

export default BadgeSeccao;