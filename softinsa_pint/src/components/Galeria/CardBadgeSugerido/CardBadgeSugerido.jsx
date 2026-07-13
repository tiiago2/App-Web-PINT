import { useTranslation } from "react-i18next";
import BadgeCirculo from "../BadgeCirculo/BadgeCirculo";
import BadgeProgresso from "../BadgeProgresso/BadgeProgresso";
import BadgeStatusIndicador from "../BadgeStatusIndicador/BadgeStatusIndicador";
import "./CardBadgeSugerido.css";

const ICONE_ESTADO = {
  conquistados: "fi-br-check",
  emProgresso: "fi-br-star",
  pendentes: "fi-br-clock",
  expirados: "fi-br-time-past",
  recusados: "fi-br-cross",
  bloqueados: "fi-br-lock",
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

function EstadoResumo({ estado, progresso, label }) {
  const icone = ICONE_ESTADO[estado] || "fi-br-badge";

  if (estado === "emProgresso") {
    const progressoSeguro = Math.max(0, Math.min(100, Number(progresso) || 0));

    return (
      <div
        className="card-badge-sugerido-progresso"
        aria-label={`${label} ${progressoSeguro}%`}
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
  const { t } = useTranslation();

  const LABEL_ESTADO = {
    conquistados: t("estado_conquistado"),
    emProgresso: t("em_progresso"),
    pendentes: t("estado_pendente"),
    expirados: t("estado_expirado"),
    recusados: t("estado_recusado"),
    bloqueados: t("estado_bloqueado"),
  };

  const LABEL_ACAO = {
    conquistados: t("acao_ver_detalhes"),
    emProgresso: t("acao_continuar"),
    pendentes: t("acao_ver_candidatura"),
    expirados: t("acao_renovar"),
    recusados: t("acao_ver_feedback"),
    bloqueados: t("acao_ver_requisitos"),
  };

  if (!badge) {
    return null;
  }

  const estado = badge.estado || "pendentes";
  const nomeBadge = badge.nomeBadge || badge.nome || "Badge";
  const pontosBadge = badge.pontosBadge ?? badge.pontos ?? 0;
  const descricao = badge.descricao || badge.descricaoBadge || "";
  const labelAcao = LABEL_ACAO[estado] || t("acao_ver_detalhes");
  const labelEstado = LABEL_ESTADO[estado] || "Badge";

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
      aria-label={`${t("badge_sugerido")} ${nomeBadge}`}
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
          {badge.justificacao || t("sugestao_personalizada")}
        </p>

        <div className="card-badge-sugerido-rodape">
          <div className="card-badge-sugerido-estado">
            <EstadoResumo estado={estado} progresso={badge.progresso} label={labelEstado} />
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
              {t("sobre_este_badge")}
            </p>
            <p className="card-badge-sugerido-expansor-texto">{descricao}</p>
          </div>
        </div>
      )}
    </article>
  );
}

export default CardBadgeSugerido;
