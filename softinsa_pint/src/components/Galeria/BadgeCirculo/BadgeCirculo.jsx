import { useId } from "react";
import "./BadgeCirculo.css";

function BadgeCirculo({
  imagemBadge,
  icone = "fi-br-badge",
  nomeBadge = "Badge",
  estado,
  especial = false,
  tipoEspecial = null,
  corBg = null,
}) {
  const idGradiente = useId().replace(/:/g, "");
  const bloqueado = estado === "bloqueados";
  const temImagem = Boolean(imagemBadge);

  const deveMostrarEspecial = especial && tipoEspecial && !bloqueado;

  const classes = [
    "badge-circulo",
    temImagem ? "badge-circulo-com-imagem" : "badge-circulo-sem-imagem",
    bloqueado ? "badge-circulo-bloqueado" : "",
    deveMostrarEspecial ? "badge-circulo-especial" : "",
    deveMostrarEspecial ? `badge-circulo-especial-${tipoEspecial}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Estilo simulado para recriar o visual dos badges PNG usando apenas CSS
  const estiloAdmin = corBg && !temImagem ? { 
    backgroundColor: corBg, 
    border: "none",
  } : {};

  return (
    <div className={classes}>
      <div className="badge-circulo-conteudo" style={estiloAdmin}>
        {temImagem ? (
          <img
            src={imagemBadge}
            alt={`Imagem do badge ${nomeBadge}`}
            className="badge-circulo-imagem"
          />
        ) : (
          <i className={`fi ${icone} badge-circulo-icone`} aria-hidden="true" style={corBg && !temImagem ? { color: 'rgba(0,0,0,0.45)' } : {}} />
        )}
      </div>

      {deveMostrarEspecial && (
        <span className="badge-circulo-estrela" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="12" cy="12" r="12" fill={`url(#${idGradiente})`} />
            <path
              d="M11.0489 4.92705C11.3483 4.00574 12.6517 4.00574 12.9511 4.92705L14.0206 8.21885C14.1545 8.63087 14.5385 8.90983 14.9717 8.90983H18.4329C19.4016 8.90983 19.8044 10.1494 19.0207 10.7188L16.2205 12.7533C15.87 13.0079 15.7234 13.4593 15.8572 13.8713L16.9268 17.1631C17.2261 18.0844 16.1717 18.8506 15.388 18.2812L12.5878 16.2467C12.2373 15.9921 11.7627 15.9921 11.4122 16.2467L8.61204 18.2812C7.82833 18.8506 6.77385 18.0844 7.0732 17.1631L8.14277 13.8713C8.27665 13.4593 8.12999 13.0079 7.7795 12.7533L4.97933 10.7188C4.19562 10.1494 4.59839 8.90983 5.56712 8.90983H9.02832C9.46154 8.90983 9.8455 8.63087 9.97937 8.21885L11.0489 4.92705Z"
              fill="white"
            />
            <defs>
              <linearGradient
                id={idGradiente}
                x1="12"
                y1="0"
                x2="12"
                y2="24"
                gradientUnits="userSpaceOnUse"
              >
                {tipoEspecial === "silver" ? (
                  <>
                    <stop stopColor="var(--silver_badge_inicio)" />
                    <stop offset="1" stopColor="var(--silver_badge_fim)" />
                  </>
                ) : (
                  <>
                    <stop stopColor="var(--gold_badge_inicio)" />
                    <stop offset="1" stopColor="var(--gold_badge_fim)" />
                  </>
                )}
              </linearGradient>
            </defs>
          </svg>
        </span>
      )}
    </div>
  );
}

export default BadgeCirculo;