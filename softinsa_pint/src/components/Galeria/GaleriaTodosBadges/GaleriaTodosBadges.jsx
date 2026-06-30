import { useMemo } from "react";
import BadgeSeccao from "../BadgeSeccao/BadgeSeccao";
import badgesConsultorMock from "../../../data/badgesConsultorMock";
import "./GaleriaTodosBadges.css";

function normalizarTexto(texto = "") {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isBadgeEspecial(badge) {
  return badge.especial === true || badge.grupo === "badgesEspeciais";
}

function badgeCumpreFiltro(badge, filtro) {
  if (!filtro || filtro.tipo === "todos") {
    return true;
  }

  if (filtro.tipo === "learningPath") {
    return badge.learningPath === filtro.valor;
  }

  if (filtro.tipo === "serviceLine") {
    return badge.serviceLine === filtro.valor;
  }

  if (filtro.tipo === "area") {
    return badge.nomeArea === filtro.valor;
  }

  return true;
}

function GaleriaTodosBadges({
  modo = "consultor",
  pesquisa = "",
  ordenacao = "recentes",
  filtro = "",
  estadoAtivo = "todos",
  mostrarEstado = true,
  onBadgeClick,
}) {
  const isConsultor = modo === "consultor";

  const badgesFiltrados = useMemo(() => {
    let lista = [...badgesConsultorMock];

    if (estadoAtivo !== "todos") {
      lista = lista.filter((badge) => badge.estado === estadoAtivo);
    }

    const pesquisaNormalizada = normalizarTexto(pesquisa).trim();

    if (pesquisaNormalizada) {
      lista = lista.filter((badge) => {
        const camposPesquisaveis = [
          badge.nomeBadge,
          badge.nomeArea,
          badge.serviceLine,
          badge.learningPath,
          badge.nivel,
        ];

        return camposPesquisaveis.some((campo) =>
          normalizarTexto(campo).includes(pesquisaNormalizada)
        );
      });
    }

    lista = lista.filter((badge) => badgeCumpreFiltro(badge, filtro));

    switch (ordenacao) {
      case "az":
        lista.sort((a, b) => a.nomeBadge.localeCompare(b.nomeBadge, "pt"));
        break;

      case "za":
        lista.sort((a, b) => b.nomeBadge.localeCompare(a.nomeBadge, "pt"));
        break;

      case "antigos":
        lista.sort(
          (a, b) => new Date(a.dataCriacao) - new Date(b.dataCriacao)
        );
        break;

      case "recentes":
      default:
        lista.sort(
          (a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao)
        );
        break;
    }

    return lista;
  }, [pesquisa, ordenacao, filtro, estadoAtivo]);

  const badgesEspeciais = badgesFiltrados.filter((badge) =>
    isBadgeEspecial(badge)
  );

  const badgesNormais = badgesFiltrados.filter(
    (badge) => !isBadgeEspecial(badge)
  );

  const badgesMinhaArea = badgesFiltrados.filter(
    (badge) => badge.grupo === "minhaArea"
  );

  const badgesOutrasAreas = badgesFiltrados.filter(
    (badge) => badge.grupo === "outrasAreas"
  );

  const semResultados = isConsultor
    ? badgesEspeciais.length === 0 &&
      badgesMinhaArea.length === 0 &&
      badgesOutrasAreas.length === 0
    : badgesEspeciais.length === 0 && badgesNormais.length === 0;

  return (
    <section className="galeria-todos-badges">
      {semResultados && (
        <p className="texto-nome-badge galeria-todos-badges-vazio">
          Não foram encontrados badges com os filtros atuais.
        </p>
      )}

      {isConsultor ? (
        <>
          <BadgeSeccao
            titulo="BADGES ESPECIAIS"
            tipo="gold"
            icone="fi-br-badge"
            badges={badgesEspeciais}
            mostrarEstado={mostrarEstado}
            onBadgeClick={onBadgeClick}
          />

          <BadgeSeccao
            titulo="A MINHA ÁREA"
            tipo="azul"
            badges={badgesMinhaArea}
            mostrarEstado={mostrarEstado}
            onBadgeClick={onBadgeClick}
          />

          <BadgeSeccao
            titulo="OUTRAS ÁREAS"
            tipo="azul"
            badges={badgesOutrasAreas}
            mostrarEstado={mostrarEstado}
            onBadgeClick={onBadgeClick}
          />
        </>
      ) : (
        <>
          <BadgeSeccao
            titulo="BADGES ESPECIAIS"
            tipo="gold"
            icone="fi-br-badge"
            badges={badgesEspeciais}
            mostrarEstado={false}
            onBadgeClick={onBadgeClick}
          />

          <BadgeSeccao
            titulo="BADGES NORMAIS"
            tipo="azul"
            badges={badgesNormais}
            mostrarEstado={false}
            onBadgeClick={onBadgeClick}
          />
        </>
      )}
    </section>
  );
}

export default GaleriaTodosBadges;