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

function GaleriaTodosBadges({
  pesquisa = "",
  ordenacao = "recentes",
  filtro = "",
  estadoAtivo = "todos",
  onBadgeClick,
}) {
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

    /*
      O dropdown "Filtrar" neste momento seleciona apenas o tipo de filtro:
      learningPath, serviceLine ou area.

      Ainda não escolhe um valor concreto, por exemplo:
      "Jornada Técnica" ou "Hybrid Systems".

      Por isso, para já, não filtramos a lista por este campo.
      Quando vier a API ou um dropdown de valores concretos, ligamos aqui.
    */
    if (filtro) {
      // Preparado para futura filtragem real.
    }

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

  const badgesEspeciais = badgesFiltrados.filter(
    (badge) => badge.grupo === "badgesEspeciais"
  );

  const badgesMinhaArea = badgesFiltrados.filter(
    (badge) => badge.grupo === "minhaArea"
  );

  const badgesOutrasAreas = badgesFiltrados.filter(
    (badge) => badge.grupo === "outrasAreas"
  );

  const semResultados =
    badgesEspeciais.length === 0 &&
    badgesMinhaArea.length === 0 &&
    badgesOutrasAreas.length === 0;

  return (
    <section className="galeria-todos-badges">
      {semResultados && (
        <p className="texto-nome-badge galeria-todos-badges-vazio">
          Não foram encontrados badges com os filtros atuais.
        </p>
      )}

      <BadgeSeccao
        titulo="BADGES ESPECIAIS"
        tipo="gold"
        icone="fi-br-badge"
        badges={badgesEspeciais}
        onBadgeClick={onBadgeClick}
      />

      <BadgeSeccao
        titulo="A MINHA ÁREA"
        tipo="azul"
        badges={badgesMinhaArea}
        onBadgeClick={onBadgeClick}
      />

      <BadgeSeccao
        titulo="OUTRAS ÁREAS"
        tipo="azul"
        badges={badgesOutrasAreas}
        onBadgeClick={onBadgeClick}
      />
    </section>
  );
}

export default GaleriaTodosBadges;