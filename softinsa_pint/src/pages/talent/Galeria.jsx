import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import GaleriaTodosBadges from "../../components/Galeria/GaleriaTodosBadges/GaleriaTodosBadges";
import BadgeItemAdmin from "../../components/Galeria/BadgeItemAdmin/BadgeItemAdmin";
import ModalConfirmacao from "../../components/ui/ModalConfirmacao/ModalConfirmacao";
import BadgeModal from '../../components/Criar_Editar/BadgeModal';
import SeletorAbas from "../../components/ui/SeletorAbas/SeletorAbas_Galeria";
import BotaoAcao from "../../components/ui/BotaoAcao/BotaoAcao";
import BotaoExportar from "../../components/ui/BotaoExportar/BotaoExportar";
import VistaTabelaBadges from "../../components/Galeria/VistaTabelaBadges/VistaTabelaBadges";
import GaleriaToolbar from "../../components/Galeria/GaleriaToolbar/GaleriaToolbar";
import {
  obterBadgesCatalogoNormalizados,
  obterBadge,
  criarBadge,
  atualizarBadge,
  removerBadge,
} from "../../services/badgesService";
import { 
  obterLearningPathsNormalizados, 
  obterServiceLinesNormalizadas, 
  obterAreasNormalizadas 
} from "../../services/gestaoService";
import { normalizarBadgeCatalogo } from "../../utils/badgesNormalizadores";
import {
  normalizarBadgeDetalheCatalogo,
  obterUrlPublicaBadge,
} from "../../utils/badgeDetalheNormalizadores";
import "./Galeria.css";
import BadgeDetalheModal from "../../components/BadgeDetalhe/BadgeDetalheModal";

const mapaCategoriaParaFiltro = {
  "Hybrid Systems": {
    learningPath: "Backend Dev",
    serviceLine: "Software Engineering",
    area: "Java Core",
  },
  "Web UI": {
    learningPath: "Frontend Dev",
    serviceLine: "Software Engineering",
    area: "React & Web UI",
  },
  "Cloud Native": {
    learningPath: "Cloud & DevOps",
    serviceLine: "Cloud Services",
    area: "AWS Architecture",
  },
  "Backend": {
    learningPath: "Backend Dev",
    serviceLine: "Software Engineering",
    area: "Java Core",
  },
  "Mobile": {
    learningPath: "Frontend Dev",
    serviceLine: "Software Engineering",
    area: "React & Web UI",
  },
  "Security": {
    learningPath: "Cloud & DevOps",
    serviceLine: "Cloud Services",
    area: "AWS Architecture",
  },
  "Infrastructure": {
    learningPath: "Cloud & DevOps",
    serviceLine: "Cloud Services",
    area: "AWS Architecture",
  },
  "Design": {
    learningPath: "Frontend Dev",
    serviceLine: "Software Engineering",
    area: "React & Web UI",
  },
  "Data Science": {
    learningPath: "Data & Analytics",
    serviceLine: "Data Insights",
    area: "Python Data Science",
  },
};

function normalizarTexto(texto = "") {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function prepararBadgeAdminParaFiltro(badge) {
  const categoria = badge.categoria || "";
  const dadosMapeados = mapaCategoriaParaFiltro[categoria] || {};

  return {
    ...badge,
    learningPath: badge.learningPath || dadosMapeados.learningPath || categoria || "Sem Learning Path",
    serviceLine: badge.serviceLine || dadosMapeados.serviceLine || categoria || "Sem Service Line",
    area: badge.area || badge.nomeArea || dadosMapeados.area || categoria || "Sem Área",
  };
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
      listaOrdenada.sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
      break;

    case "za":
      listaOrdenada.sort((a, b) => b.nome.localeCompare(a.nome, "pt"));
      break;

    case "antigos":
      listaOrdenada.sort(
        (a, b) => obterValorOrdenacaoTemporal(a) - obterValorOrdenacaoTemporal(b)
      );
      break;

    case "recentes":
    default:
      listaOrdenada.sort(
        (a, b) => obterValorOrdenacaoTemporal(b) - obterValorOrdenacaoTemporal(a)
      );
      break;
  }

  return listaOrdenada;
}

function obterIdBadge(badge) {
  return badge?.id_badge ?? badge?.idBadge ?? badge?.id;
}

function obterNomeBadge(badge = {}) {
  return badge.nome_badge ?? badge.nomeBadge ?? badge.nome ?? "badge";
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

function Galeria() {
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [ordenacao, setOrdenacao] = useState('recentes');
  const [filtro, setFiltro] = useState({
    tipo: "todos",
    valor: "",
    label: "Todos",
  });
  const [viewMode, setViewMode] = useState('galeria'); 
  const [badges, setBadges] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [serviceLines, setServiceLines] = useState([]);
  const [areas, setAreas] = useState([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [badgeToEdit, setBadgeToEdit] = useState(null);
  const [badgeAEliminar, setBadgeAEliminar] = useState(null);
  const eliminarBadgeEmProgressoRef = useRef(false);
  const editarBadgeEmProgressoRef = useRef(false);
  const detalheBadgeEmProgressoRef = useRef(false);
  const [isDetalheBadgeOpen, setIsDetalheBadgeOpen] = useState(false);
  const [detalheBadge, setDetalheBadge] = useState(null);
  const [isLoadingDetalheBadge, setIsLoadingDetalheBadge] = useState(false);

  const badgesComCamposFiltro = useMemo(() => {
    return badges.map(prepararBadgeAdminParaFiltro);
  }, [badges]);

  const opcoesFiltroAvancado = useMemo(() => {
    return {
      learningPath: criarOpcoesUnicas(badgesComCamposFiltro, "learningPath"),
      serviceLine: criarOpcoesUnicas(badgesComCamposFiltro, "serviceLine"),
      area: criarOpcoesUnicas(badgesComCamposFiltro, "area"),
    };
  }, [badgesComCamposFiltro]);

  const badgesVisiveis = useMemo(() => {
    let lista = [...badgesComCamposFiltro];

    const pesquisaNormalizada = normalizarTexto(searchTerm).trim();

    if (pesquisaNormalizada) {
      lista = lista.filter((badge) => {
        const camposPesquisaveis = [
          badge.nome,
          badge.categoria,
          badge.learningPath,
          badge.serviceLine,
          badge.area,
        ];

        return camposPesquisaveis.some((campo) =>
          normalizarTexto(campo).includes(pesquisaNormalizada)
        );
      });
    }

    lista = lista.filter((badge) => badgeCumpreFiltroAdmin(badge, filtro));

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

  const tratarErroExportacao = (error) => {
    if (error?.codigo === "sem_badges_para_exportar") {
      alert("Não existem badges para exportar.");
      return;
    }

    console.error("Erro ao exportar a galeria de badges:", error);
    alert("Não foi possível exportar os badges.");
  };

  const handleExportarExcel = async () => {
    try {
      const { exportarBadgesExcel } = await import("../../utils/exportarBadges");

      await exportarBadgesExcel({
        badges: badgesVisiveis,
        titulo: "Galeria de Badges",
        contexto: "Catálogo Global",
        tipo: "catalogo",
        nomeFicheiro: "Galeria_Badges_Admin",
      });
    } catch (error) {
      tratarErroExportacao(error);
    }
  };

  const handleExportarPDF = async () => {
    try {
      const { exportarBadgesPdf } = await import("../../utils/exportarBadges");

      await exportarBadgesPdf({
        badges: badgesVisiveis,
        titulo: "Galeria de Badges",
        contexto: "Catálogo Global",
        tipo: "catalogo",
        nomeFicheiro: "Galeria_Badges_Admin",
      });
    } catch (error) {
      tratarErroExportacao(error);
    }
  };

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

  const carregarDadosGaleria = useCallback(async (deveAplicar = () => true) => {
    try {
      setIsLoadingBadges(true);

      const [badgesCatalogo, lps, sls, ars] = await Promise.all([
        obterBadgesCatalogoNormalizados(),
        obterLearningPathsNormalizados(),
        obterServiceLinesNormalizadas(),
        obterAreasNormalizadas()
      ]);

      if (deveAplicar()) {
        setBadges(badgesCatalogo);
        setLearningPaths(lps);
        setServiceLines(sls);
        setAreas(ars);
      }
    } catch (error) {
      console.error("Erro ao carregar dados da galeria:", error);
      throw error;
    } finally {
      if (deveAplicar()) {
        setIsLoadingBadges(false);
      }
    }
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    setBadgeToEdit(null);
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    // Check for openCreateModal state from Quick Actions navigation
    if (location.state?.openCreateModal) {
      handleOpenCreateModal();
      window.history.replaceState({}, document.title);
    }
  }, [location.state, handleOpenCreateModal]);

  const handleOpenEditModal = async (badge) => {
    const idBadge = obterIdBadge(badge);

    if (!idBadge || editarBadgeEmProgressoRef.current) {
      return;
    }

    editarBadgeEmProgressoRef.current = true;

    try {
      const detalhe = await obterBadge(idBadge);
      setBadgeToEdit(normalizarBadgeCatalogo(detalhe));
      setIsModalOpen(true);
    } catch (error) {
      console.error("Erro ao carregar detalhe do badge para edição:", error);
      alert(error.response?.data?.error || "Erro ao carregar detalhe do Badge.");
    } finally {
      editarBadgeEmProgressoRef.current = false;
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

    const idBadge = obterIdBadge(badgeAEliminar);
    eliminarBadgeEmProgressoRef.current = true;

    try {
      await removerBadge(idBadge);
      setBadges((badgesAtuais) =>
        badgesAtuais.filter(
          (badge) => Number(obterIdBadge(badge)) !== Number(idBadge)
        )
      );
      setBadgeAEliminar(null);

      try {
        await carregarDadosGaleria();
      } catch (error) {
        console.error("Erro ao sincronizar galeria após eliminar badge:", error);
      }
    } catch (error) {
      console.error("Erro ao eliminar badge:", error);
      alert(error.response?.data?.error || "Erro ao eliminar o Badge.");
    } finally {
      eliminarBadgeEmProgressoRef.current = false;
    }
  };

  const handleSaveBadge = async (payload) => {
    const idBadge = badgeToEdit ? obterIdBadge(badgeToEdit) : null;

    const resposta = idBadge
      ? await atualizarBadge(idBadge, payload)
      : await criarBadge(payload);

    const badgeNormalizado = normalizarBadgeCatalogo(resposta);
    const idBadgeNormalizado = obterIdBadge(badgeNormalizado);

    setBadges((badgesAtuais) => {
      if (idBadge) {
        return badgesAtuais.map((badge) =>
          Number(obterIdBadge(badge)) === Number(idBadge)
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
      await carregarDadosGaleria();
    } catch (error) {
      console.error("Erro ao sincronizar galeria após guardar badge:", error);
    }
  };

  const handleCloseBadgeModal = () => {
    setIsModalOpen(false);
    setBadgeToEdit(null);
  };

  useEffect(() => {
    let ativo = true;

    async function carregarDadosIniciais() {
      try {
        await carregarDadosGaleria(() => ativo);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais da galeria:", error);
      }
    }

    carregarDadosIniciais();

    return () => {
      ativo = false;
    };
  }, [carregarDadosGaleria]);

  const handleOpenDetalheBadgeCatalogo = async (badge) => {
    const idBadge = obterIdBadge(badge);

    if (!idBadge || detalheBadgeEmProgressoRef.current) {
      return;
    }

    detalheBadgeEmProgressoRef.current = true;
    setIsLoadingDetalheBadge(true);

    try {
      const detalhe = await obterBadge(idBadge);
      const detalheNormalizado = normalizarBadgeDetalheCatalogo({
        badge: detalhe,
        requisitos: Array.isArray(detalhe.requisitos)
          ? detalhe.requisitos
          : [],
      });

      setDetalheBadge(detalheNormalizado);
      setIsDetalheBadgeOpen(true);
    } catch (error) {
      console.error("Erro ao carregar detalhe do badge:", error);
      setDetalheBadge(null);
      alert(error.response?.data?.error || "Erro ao carregar detalhe do Badge.");
    } finally {
      setIsLoadingDetalheBadge(false);
      detalheBadgeEmProgressoRef.current = false;
    }
  };

  const handleCloseDetalheBadge = () => {
    setIsDetalheBadgeOpen(false);
    setDetalheBadge(null);
  };

  const handleVerPaginaPublicaBadge = (badgeDetalhe) => {
    const idBadge =
      badgeDetalhe?.id_badge ??
      badgeDetalhe?.idBadge ??
      badgeDetalhe?.id;

    if (!idBadge) {
      return;
    }

    const urlPublica =
      badgeDetalhe?.urlPublica ?? obterUrlPublicaBadge(idBadge);

    window.open(urlPublica, "_blank", "noopener,noreferrer");
  };

  const handleCopiarLinkPublicoBadge = async (badgeDetalhe) => {
    const idBadge =
      badgeDetalhe?.id_badge ??
      badgeDetalhe?.idBadge ??
      badgeDetalhe?.id;

    if (!idBadge) {
      return;
    }

    const urlPublica =
      badgeDetalhe?.urlPublica ?? obterUrlPublicaBadge(idBadge);

    const urlAbsoluta = `${window.location.origin}${urlPublica}`;

    try {
      await navigator.clipboard.writeText(urlAbsoluta);
      alert("Link público copiado.");
    } catch (error) {
      console.error("Erro ao copiar link público:", error);
      window.prompt("Copia o link público:", urlAbsoluta);
    }
  };

  return (
    <div className="galeria-container">
      
      <div className="galeria-topo-admin">
        <div className="galeria-topo-admin-esquerda">
          <h1 className="texto-titulo-principal m-0">
            Galeria de Badges
          </h1>

          <div className="seletor-vista-badges">
            <SeletorAbas
              valorAtivo={viewMode}
              onChange={setViewMode}
              opcoes={[
                { valor: "galeria", label: "Galeria", icone: "fi-br-grid" },
                { valor: "tabela", label: "Tabela", icone: "fi-br-table" },
              ]}
            />
          </div>
        </div>

        <div className="galeria-topo-admin-acoes">
          <BotaoAcao
            variante="secundario"
            icone="fi-br-plus"
            onClick={handleOpenCreateModal}
          >
            Adicionar Badge
          </BotaoAcao>

          <BotaoExportar
            onExportarExcel={handleExportarExcel}
            onExportarPDF={handleExportarPDF}
          />
        </div>
      </div>

      <div className="galeria-admin-conteudo">
        <GaleriaToolbar
          pesquisa={searchTerm}
          onPesquisaChange={setSearchTerm}
          ordenacao={ordenacao}
          onOrdenacaoChange={setOrdenacao}
          filtro={filtro}
          onFiltroChange={setFiltro}
          opcoesFiltro={opcoesFiltroAvancado}
        />

        <div className="galeria-admin-metricas">
          {metricas.map((metrica, index) => (
            <article key={index} className="galeria-admin-metrica-card">
              <div>
                <h3 className="galeria-admin-metrica-titulo">
                  {metrica.titulo}
                </h3>

                <p className="galeria-admin-metrica-valor">
                  {metrica.valor}
                </p>
              </div>

              <i className={`fi ${metrica.icon} galeria-admin-metrica-icone`}></i>
            </article>
          ))}
        </div>

        <div className="galeria-admin-resultados">
          {viewMode === "galeria" ? (
            <GaleriaTodosBadges
              modo="admin"
              badges={badgesVisiveis}
              aplicarFiltros={false}
              mostrarEstado={false}
              onBadgeClick={handleOpenDetalheBadgeCatalogo}
              renderBadge={(badge) => (
                <BadgeItemAdmin
                  badge={badge}
                  onEdit={handleOpenEditModal}
                  onDelete={setBadgeAEliminar}
                  onBadgeClick={handleOpenDetalheBadgeCatalogo}
                />
              )}
            />
          ) : (
            <VistaTabelaBadges
              badges={badgesVisiveis}
              isLoading={isLoadingBadges}
              onEdit={handleOpenEditModal}
              onDelete={setBadgeAEliminar}
              onBadgeClick={handleOpenDetalheBadgeCatalogo}
            />
          )}
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

      <BadgeDetalheModal
        isOpen={isDetalheBadgeOpen}
        onClose={handleCloseDetalheBadge}
        modo="catalogo"
        detalhe={detalheBadge}
        isLoading={isLoadingDetalheBadge}
        onVerPaginaPublica={handleVerPaginaPublicaBadge}
        onCopiarLinkPublico={handleCopiarLinkPublicoBadge}
      />

      <BadgeModal 
        isOpen={isModalOpen}
        onClose={handleCloseBadgeModal}
        onSave={handleSaveBadge}
        badgeToEdit={badgeToEdit}
        learningPaths={learningPaths}
        serviceLines={serviceLines}
        areas={areas}
        niveis={niveis}
      />
    </div>
  );
}

export default Galeria;
