import { useMemo, useState } from "react";
import SeletorAbas from "../../ui/SeletorAbas/SeletorAbas_Galeria";
import GaleriaSugeridos from "../GaleriaSugeridos/GaleriaSugeridos";
import GaleriaTodosBadges from "../GaleriaTodosBadges/GaleriaTodosBadges";
import GaleriaToolbar from "../GaleriaToolbar/GaleriaToolbar";
import FiltroEstadoBadges from "../FiltroEstadoBadges/FiltroEstadoBadges";
import badgesConsultorMock from "../../../data/badgesConsultorMock";
import "./GaleriaBadges.css";

function normalizarTexto(texto = "") {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function criarOpcoesUnicas(badges, campo) {
  const mapa = new Map();

  badges.forEach((badge) => {
    const valor = badge[campo];

    if (valor && !mapa.has(valor)) {
      mapa.set(valor, {
        valor,
        label: valor,
      });
    }
  });

  return Array.from(mapa.values()).sort((a, b) =>
    a.label.localeCompare(b.label, "pt")
  );
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

function GaleriaBadges({ modo = "consultor" }) {
  const isConsultor = modo === "consultor";

  const [abaAtiva, setAbaAtiva] = useState("sugeridos");
  const [pesquisa, setPesquisa] = useState("");
  const [ordenacao, setOrdenacao] = useState("recentes");
  const [filtro, setFiltro] = useState({
    tipo: "todos",
    valor: "",
    label: "Todos",
  });
  const [estadoBadgeAtivo, setEstadoBadgeAtivo] = useState("todos");

  const opcoesFiltro = useMemo(() => {
    return {
      learningPath: criarOpcoesUnicas(badgesConsultorMock, "learningPath"),
      serviceLine: criarOpcoesUnicas(badgesConsultorMock, "serviceLine"),
      area: criarOpcoesUnicas(badgesConsultorMock, "nomeArea"),
    };
  }, []);

  const abaAtual = isConsultor ? abaAtiva : "todos";

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

    lista = lista.filter((badge) => badgeCumpreFiltro(badge, filtro));

    return lista;
  }, [pesquisa, filtro]);

  const contagensEstadoBadge = useMemo(() => {
    return calcularContagensEstadoBadges(badgesParaContagem);
  }, [badgesParaContagem]);

  function handleBadgeClick(badge) {
    console.log("Badge selecionado:", badge);
  }

  return (
    <main className="galeria-badges-page">
      <div className="galeria-badges-topo">
        <h1 className="texto-titulo-principal galeria-badges-titulo">
          Galeria de Badges
        </h1>

        {isConsultor && (
          <div className="galeria-badges-seletor">
            <SeletorAbas
              valorAtivo={abaAtiva}
              onChange={setAbaAtiva}
              opcoes={[
                { valor: "sugeridos", label: "Sugeridos" },
                { valor: "todos", label: "Todos os Badges" },
              ]}
            />
          </div>
        )}
      </div>

      <div className="galeria-badges-conteudo">
        {abaAtual === "todos" && (
          <>
            <GaleriaToolbar
            pesquisa={pesquisa}
            onPesquisaChange={setPesquisa}
            ordenacao={ordenacao}
            onOrdenacaoChange={setOrdenacao}
            filtro={filtro}
            onFiltroChange={setFiltro}
            opcoesFiltro={opcoesFiltro}
            />

            {isConsultor && (
              <FiltroEstadoBadges
                opcoes={opcoesEstadoBadge}
                valorAtivo={estadoBadgeAtivo}
                onChange={setEstadoBadgeAtivo}
                contagens={contagensEstadoBadge}
              />
            )}
          </>
        )}

        <div
          className={`galeria-badges-resultados ${
            abaAtual === "todos" ? "com-toolbar" : ""
          }`}
        >
          {isConsultor && abaAtual === "sugeridos" && (
            <GaleriaSugeridos onBadgeClick={handleBadgeClick} />
          )}

          {abaAtual === "todos" && (
            <GaleriaTodosBadges
              modo={modo}
              pesquisa={pesquisa}
              ordenacao={ordenacao}
              filtro={filtro}
              estadoAtivo={isConsultor ? estadoBadgeAtivo : "todos"}
              mostrarEstado={isConsultor}
              onBadgeClick={handleBadgeClick}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default GaleriaBadges;