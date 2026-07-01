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

          <BotaoAcao
            variante="primario"
            icone="fi-br-download"
            onClick={() => setMostrarExportar(true)}
          >
            Exportar
          </BotaoAcao>
        </div>
      </div>

      {/* --- POP-UP DE EXPORTAÇÃO (MODAL) DO COLEGA --- */}
      {mostrarExportar && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ zIndex: 2000, backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="card shadow rounded-4 border-0 p-4"
            style={{ backgroundColor: "var(--fundo)", width: "450px", border: "var(--borda-principal) solid var(--contorno) !important" }}
          >
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="m-0 fw-bold" style={{ color: "var(--fontes)" }}>
                Exportar Dados
              </h4>
              <i
                className="fi fi-br-cross"
                style={{ cursor: "pointer", color: "var(--fontes)" }}
                onClick={() => setMostrarExportar(false)}
              ></i>
            </div>

            {/* Escolha do Formato */}
            <div className="mb-4">
              <label
                className="form-label fw-bold small"
                style={{ color: "var(--fontes)" }}
              >
                Formato do Ficheiro:
              </label>
              <div className="d-flex gap-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="formato"
                    id="csv"
                    checked={formatoExport === "csv"}
                    onChange={() => setFormatoExport("csv")}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="csv"
                    style={{ color: "var(--fontes)" }}
                  >
                    CSV (.csv)
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="formato"
                    id="pdf"
                    checked={formatoExport === "pdf"}
                    onChange={() => setFormatoExport("pdf")}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="pdf"
                    style={{ color: "var(--fontes)" }}
                  >
                    PDF (.pdf)
                  </label>
                </div>
              </div>
            </div>

            {/* Escolha do Conteúdo */}
            <div className="mb-4">
              <label
                className="form-label fw-bold small"
                style={{ color: "var(--fontes)" }}
              >
                Conteúdo a Exportar:
              </label>

              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="radio"
                  name="conteudo"
                  id="atual"
                  checked={opcaoExport === "atual"}
                  onChange={() => setOpcaoExport("atual")}
                />
                <label
                  className="form-check-label"
                  htmlFor="atual"
                  style={{ color: "var(--fontes)" }}
                >
                  Página Atual
                </label>
              </div>

              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="radio"
                  name="conteudo"
                  id="todas"
                  checked={opcaoExport === "todas"}
                  onChange={() => setOpcaoExport("todas")}
                />
                <label
                  className="form-check-label"
                  htmlFor="todas"
                  style={{ color: "var(--fontes)" }}
                >
                  Todas as Páginas
                </label>
              </div>

              <div className="form-check d-flex align-items-center gap-2">
                <input
                  className="form-check-input"
                  type="radio"
                  name="conteudo"
                  id="selecao"
                  checked={opcaoExport === "selecao"}
                  onChange={() => setOpcaoExport("selecao")}
                />
                <label
                  className="form-check-label"
                  htmlFor="selecao"
                  style={{ color: "var(--fontes)" }}
                >
                  Selecionar Páginas:
                </label>
                {opcaoExport === "selecao" && (
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Ex: 1-3"
                    style={{
                      width: "80px",
                      backgroundColor: "var(--fundo)",
                      borderColor: "var(--contorno)",
                      color: "var(--fontes)",
                    }}
                    value={intervaloPaginas}
                    onChange={(e) => setIntervaloPaginas(e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="d-flex justify-content-end gap-2 mt-2">
              <button
                className="btn btn-light px-4 fw-semibold"
                style={{
                  color: "var(--fontes)",
                  border: "var(--borda-principal) solid var(--contorno)",
                  borderRadius: "var(--border-radius-pequeno)"
                }}
                onClick={() => setMostrarExportar(false)}
              >
                Cancelar
              </button>
              <button
                className="btn px-4 fw-semibold"
                style={{
                  backgroundColor: "var(--barra_lateral)",
                  color: "var(--fundo)",
                  borderRadius: "var(--border-radius-pequeno)"
                }}
                onClick={() => {
                  alert(`A exportar em ${formatoExport.toUpperCase()}...`);
                  setMostrarExportar(false);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

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
