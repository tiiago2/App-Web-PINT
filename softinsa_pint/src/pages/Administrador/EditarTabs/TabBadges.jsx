import React, { useCallback, useEffect, useMemo, useState } from "react";
import GaleriaToolbar from "../../../components/Galeria/GaleriaToolbar/GaleriaToolbar";
import VistaTabelaBadges from "../../../components/Galeria/VistaTabelaBadges/VistaTabelaBadges";
import BadgeModal from "../../../components/Criar_Editar/BadgeModal";
import ModalConfirmacao from "../../../components/ui/ModalConfirmacao/ModalConfirmacao";
import { obterBadgesCatalogoNormalizados } from "../../../services/badgesService";
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
  return badge.nome_badge ?? badge.nomeBadge ?? badge.nome ?? "badge";
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
        const dataA = new Date(a.dataCriacao || a.data_criacao || 0);
        const dataB = new Date(b.dataCriacao || b.data_criacao || 0);

        return dataA - dataB;
      });
      break;

    case "recentes":
    default:
      listaOrdenada.sort((a, b) => {
        const dataA = new Date(a.dataCriacao || a.data_criacao || 0);
        const dataB = new Date(b.dataCriacao || b.data_criacao || 0);

        return dataB - dataA;
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
  const [isLoadingBadges, setIsLoadingBadges] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [badgeToEdit, setBadgeToEdit] = useState(null);
  const [badgeAEliminar, setBadgeAEliminar] = useState(null);

  useEffect(() => {
    let ativo = true;

    async function carregarBadges() {
      try {
        setIsLoadingBadges(true);

        const badgesCatalogo = await obterBadgesCatalogoNormalizados();

        if (ativo) {
          setBadges(badgesCatalogo);
        }
      } catch (error) {
        console.error("Erro ao carregar badges:", error);

        if (ativo) {
          setBadges([]);
        }
      } finally {
        if (ativo) {
          setIsLoadingBadges(false);
        }
      }
    }

    carregarBadges();

    return () => {
      ativo = false;
    };
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

  const handleOpenEditModal = (badge) => {
    setBadgeToEdit(badge);
    setIsModalOpen(true);
  };

  const handleDeleteBadge = (id) => {
    setBadges((prev) =>
      prev.filter((badge) => obterIdBadge(badge) !== id)
    );
  };

  const handleConfirmDeleteBadge = () => {
    if (!badgeAEliminar) {
      return;
    }

    handleDeleteBadge(obterIdBadge(badgeAEliminar));
    setBadgeAEliminar(null);
  };

  const handleSaveBadge = (badgeObj) => {
    const badgeNormalizado = normalizarBadgeCatalogo({
      ...badgeObj,
      id_badge:
        badgeObj.id_badge ??
        badgeObj.idBadge ??
        badgeObj.id ??
        Date.now(),
      data_criacao:
        badgeObj.data_criacao ??
        badgeObj.dataCriacao ??
        new Date().toISOString(),
    });

    const idBadgeGuardado = obterIdBadge(badgeNormalizado);

    setBadges((prev) => {
      const exists = prev.some(
        (badge) => obterIdBadge(badge) === idBadgeGuardado
      );

      if (exists) {
        return prev.map((badge) =>
          obterIdBadge(badge) === idBadgeGuardado
            ? badgeNormalizado
            : badge
        );
      }

      return [badgeNormalizado, ...prev];
    });
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
        icon: "fi-br-crosshairs",
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
        onClose={() => setBadgeAEliminar(null)}
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
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBadge}
        badgeToEdit={badgeToEdit}
      />
    </>
  );
}

export default TabBadges;