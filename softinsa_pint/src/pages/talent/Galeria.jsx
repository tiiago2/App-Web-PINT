import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import GaleriaTodosBadges from "../../components/Galeria/GaleriaTodosBadges/GaleriaTodosBadges";
import BadgeItemAdmin from "../../components/Galeria/BadgeItemAdmin/BadgeItemAdmin";
import ModalConfirmacao from "../../components/ui/ModalConfirmacao/ModalConfirmacao";
import BadgeModal from '../../components/Criar_Editar/BadgeModal';
import SeletorAbas from "../../components/ui/SeletorAbas/SeletorAbas_Galeria";
import BotaoAcao from "../../components/ui/BotaoAcao/BotaoAcao";
import VistaTabelaBadges from "../../components/Galeria/VistaTabelaBadges/VistaTabelaBadges";
import GaleriaToolbar from "../../components/Galeria/GaleriaToolbar/GaleriaToolbar";
import { obterBadgesCatalogoNormalizados } from "../../services/badgesService";
import { normalizarBadgeCatalogo } from "../../utils/badgesNormalizadores";
import "./Galeria.css";

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
      listaOrdenada.sort((a, b) => a.id - b.id);
      break;

    case "recentes":
    default:
      listaOrdenada.sort((a, b) => b.id - a.id);
      break;
  }

  return listaOrdenada;
}

function obterIdBadge(badge) {
  return badge.id_badge ?? badge.idBadge ?? badge.id;
}

function obterNomeBadge(badge = {}) {
  return badge.nome_badge ?? badge.nomeBadge ?? badge.nome ?? "badge";
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
  const [isLoadingBadges, setIsLoadingBadges] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [badgeToEdit, setBadgeToEdit] = useState(null);
  const [badgeAEliminar, setBadgeAEliminar] = useState(null);

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

  // Estados para o Pop-Up de Exportação do Colega
  const [mostrarExportar, setMostrarExportar] = useState(false); 
  const [formatoExport, setFormatoExport] = useState("csv"); 
  const [opcaoExport, setOpcaoExport] = useState("atual"); 
  const [intervaloPaginas, setIntervaloPaginas] = useState(""); 

  useEffect(() => {
    // Check for openCreateModal state from Quick Actions navigation
    if (location.state?.openCreateModal) {
      handleOpenCreateModal();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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

  const handleOpenCreateModal = () => {
    setBadgeToEdit(null);
    setIsModalOpen(true);
  };

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

          <div className="position-relative">
            <BotaoAcao
              variante="primario"
              icone="fi-br-download"
              onClick={() => setMostrarExportar(o => !o)}
            >
              Exportar
            </BotaoAcao>
            {mostrarExportar && (
              <div className="estat-admin-export-menu">
                <div className="estat-admin-export-item">Excel</div>
                <div className="estat-admin-export-item">PDF</div>
              </div>
            )}
          </div>
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
              onBadgeClick={(badge) => {
                console.log("Abrir detalhe do badge:", badge);
              }}
              renderBadge={(badge) => (
                <BadgeItemAdmin
                  badge={badge}
                  onEdit={handleOpenEditModal}
                  onDelete={setBadgeAEliminar}
                  onBadgeClick={(badge) => {
                    console.log("Abrir detalhe do badge:", badge);
                  }}
                />
              )}
            />
          ) : (
            <VistaTabelaBadges
              badges={badgesVisiveis}
              isLoading={isLoadingBadges}
              onEdit={handleOpenEditModal}
              onDelete={(badge) => handleDeleteBadge(obterIdBadge(badge))}
            />
          )}
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
    </div>
  );
}

export default Galeria;
