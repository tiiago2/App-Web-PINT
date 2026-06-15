import BadgeCirculo from "../BadgeCirculo/BadgeCirculo";
import BadgeProgresso from "../BadgeProgresso/BadgeProgresso";
import BadgeStatusIndicador from "../BadgeStatusIndicador/BadgeStatusIndicador";
import "./CardBadgeSugerido.css";

const LABEL_ESTADO = {
  conquistados: "Conquistado",
  emProgresso: "Em progresso",
  pendentes: "Pendente",
  expirados: "Expirado",
  recusados: "Recusado",
  bloqueados: "Bloqueado",
};

const ICONE_ESTADO = {
  conquistados: "fi-br-check",
  emProgresso: "fi-br-star",
  pendentes: "fi-br-clock",
  expirados: "fi-br-time-past",
  recusados: "fi-br-cross",
  bloqueados: "fi-br-lock",
};

const LABEL_ACAO = {
  conquistados: "Ver detalhes",
  emProgresso: "Continuar",
  pendentes: "Ver candidatura",
  expirados: "Renovar",
  recusados: "Ver feedback",
  bloqueados: "Ver requisitos",
};

function PontosPill({ pontos }) {
  return (
    <span className="card-badge-sugerido-pontos" aria-label={`${pontos} pontos`}>
      <span className="card-badge-sugerido-pontos-numero">{pontos}</span>
      <span className="card-badge-sugerido-pontos-label">pts</span>
    </span>
  );
}

function MetaLinha({ badge }) {
  const partes = [badge.nomeArea, badge.learningPath, badge.nivel].filter(Boolean);

  if (!partes.length) {
    return null;
  }

  return (
    <p className="card-badge-sugerido-meta">
      {partes.map((parte, index) => (
        <span key={`${parte}-${index}`}>
          {parte}
          {index < partes.length - 1 && (
            <span className="card-badge-sugerido-meta-separador"> · </span>
          )}
        </span>
      ))}
    </p>
  );
}

function EstadoResumo({ estado, progresso }) {
  const label = LABEL_ESTADO[estado] || "Badge";
  const icone = ICONE_ESTADO[estado] || "fi-br-badge";

  if (estado === "emProgresso") {
    const progressoSeguro = Math.max(0, Math.min(100, Number(progresso) || 0));

    return (
      <div
        className="card-badge-sugerido-progresso"
        aria-label={`Em progresso ${progressoSeguro}%`}
      >
        <BadgeProgresso progresso={progressoSeguro} />
        <span className="card-badge-sugerido-progresso-numero">
          {progressoSeguro}%
        </span>
      </div>
    );
  }

  return (
    <span className={`card-badge-sugerido-pill card-badge-sugerido-pill-${estado}`}>
      <i className={`fi ${icone}`} aria-hidden="true"></i>
      {label}
    </span>
  );
}

function CardBadgeSugerido({ badge, onBadgeClick }) {
  if (!badge) {
    return null;
  }

  const estado = badge.estado || "pendentes";
  const nomeBadge = badge.nomeBadge || badge.nome || "Badge";
  const pontosBadge = badge.pontosBadge ?? badge.pontos ?? 0;
  const descricao = badge.descricao || badge.descricaoBadge || "";
  const labelAcao = LABEL_ACAO[estado] || "Ver detalhes";

  function handleAcaoClick() {
    if (onBadgeClick) {
      onBadgeClick(badge);
    }
  }

  return (
    <article
      className={`card-badge-sugerido ${
        estado === "bloqueados" ? "card-badge-sugerido-bloqueado" : ""
      }`}
      aria-label={`Badge sugerido ${nomeBadge}`}
    >
      <div className="card-badge-sugerido-visual">
        <BadgeCirculo
          imagemBadge={badge.imagemBadge}
          icone={badge.icone}
          nomeBadge={nomeBadge}
          estado={estado}
          especial={badge.especial}
          tipoEspecial={badge.tipoEspecial}
          corBg={badge.corBg}
        />
        {estado !== "emProgresso" && <BadgeStatusIndicador estado={estado} />}
      </div>

      <div className="card-badge-sugerido-corpo">
        <div className="card-badge-sugerido-topo">
          <div className="card-badge-sugerido-titulos">
            <h2 className="card-badge-sugerido-nome">{nomeBadge}</h2>
            <MetaLinha badge={badge} />
          </div>

          <PontosPill pontos={pontosBadge} />
        </div>

        <p className="card-badge-sugerido-justificacao">
          {badge.justificacao || "Sugestão personalizada para si."}
        </p>

        <div className="card-badge-sugerido-rodape">
          <div className="card-badge-sugerido-estado">
            <EstadoResumo estado={estado} progresso={badge.progresso} />
          </div>

          <button
            type="button"
            className={`card-badge-sugerido-botao ${
              estado === "emProgresso"
                ? "card-badge-sugerido-botao-primario"
                : ""
            } ${
              estado === "expirados"
                ? "card-badge-sugerido-botao-alerta"
                : ""
            }`}
            onClick={handleAcaoClick}
          >
            {labelAcao}
          </button>
        </div>
      </div>

      {descricao && (
        <div className="card-badge-sugerido-expansor">
          <div className="card-badge-sugerido-expansor-inner">
            <p className="card-badge-sugerido-expansor-titulo">
              Sobre este badge
            </p>
            <p className="card-badge-sugerido-expansor-texto">{descricao}</p>
          </div>
        </div>
      )}
    </article>
  );
}

export default CardBadgeSugerido;
