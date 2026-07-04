import React, { useCallback, useEffect, useMemo, useState } from "react";
import GaleriaToolbar from "../../../components/Galeria/GaleriaToolbar/GaleriaToolbar";
import MetricasResumo from "../../../components/ui/MetricasResumo/MetricasResumo";
import VistaTabelaAreas from "../../../components/Gestao/VistaTabelaAreas/VistaTabelaAreas";
import ModalConfirmacao from "../../../components/ui/ModalConfirmacao/ModalConfirmacao";
import AreaModal from "../../../components/Criar_Editar/AreaModal";
import { 
    obterAreasNormalizadas, 
    obterLearningPathsNormalizados,
    obterServiceLinesNormalizadas,
    criarArea, 
    atualizarArea, 
    removerArea 
} from "../../../services/gestaoService";
import { normalizarArea } from "../../../utils/gestaoNormalizadores";

function normalizarTexto(texto = "") {
    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function obterIdArea(area = {}) {
    return area.id_area ?? area.idArea ?? area.id;
}

function obterNomeArea(area = {}) {
    return area.nome_area ?? area.nomeArea ?? area.nome ?? area.area ?? "área";
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

function areaCumpreFiltro(area, filtro) {
    if (!filtro || filtro.tipo === "todos") {
        return true;
    }

    if (filtro.tipo === "learningPath") {
        return area.learningPath === filtro.valor;
    }

    if (filtro.tipo === "serviceLine") {
        return area.serviceLine === filtro.valor;
    }

    if (filtro.tipo === "area") {
        return area.area === filtro.valor;
    }

    return true;
}

function ordenarAreas(lista, ordenacao) {
    const listaOrdenada = [...lista];

    switch (ordenacao) {
        case "az":
            listaOrdenada.sort((a, b) =>
                obterNomeArea(a).localeCompare(obterNomeArea(b), "pt")
            );
            break;

        case "za":
            listaOrdenada.sort((a, b) =>
                obterNomeArea(b).localeCompare(obterNomeArea(a), "pt")
            );
            break;

        case "antigos":
            listaOrdenada.sort((a, b) => {
                const dataA = new Date(a.updated_area || 0);
                const dataB = new Date(b.updated_area || 0);

                return dataA - dataB;
            });
            break;

        case "recentes":
        default:
            listaOrdenada.sort((a, b) => {
                const dataA = new Date(a.updated_area || 0);
                const dataB = new Date(b.updated_area || 0);

                return dataB - dataA;
            });
            break;
    }

    return listaOrdenada;
}

function TabAreas({ onRegisterAdicionar }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [ordenacao, setOrdenacao] = useState("recentes");
    const [filtro, setFiltro] = useState({
        tipo: "todos",
        valor: "",
        label: "Todos",
    });

    const [areas, setAreas] = useState([]);
    const [learningPaths, setLearningPaths] = useState([]);
    const [serviceLines, setServiceLines] = useState([]);
    const [isLoadingAreas, setIsLoadingAreas] = useState(true);
    const [areaAEliminar, setAreaAEliminar] = useState(null);
    
    const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
    const [areaToEdit, setAreaToEdit] = useState(null);

    const carregarAreas = async () => {
        try {
            setIsLoadingAreas(true);
            const [ars, lps, sls] = await Promise.all([
                obterAreasNormalizadas(),
                obterLearningPathsNormalizados(),
                obterServiceLinesNormalizadas()
            ]);
            setAreas(ars);
            setLearningPaths(lps);
            setServiceLines(sls);
        } catch (error) {
            console.error("Erro ao carregar dados da aba Áreas:", error);
            setAreas([]);
            setLearningPaths([]);
            setServiceLines([]);
        } finally {
            setIsLoadingAreas(false);
        }
    };

    useEffect(() => {
        carregarAreas();
    }, []);

    const handleOpenCreateModal = useCallback(() => {
        setAreaToEdit(null);
        setIsAreaModalOpen(true);
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

    const handleOpenEditModal = (area) => {
        setAreaToEdit({
            ...area,
            id: obterIdArea(area),
            nome: area.nome_area ?? area.nomeArea ?? area.nome ?? area.area ?? "",
            descricao: area.descricao_area ?? area.descricao ?? "",
            learningPathId: area.learningPathId ?? area.id_learning_path ?? "",
            serviceLineId: area.serviceLineId ?? area.id_service_line ?? "",
        });

        setIsAreaModalOpen(true);
    };

    const handleConfirmDeleteArea = async () => {
        if (!areaAEliminar) {
            return;
        }

        const idA = obterIdArea(areaAEliminar);

        try {
            await removerArea(idA);
            await carregarAreas();
            setAreaAEliminar(null);
        } catch (err) {
            const mensagemErro = err.response?.data?.error || "Erro ao eliminar a Área.";
            alert(mensagemErro);
            setAreaAEliminar(null);
        }
    };

    const handleSaveArea = async (areaObj) => {
        try {
            const idExistente = areaToEdit ? obterIdArea(areaToEdit) : null;

            if (idExistente) {
                await atualizarArea(idExistente, areaObj);
            } else {
                await criarArea(areaObj);
            }

            await carregarAreas();
        } catch (err) {
            const mensagemErro = err.response?.data?.error || "Erro ao guardar a Área.";
            alert(mensagemErro);
        }
    };

    const opcoesFiltroAvancado = useMemo(() => {
        return {
            learningPath: criarOpcoesUnicas(areas, "learningPath"),
            serviceLine: criarOpcoesUnicas(areas, "serviceLine"),
            area: criarOpcoesUnicas(areas, "area"),
        };
    }, [areas]);

    const areasVisiveis = useMemo(() => {
        let lista = [...areas];

        const pesquisaNormalizada = normalizarTexto(searchTerm).trim();

        if (pesquisaNormalizada) {
            lista = lista.filter((area) => {
                const camposPesquisaveis = [
                    area.nome,
                    area.nome_area,
                    area.area,
                    area.serviceLine,
                    area.nome_service_line,
                    area.learningPath,
                    area.nome_learning_path,
                ];

                return camposPesquisaveis.some((campo) =>
                    normalizarTexto(campo).includes(pesquisaNormalizada)
                );
            });
        }

        lista = lista.filter((area) =>
            areaCumpreFiltro(area, filtro)
        );

        return ordenarAreas(lista, ordenacao);
    }, [areas, searchTerm, filtro, ordenacao]);

    const metricas = useMemo(() => {
        const totalLearningPaths = new Set(
            areas
                .map((area) => area.learningPath)
                .filter(Boolean)
        ).size;

        const totalServiceLines = new Set(
            areas
                .map((area) => area.serviceLine)
                .filter(Boolean)
        ).size;

        return [
            {
                titulo: "Áreas",
                valor: areas.length,
                icon: "fi-br-target",
            },
            {
                titulo: "Learning Paths",
                valor: totalLearningPaths,
                icon: "fi-br-road",
            },
            {
                titulo: "Service Lines",
                valor: totalServiceLines,
                icon: "fi-br-diagram-project",
            },
        ];
    }, [areas]);

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
                    placeholderPesquisa="Pesquisar Área..."
                />

                <MetricasResumo metricas={metricas} />

                <div className="editar-badges-resultados">
                    <VistaTabelaAreas
                        areas={areasVisiveis}
                        isLoading={isLoadingAreas}
                        onEdit={handleOpenEditModal}
                        onDelete={setAreaAEliminar}
                    />
                </div>
            </div>

            <AreaModal
                isOpen={isAreaModalOpen}
                onClose={() => setIsAreaModalOpen(false)}
                onSave={handleSaveArea}
                areaToEdit={areaToEdit}
                learningPaths={learningPaths}
                serviceLines={serviceLines}
            />

            <ModalConfirmacao
                isOpen={!!areaAEliminar}
                onClose={() => setAreaAEliminar(null)}
                onConfirm={handleConfirmDeleteArea}
                titulo="Eliminar área"
                mensagem={`Tem a certeza que pretende eliminar a área "${obterNomeArea(
                    areaAEliminar || {}
                )}"?`}
                textoConfirmar="Eliminar"
                textoCancelar="Cancelar"
                isDanger={true}
            />
        </>
    );
}

export default TabAreas;