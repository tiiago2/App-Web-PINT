import CardBadgeSugerido from "../CardBadgeSugerido/CardBadgeSugerido";
import badgesConsultorMock from "../../../data/badgesConsultorMock";
import "./GaleriaSugeridos.css";

const sugestoesBackendMock = [
  {
    idBadge: 10,
    justificacao:
      "Conquistaste este badge recentemente. Vê os detalhes e partilha no teu perfil.",
    descricao:
      "Reconhece competências base em Low Code e serve como ponto de partida para badges de níveis superiores dentro da tua área.",
  },
  {
    idBadge: 11,
    justificacao: "Pronto para o próximo nível? Já tens progresso neste badge.",
    descricao:
      "Este badge aprofunda competências de integração e pode ajudar-te a evoluir no learning path técnico da tua service line.",
  },
  {
    idBadge: 12,
    justificacao:
      "Candidatura submetida. Acompanha a validação para saberes o próximo passo.",
    descricao:
      "Este badge valida fundamentos de cloud e pode reforçar o teu percurso na área de Hybrid Systems.",
  },
  {
    idBadge: 21,
    justificacao:
      "O teu badge expirou. Renova para manteres a certificação ativa.",
    descricao:
      "A renovação mantém a credencial atualizada e evita perder visibilidade sobre competências já reconhecidas.",
  },
  {
    idBadge: 13,
    justificacao:
      "Candidatura recusada. Vê o feedback e tenta novamente com as evidências certas.",
    descricao:
      "Consulta os requisitos e o feedback antes de nova submissão para aumentares a probabilidade de aprovação.",
  },
  {
    idBadge: 14,
    justificacao: "Faltam pré-requisitos para desbloquear este badge.",
    descricao:
      "Este badge fica disponível quando completares os requisitos anteriores do percurso técnico.",
  },
  {
    idBadge: 2,
    justificacao: "Em destaque na plataforma este trimestre.",
    descricao:
      "Badge especial associado a reconhecimento transversal dentro da plataforma de badges da Softinsa.",
  },
  {
    idBadge: 22,
    justificacao:
      "Sugerido com base no teu histórico e nos badges populares da plataforma.",
    descricao:
      "Este badge pode complementar o teu perfil com competências de gestão ágil e delivery.",
  },
];

function enriquecerSugestao(sugestao) {
  const idBadge = sugestao.idBadge ?? sugestao.ID_BADGE;
  const badge = badgesConsultorMock.find((item) => item.idBadge === idBadge);

  if (!badge) {
    return null;
  }

  return {
    ...badge,
    justificacao:
      sugestao.justificacao ||
      sugestao.Justificacao ||
      "Sugestão personalizada para si.",
    descricao: sugestao.descricao || sugestao.Descricao || "",
  };
}

function GaleriaSugeridos({ sugestoes = sugestoesBackendMock, onBadgeClick }) {
  const badgesSugeridos = sugestoes
    .map(enriquecerSugestao)
    .filter(Boolean)
    .slice(0, 8);

  return (
    <section className="galeria-sugeridos">
      {badgesSugeridos.length === 0 ? (
        <p className="texto-nome-badge galeria-sugeridos-vazio">
          Ainda não existem badges sugeridos para apresentar.
        </p>
      ) : (
        <div className="galeria-sugeridos-grid">
          {badgesSugeridos.map((badge) => (
            <CardBadgeSugerido
              key={badge.idBadge}
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
