import { useEffect, useMemo, useState } from "react";
import CardBadgeSugerido from "../CardBadgeSugerido/CardBadgeSugerido";
import { obterSugestoesBadgesConsultor } from "../../../services/badgesService";
import "./GaleriaSugeridos.css";

function obterIdBadge(badge = {}) {
  return badge.id_badge ?? badge.idBadge ?? badge.id;
}

function enriquecerSugestao(sugestao, badges) {
  const idBadge =
    sugestao.id_badge ??
    sugestao.idBadge ??
    sugestao.ID_BADGE;
  const badge = badges.find(
    (item) => Number(obterIdBadge(item)) === Number(idBadge)
  );

  if (!badge) {
    return null;
  }

  return {
    ...badge,
    justificacao:
      sugestao.justificacao ||
      "Sugestao personalizada para si.",
  };
}

function GaleriaSugeridos({
  badges = [],
  onBadgeClick,
  onBadgesSugeridosChange,
}) {
  const [sugestoes, setSugestoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarSugestoes() {
      setIsLoading(true);
      setErro("");

      try {
        const resposta = await obterSugestoesBadgesConsultor();

        if (ativo) {
          setSugestoes(resposta.sugestoes);
        }
      } catch (error) {
        console.error("Erro ao carregar sugestoes de badges:", error);

        if (ativo) {
          setErro("Nao foi possivel carregar as sugestoes de badges.");
          setSugestoes([]);
        }
      } finally {
        if (ativo) {
          setIsLoading(false);
        }
      }
    }

    carregarSugestoes();

    return () => {
      ativo = false;
    };
  }, []);

  const badgesSugeridos = useMemo(
    () => {
      const badgesReais = Array.isArray(badges) ? badges : [];

      return sugestoes
        .map((sugestao) => enriquecerSugestao(sugestao, badgesReais))
        .filter(Boolean)
        .slice(0, 8);
    },
    [sugestoes, badges]
  );

  useEffect(() => {
    onBadgesSugeridosChange?.(badgesSugeridos);
  }, [badgesSugeridos, onBadgesSugeridosChange]);

  if (isLoading) {
    return (
      <section className="galeria-sugeridos">
        <p className="texto-nome-badge galeria-sugeridos-vazio">
          A carregar sugestoes...
        </p>
      </section>
    );
  }

  if (erro) {
    return (
      <section className="galeria-sugeridos">
        <p className="texto-nome-badge galeria-sugeridos-vazio">
          {erro}
        </p>
      </section>
    );
  }

  return (
    <section className="galeria-sugeridos">
      {badgesSugeridos.length === 0 ? (
        <p className="texto-nome-badge galeria-sugeridos-vazio">
          Ainda nao existem badges sugeridos para apresentar.
        </p>
      ) : (
        <div className="galeria-sugeridos-grid">
          {badgesSugeridos.map((badge) => (
            <CardBadgeSugerido
              key={obterIdBadge(badge)}
              badge={badge}
              onBadgeClick={onBadgeClick}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default GaleriaSugeridos;
