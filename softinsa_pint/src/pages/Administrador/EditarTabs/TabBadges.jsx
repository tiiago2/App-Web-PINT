import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GaleriaToolbar from "../../../components/Galeria/GaleriaToolbar/GaleriaToolbar";
import VistaTabelaBadges from "../../../components/Galeria/VistaTabelaBadges/VistaTabelaBadges";
import BadgeModal from "../../../components/Criar_Editar/BadgeModal";
import ModalConfirmacao from "../../../components/ui/ModalConfirmacao/ModalConfirmacao";
import { 
  obterBadgesCatalogoNormalizados, 
  obterBadge,
  criarBadge,
  atualizarBadge, 
  removerBadge 
} from "../../../services/badgesService";
import {
  obterLearningPathsNormalizados,
  obterServiceLinesNormalizadas,
  obterAreasNormalizadas
} from "../../../services/gestaoService";
import { normalizarBadgeCatalogo } from "../../../utils/badgesNormalizadores";
import MetricasResumo from "../../../components/ui/MetricasResumo/MetricasResumo";

function normalizarTexto(texto = "") {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function obterIdBadge(badge = {}) {
  return badge.id_badge ?? badge.idBadge ?? badge.id;
}

function obterNomeBadge(badge = {}) {
  return (
    badge.nome_badge ??
    badge.nomeBadge ??
    badge.nome ??
    badge.badge ??
    "badge"
  );
}

function obterValorOrdenacaoTemporal(badge = {}) {
  const camposData = [
    badge.data_criacao,
    badge.dataCriacao,
    badge.update_badge,
    badge.updated_badge,
  ];

  for (const valor of camposData) {
    if (!valor) {
      continue;
    }

    const timestamp = new Date(valor).getTime();

    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  const idBadge = Number(obterIdBadge(badge));
  return Number.isNaN(idBadge) ? 0 : idBadge;
}

function criarOpcoesUnicas(lista, campo) {
  const mapa = new Map();

  lista.forEach((item) => {
    const valor = item[campo];

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

function badgeCumpreFiltroAdmin(badge, filtro) {
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
    return badge.area === filtro.valor;
  }

  return true;
}

function ordenarBadgesAdmin(lista, ordenacao) {
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
      listaOrdenada.sort((a, b) => {
        const valorA = obterValorOrdenacaoTemporal(a);
        const valorB = obterValorOrdenacaoTemporal(b);

        return valorA - valorB;
      });
      break;

    case "recentes":
    default:
      listaOrdenada.sort((a, b) => {
        const valorA = obterValorOrdenacaoTemporal(a);
        const valorB = obterValorOrdenacaoTemporal(b);

        return valorB - valorA;
      });
      break;
  }

  return listaOrdenada;
}

function TabBadges({ onRegisterAdicionar }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [ordenacao, setOrdenacao] = useState("recentes");
  const [filtro, setFiltro] = useState({
    tipo: "todos",
    valor: "",
    label: "Todos",
  });

  const [badges, setBadges] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [serviceLines, setServiceLines] = useState([]);
  const [areas, setAreas] = useState([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(true);
  const [badgeAEliminar, setBadgeAEliminar] = useState(null);
  const eliminarBadgeEmProgressoRef = useRef(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [badgeToEdit, setBadgeToEdit] = useState(null);

  const carregarBadges = async () => {
    try {
      setIsLoadingBadges(true);
      const [bdgs, lps, sls, ars] = await Promise.all([
        obterBadgesCatalogoNormalizados(),
        obterLearningPathsNormalizados(),
        obterServiceLinesNormalizadas(),
        obterAreasNormalizadas()
      ]);
      setBadges(bdgs);
      setLearningPaths(lps);
      setServiceLines(sls);
      setAreas(ars);
    } catch (error) {
      console.error("Erro ao carregar dados do admin de badges:", error);
    } finally {
      setIsLoadingBadges(false);
    }
  };

  useEffect(() => {
    carregarBadges();
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    setBadgeToEdit(null);
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    if (!onRegisterAdicionar) {
      return;
    }

    onRegisterAdicionar(() => handleOpenCreateModal);

    return () => {
      onRegisterAdicionar(null);
    };
  }, [onRegisterAdicionar, handleOpenCreateModal]);

  const handleOpenEditModal = async (badge) => {
    const idB = obterIdBadge(badge);

    if (!idB) {
      return;
    }

    try {
      const detalheBadge = await obterBadge(idB);
      setBadgeToEdit(normalizarBadgeCatalogo(detalheBadge));
      setIsModalOpen(true);
    } catch (err) {
      const mensagemErro =
        err.response?.data?.error || "Erro ao carregar detalhe do Badge.";
      alert(mensagemErro);
    }
  };

  const handleCloseConfirmacaoDelete = () => {
    if (!eliminarBadgeEmProgressoRef.current) {
      setBadgeAEliminar(null);
    }
  };

  const handleConfirmDeleteBadge = async () => {
    if (!badgeAEliminar || eliminarBadgeEmProgressoRef.current) {
      return;
    }

    const idB = obterIdBadge(badgeAEliminar);
    eliminarBadgeEmProgressoRef.current = true;

    try {
      await removerBadge(idB);
      setBadges((badgesAtuais) =>
        badgesAtuais.filter(
          (badge) => Number(obterIdBadge(badge)) !== Number(idB)
        )
      );
      setBadgeAEliminar(null);

      try {
        await carregarBadges();
      } catch (error) {
        console.error("Erro ao sincronizar badges após eliminar:", error);
      }
    } catch (err) {
      const mensagemErro = err.response?.data?.error || "Erro ao eliminar o Badge.";
      alert(mensagemErro);
    } finally {
      eliminarBadgeEmProgressoRef.current = false;
    }
  };

  const handleSaveBadge = async (badgeObj) => {
    const idExistente = badgeToEdit ? obterIdBadge(badgeToEdit) : null;

    const resposta = idExistente
      ? await atualizarBadge(idExistente, badgeObj)
      : await criarBadge(badgeObj);

    const badgeNormalizado = normalizarBadgeCatalogo(resposta);
    const idBadgeNormalizado = obterIdBadge(badgeNormalizado);

    setBadges((badgesAtuais) => {
      if (idExistente) {
        return badgesAtuais.map((badge) =>
          Number(obterIdBadge(badge)) === Number(idExistente)
            ? badgeNormalizado
            : badge
        );
      }

      const jaExiste = badgesAtuais.some(
        (badge) =>
          Number(obterIdBadge(badge)) === Number(idBadgeNormalizado)
      );

      return jaExiste
        ? badgesAtuais
        : [...badgesAtuais, badgeNormalizado];
    });

    setIsModalOpen(false);
    setBadgeToEdit(null);

    try {
      await carregarBadges();
    } catch (error) {
      console.error("Erro ao sincronizar badges após guardar:", error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setBadgeToEdit(null);
  };

  const badgesComCamposFiltro = useMemo(() => {
    return badges;
  }, [badges]);

  const opcoesFiltroAvancado = useMemo(() => {
    return {
      learningPath: criarOpcoesUnicas(
        badgesComCamposFiltro,
        "learningPath"
      ),
      serviceLine: criarOpcoesUnicas(
        badgesComCamposFiltro,
        "serviceLine"
      ),
      area: criarOpcoesUnicas(
        badgesComCamposFiltro,
        "area"
      ),
    };
  }, [badgesComCamposFiltro]);

  const badgesVisiveis = useMemo(() => {
    let lista = [...badgesComCamposFiltro];

    const pesquisaNormalizada = normalizarTexto(searchTerm).trim();

    if (pesquisaNormalizada) {
      lista = lista.filter((badge) => {
        const camposPesquisaveis = [
          badge.nome,
          badge.nome_badge,
          badge.nomeBadge,
          badge.area,
          badge.nome_area,
          badge.nomeArea,
          badge.serviceLine,
          badge.nome_service_line,
          badge.learningPath,
          badge.nome_learning_path,
          badge.nivel,
          badge.nome_nivel,
        ];

        return camposPesquisaveis.some((campo) =>
          normalizarTexto(campo).includes(pesquisaNormalizada)
        );
      });
    }

    lista = lista.filter((badge) =>
      badgeCumpreFiltroAdmin(badge, filtro)
    );

    return ordenarBadgesAdmin(lista, ordenacao);
  }, [badgesComCamposFiltro, searchTerm, filtro, ordenacao]);

  const niveis = useMemo(() => {
    const mapaNiveis = new Map();

    badges.forEach((badge) => {
      const idNivel = badge.id_nivel ?? badge.idNivel;
      const nomeNivel = badge.nome_nivel ?? badge.nomeNivel ?? badge.nivel;

      if (idNivel && nomeNivel && !mapaNiveis.has(Number(idNivel))) {
        mapaNiveis.set(Number(idNivel), {
          id_nivel: Number(idNivel),
          nome_nivel: nomeNivel,
        });
      }
    });

    return Array.from(mapaNiveis.values()).sort(
      (a, b) => a.id_nivel - b.id_nivel
    );
  }, [badges]);

  const metricas = useMemo(() => {
    const totalAreas = new Set(
      badgesComCamposFiltro
        .map((badge) => badge.area)
        .filter(Boolean)
    ).size;

    const totalServiceLines = new Set(
      badgesComCamposFiltro
        .map((badge) => badge.serviceLine)
        .filter(Boolean)
    ).size;

    return [
      {
        titulo: "Total de Badges",
        valor: badgesComCamposFiltro.length,
        icon: "fi-br-badge",
      },
      {
        titulo: "Áreas",
        valor: totalAreas,
        icon: "fi-br-target",
      },
      {
        titulo: "Service Lines",
        valor: totalServiceLines,
        icon: "fi-br-diagram-project",
      },
    ];
  }, [badgesComCamposFiltro]);

  return (
    <>
      <div className="editar-badges-conteudo">
        <GaleriaToolbar
          pesquisa={searchTerm}
          onPesquisaChange={setSearchTerm}
          ordenacao={ordenacao}
          onOrdenacaoChange={setOrdenacao}
          filtro={filtro}
          onFiltroChange={setFiltro}
          opcoesFiltro={opcoesFiltroAvancado}
        />

        <MetricasResumo metricas={metricas} />

        <div className="editar-badges-resultados">
          <VistaTabelaBadges
            badges={badgesVisiveis}
            isLoading={isLoadingBadges}
            onEdit={handleOpenEditModal}
            onDelete={setBadgeAEliminar}
          />
        </div>
      </div>

      <ModalConfirmacao
        isOpen={!!badgeAEliminar}
        onClose={handleCloseConfirmacaoDelete}
        onConfirm={handleConfirmDeleteBadge}
        titulo="Eliminar badge"
        mensagem={`Tem a certeza que pretende eliminar o badge "${obterNomeBadge(
          badgeAEliminar || {}
        )}"?`}
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        isDanger={true}
      />

      <BadgeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveBadge}
        badgeToEdit={badgeToEdit}
        learningPaths={learningPaths}
        serviceLines={serviceLines}
        areas={areas}
        niveis={niveis}
      />
    </>
  );
}

export default TabBadges;
