import { useMemo, useState } from "react";
import SeletorAbas from "../../components/ui/SeletorAbas/SeletorAbas_Galeria";
import GaleriaSugeridos from "../../components/Galeria/GaleriaSugeridos/GaleriaSugeridos";
import GaleriaTodosBadges from "../../components/Galeria/GaleriaTodosBadges/GaleriaTodosBadges";
import GaleriaToolbar from "../../components/Galeria/GaleriaToolbar/GaleriaToolbar";
import FiltroEstadoBadges from "../../components/Galeria/FiltroEstadoBadges/FiltroEstadoBadges";
import badgesConsultorMock from "../../data/badgesConsultorMock";
import "./GaleriaConsultor.css";

function normalizarTexto(texto = "") {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function calcularContagensEstadoBadges(badges) {
  const contagens = {
    todos: badges.length,
    conquistados: 0,
    emProgresso: 0,
    pendentes: 0,
    expirados: 0,
    recusados: 0,
    bloqueados: 0,
  };

  badges.forEach((badge) => {
    if (contagens[badge.estado] !== undefined) {
      contagens[badge.estado] += 1;
    }
  });

  return contagens;
}

function GaleriaConsultor() {
  const [abaAtiva, setAbaAtiva] = useState("sugeridos");
  const [pesquisa, setPesquisa] = useState("");
  const [ordenacao, setOrdenacao] = useState("recentes");
  const [filtro, setFiltro] = useState("");
  const [estadoBadgeAtivo, setEstadoBadgeAtivo] = useState("todos");

  const opcoesEstadoBadge = [
    { valor: "todos", label: "Todos" },
    { valor: "conquistados", label: "Conquistados" },
    { valor: "emProgresso", label: "Em Progresso" },
    { valor: "pendentes", label: "Pendentes" },
    { valor: "expirados", label: "Expirados" },
    { valor: "recusados", label: "Recusados" },
    { valor: "bloqueados", label: "Bloqueados" },
  ];

  const badgesParaContagem = useMemo(() => {
    let lista = [...badgesConsultorMock];

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
      Para já, o dropdown "Filtrar" escolhe apenas o tipo:
      Learning Path, Service Line ou Área.

      Ainda não escolhe um valor concreto como "Jornada Técnica" ou
      "Hybrid Systems". Por isso, não aplicamos filtragem real aqui.
      Esta parte fica preparada para quando houver dados/API.
    */
    if (filtro) {
      // Futuramente: aplicar filtro por valor concreto.
    }

    return lista;
  }, [pesquisa, filtro]);

  const contagensEstadoBadge = useMemo(() => {
    return calcularContagensEstadoBadges(badgesParaContagem);
  }, [badgesParaContagem]);

  function handleBadgeClick(badge) {
    console.log("Badge selecionado:", badge);
  }

  return (
    <main className="galeria-consultor-page">
      <div className="galeria-consultor-topo">
        <h1 className="texto-titulo-principal galeria-consultor-titulo">
          Galeria de Badges
        </h1>

        <div className="galeria-consultor-seletor">
          <SeletorAbas
            valorAtivo={abaAtiva}
            onChange={setAbaAtiva}
            opcoes={[
              { valor: "sugeridos", label: "Sugeridos" },
              { valor: "todos", label: "Todos os Badges" },
            ]}
          />
        </div>
      </div>

      <div className="galeria-consultor-conteudo">
        {abaAtiva === "todos" && (
          <>
            <GaleriaToolbar
              pesquisa={pesquisa}
              onPesquisaChange={setPesquisa}
              ordenacao={ordenacao}
              onOrdenacaoChange={setOrdenacao}
              filtro={filtro}
              onFiltroChange={setFiltro}
            />

            <FiltroEstadoBadges
              opcoes={opcoesEstadoBadge}
              valorAtivo={estadoBadgeAtivo}
              onChange={setEstadoBadgeAtivo}
              contagens={contagensEstadoBadge}
            />
          </>
        )}

        <div
          className={`galeria-consultor-resultados ${
            abaAtiva === "todos" ? "com-toolbar" : ""
          }`}
        >
          {abaAtiva === "sugeridos" && (
            <GaleriaSugeridos onBadgeClick={handleBadgeClick} />
          )}

          {abaAtiva === "todos" && (
            <GaleriaTodosBadges
              pesquisa={pesquisa}
              ordenacao={ordenacao}
              filtro={filtro}
              estadoAtivo={estadoBadgeAtivo}
              onBadgeClick={handleBadgeClick}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default GaleriaConsultor;
