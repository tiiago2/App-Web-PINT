import { useEffect, useMemo } from "react";
import BadgeSeccao from "../BadgeSeccao/BadgeSeccao";
import "./GaleriaTodosBadges.css";

function normalizarTexto(texto = "") {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function obterNomeBadge(badge) {
  return badge.nomeBadge || badge.nome_badge || badge.nome || "";
}

function obterNomeArea(badge) {
  return badge.nomeArea || badge.nome_area || badge.area || "";
}

function obterServiceLine(badge) {
  return badge.serviceLine || badge.nome_service_line || "";
}

function obterLearningPath(badge) {
  return badge.learningPath || badge.nome_learning_path || "";
}

function obterNivel(badge) {
  return badge.nivel || badge.nome_nivel || "";
}

function obterDataCriacao(badge) {
  return badge.dataCriacao || badge.data_criacao || badge.updated_badge || null;
}

function isBadgeEspecial(badge) {
  return badge.especial === true || badge.grupo === "badgesEspeciais";
}

function badgeCumpreFiltro(badge, filtro) {
  if (!filtro || filtro.tipo === "todos") {
    return true;
  }

  if (filtro.tipo === "learningPath") {
    return obterLearningPath(badge) === filtro.valor;
  }

  if (filtro.tipo === "serviceLine") {
    return obterServiceLine(badge) === filtro.valor;
  }

  if (filtro.tipo === "area") {
    return obterNomeArea(badge) === filtro.valor;
  }

  return true;
}

function ordenarLista(lista, ordenacao) {
  const listaOrdenada = [...lista];

  switch (ordenacao) {
    case "az":
      listaOrdenada.sort((a, b) =>
        obterNomeBadge(a).localeCompare(obterNomeBadge(b), "pt")
      );
      break;

    case "za":
      listaOrdenada.sort((a, b) =>
        obterNomeBadge(b).localeCompare(obterNomeBadge(a), "pt")
      );
      break;

    case "antigos":
      listaOrdenada.sort(
        (a, b) => new Date(obterDataCriacao(a)) - new Date(obterDataCriacao(b))
      );
      break;

    case "recentes":
    default:
      listaOrdenada.sort(
        (a, b) => new Date(obterDataCriacao(b)) - new Date(obterDataCriacao(a))
      );
      break;
  }

  return listaOrdenada;
}

function GaleriaTodosBadges({
  modo = "consultor",
  badges = null,
  pesquisa = "",
  ordenacao = "recentes",
  filtro = "",
  estadoAtivo = "todos",
  mostrarEstado = true,
  aplicarFiltros = true,
  onBadgeClick,
  renderBadge,
  emptyMessage = "Não foram encontrados badges com os filtros atuais.",
  onBadgesFiltradosChange,
}) {
  const isConsultor = modo === "consultor";

  const badgesFiltrados = useMemo(() => {
    let lista = Array.isArray(badges) ? [...badges] : [];

    if (!aplicarFiltros) {
      return lista;
    }

    if (estadoAtivo !== "todos") {
      lista = lista.filter((badge) => badge.estado === estadoAtivo);
    }

    const pesquisaNormalizada = normalizarTexto(pesquisa).trim();

    if (pesquisaNormalizada) {
      lista = lista.filter((badge) => {
        const camposPesquisaveis = [
          obterNomeBadge(badge),
          obterNomeArea(badge),
          obterServiceLine(badge),
          obterLearningPath(badge),
          obterNivel(badge),
        ];

        return camposPesquisaveis.some((campo) =>
          normalizarTexto(campo).includes(pesquisaNormalizada)
        );
      });
    }

    lista = lista.filter((badge) => badgeCumpreFiltro(badge, filtro));

    return ordenarLista(lista, ordenacao);
  }, [badges, pesquisa, ordenacao, filtro, estadoAtivo, aplicarFiltros]);

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

  useEffect(() => {
    onBadgesFiltradosChange?.(badgesFiltrados);
  }, [badgesFiltrados, onBadgesFiltradosChange]);

  return (
    <section className="galeria-todos-badges">
      {semResultados && (
        <p className="texto-nome-badge galeria-todos-badges-vazio">
          {emptyMessage}
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
            renderBadge={renderBadge}
          />

          <BadgeSeccao
            titulo="A MINHA ÁREA"
            tipo="azul"
            badges={badgesMinhaArea}
            mostrarEstado={mostrarEstado}
            onBadgeClick={onBadgeClick}
            renderBadge={renderBadge}
          />

          <BadgeSeccao
            titulo="OUTRAS ÁREAS"
            tipo="azul"
            badges={badgesOutrasAreas}
            mostrarEstado={mostrarEstado}
            onBadgeClick={onBadgeClick}
            renderBadge={renderBadge}
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
            renderBadge={renderBadge}
          />

          <BadgeSeccao
            titulo="BADGES NORMAIS"
            tipo="azul"
            badges={badgesNormais}
            mostrarEstado={false}
            onBadgeClick={onBadgeClick}
            renderBadge={renderBadge}
          />
        </>
      )}
    </section>
  );
}

export default GaleriaTodosBadges;
