import React, { useCallback, useEffect, useMemo, useState } from "react";
import GaleriaToolbar from "../../../components/Galeria/GaleriaToolbar/GaleriaToolbar";
import MetricasResumo from "../../../components/ui/MetricasResumo/MetricasResumo";
import VistaTabelaLearningPaths from "../../../components/Gestao/VistaTabelaLearningPaths/VistaTabelaLearningPaths";
import ModalConfirmacao from "../../../components/ui/ModalConfirmacao/ModalConfirmacao";
import useToast from "../../../hooks/useToast.js";
import { 
    obterLearningPathsNormalizados, 
    criarLearningPath, 
    atualizarLearningPath, 
    removerLearningPath 
} from "../../../services/gestaoService";
import LearningPathModal from "../../../components/Criar_Editar/LearningPathModal";

function normalizarTexto(texto = "") {
    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function obterIdLearningPath(learningPath = {}) {
    return (
        learningPath.id_learning_path ??
        learningPath.idLearningPath ??
        learningPath.id
    );
}

function obterNomeLearningPath(learningPath = {}) {
    return (
        learningPath.nome_learning_path ??
        learningPath.nomeLearningPath ??
        learningPath.nome ??
        learningPath.learningPath ??
        "learning path"
    );
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

function learningPathCumpreFiltro(learningPath, filtro) {
    if (!filtro || filtro.tipo === "todos") {
        return true;
    }

    if (filtro.tipo === "learningPath") {
        return learningPath.learningPath === filtro.valor;
    }

    return true;
}

function ordenarLearningPaths(lista, ordenacao) {
    const listaOrdenada = [...lista];

    switch (ordenacao) {
        case "az":
            listaOrdenada.sort((a, b) =>
                obterNomeLearningPath(a).localeCompare(
                    obterNomeLearningPath(b),
                    "pt"
                )
            );
            break;

        case "za":
            listaOrdenada.sort((a, b) =>
                obterNomeLearningPath(b).localeCompare(
                    obterNomeLearningPath(a),
                    "pt"
                )
            );
            break;

        case "antigos":
            listaOrdenada.sort((a, b) => {
                const dataA = new Date(a.updated_path || 0);
                const dataB = new Date(b.updated_path || 0);

                return dataA - dataB;
            });
            break;

        case "recentes":
        default:
            listaOrdenada.sort((a, b) => {
                const dataA = new Date(a.updated_path || 0);
                const dataB = new Date(b.updated_path || 0);

                return dataB - dataA;
            });
            break;
    }

    return listaOrdenada;
}

function TabLearningPaths({ onRegisterAdicionar }) {
    const { mostrarToast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [ordenacao, setOrdenacao] = useState("recentes");
    const [filtro, setFiltro] = useState({
        tipo: "todos",
        valor: "",
        label: "Todos",
    });

    const [learningPaths, setLearningPaths] = useState([]);
    const [isLoadingLearningPaths, setIsLoadingLearningPaths] = useState(true);
    const [learningPathAEliminar, setLearningPathAEliminar] = useState(null);

    const [isLearningPathModalOpen, setIsLearningPathModalOpen] = useState(false);
    const [learningPathToEdit, setLearningPathToEdit] = useState(null);

    const carregarLearningPaths = async () => {
        try {
            setIsLoadingLearningPaths(true);
            const learningPathsNormalizados = await obterLearningPathsNormalizados();
            setLearningPaths(learningPathsNormalizados);
        } catch (error) {
            console.error("Erro ao carregar learning paths:", error);
            setLearningPaths([]);
        } finally {
            setIsLoadingLearningPaths(false);
        }
    };

    useEffect(() => {
        carregarLearningPaths();
    }, []);

    const handleOpenCreateModal = useCallback(() => {
        setLearningPathToEdit(null);
        setIsLearningPathModalOpen(true);
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

    const handleOpenEditModal = (learningPath) => {
        setLearningPathToEdit({
            ...learningPath,
            id: obterIdLearningPath(learningPath),
            nome: learningPath.nome_learning_path ?? learningPath.nomeLearningPath ?? learningPath.nome ?? "",
            descricao: learningPath.descricao_learning_path ?? learningPath.descricao_larning_path ?? learningPath.descricao ?? ""
        });

        setIsLearningPathModalOpen(true);
    };

    const handleConfirmDeleteLearningPath = async () => {
        if (!learningPathAEliminar) {
            return;
        }

        const idLP = obterIdLearningPath(learningPathAEliminar);

        try {
            await removerLearningPath(idLP);
            await carregarLearningPaths();
            setLearningPathAEliminar(null);
        } catch (err) {
            const mensagemErro = err.response?.data?.error || "Erro ao eliminar o Learning Path.";
            mostrarToast(mensagemErro, "erro");
            setLearningPathAEliminar(null);
        }
    };

    const opcoesFiltroAvancado = useMemo(() => {
        return {
            learningPath: criarOpcoesUnicas(learningPaths, "learningPath"),
            serviceLine: [],
            area: [],
        };
    }, [learningPaths]);

    const learningPathsVisiveis = useMemo(() => {
        let lista = [...learningPaths];

        const pesquisaNormalizada = normalizarTexto(searchTerm).trim();

        if (pesquisaNormalizada) {
            lista = lista.filter((learningPath) => {
                const camposPesquisaveis = [
                    learningPath.nome,
                    learningPath.nome_learning_path,
                    learningPath.learningPath,
                ];

                return camposPesquisaveis.some((campo) =>
                    normalizarTexto(campo).includes(pesquisaNormalizada)
                );
            });
        }

        lista = lista.filter((learningPath) =>
            learningPathCumpreFiltro(learningPath, filtro)
        );

        return ordenarLearningPaths(lista, ordenacao);
    }, [learningPaths, searchTerm, filtro, ordenacao]);

    const metricas = useMemo(() => {
        const totalServiceLines = learningPaths.reduce(
            (acc, learningPath) =>
                acc + Number(learningPath.totalServiceLines ?? 0),
            0
        );

        const totalAreas = learningPaths.reduce(
            (acc, learningPath) =>
                acc + Number(learningPath.totalAreas ?? 0),
            0
        );

        return [
            {
                titulo: "Learning Paths",
                valor: learningPaths.length,
                icon: "fi-br-road",
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
    }, [learningPaths]);

    const handleSaveLearningPath = async (learningPathObj) => {
        try {
            const idExistente = learningPathToEdit ? obterIdLearningPath(learningPathToEdit) : null;

            if (idExistente) {
                await atualizarLearningPath(idExistente, learningPathObj);
            } else {
                await criarLearningPath(learningPathObj);
            }

            await carregarLearningPaths();
        } catch (err) {
            const mensagemErro = err.response?.data?.error || "Erro ao guardar o Learning Path.";
            mostrarToast(mensagemErro, "erro");
        }
    };

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
                    placeholderPesquisa="Pesquisar Learning Path..."
                />

                <MetricasResumo metricas={metricas} />

                <div className="editar-badges-resultados">
                    <VistaTabelaLearningPaths
                        learningPaths={learningPathsVisiveis}
                        isLoading={isLoadingLearningPaths}
                        onEdit={handleOpenEditModal}
                        onDelete={setLearningPathAEliminar}
                    />
                </div>
            </div>

            <LearningPathModal
                isOpen={isLearningPathModalOpen}
                onClose={() => setIsLearningPathModalOpen(false)}
                onSave={handleSaveLearningPath}
                lpToEdit={learningPathToEdit}
            />
            
            <ModalConfirmacao
                isOpen={!!learningPathAEliminar}
                onClose={() => setLearningPathAEliminar(null)}
                onConfirm={handleConfirmDeleteLearningPath}
                titulo="Eliminar learning path"
                mensagem={`Tem a certeza que pretende eliminar o learning path "${obterNomeLearningPath(
                    learningPathAEliminar || {}
                )}"?`}
                textoConfirmar="Eliminar"
                textoCancelar="Cancelar"
                isDanger={true}
            />
        </>
    );
}

export default TabLearningPaths;