import React, { useCallback, useEffect, useMemo, useState } from "react";
import GaleriaToolbar from "../../../components/Galeria/GaleriaToolbar/GaleriaToolbar";
import MetricasResumo from "../../../components/ui/MetricasResumo/MetricasResumo";
import VistaTabelaServiceLines from "../../../components/Gestao/VistaTabelaServiceLines/VistaTabelaServiceLines";
import ModalConfirmacao from "../../../components/ui/ModalConfirmacao/ModalConfirmacao";
import ServiceLineModal from "../../../components/Criar_Editar/ServiceLineModal";
import { normalizarServiceLine } from "../../../utils/gestaoNormalizadores";
import { 
    obterServiceLinesNormalizadas, 
    obterLideresElegiveis, 
    obterLearningPathsNormalizados,
    criarServiceLine, 
    atualizarServiceLine, 
    removerServiceLine 
} from "../../../services/gestaoService";

function normalizarTexto(texto = "") {
    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function obterIdServiceLine(serviceLine = {}) {
    return serviceLine.id_service_line ?? serviceLine.idServiceLine ?? serviceLine.id;
}

function obterNomeServiceLine(serviceLine = {}) {
    return (
        serviceLine.nome_service_line ??
        serviceLine.nomeServiceLine ??
        serviceLine.nome ??
        serviceLine.serviceLine ??
        "service line"
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

function serviceLineCumpreFiltro(serviceLine, filtro) {
    if (!filtro || filtro.tipo === "todos") {
        return true;
    }

    if (filtro.tipo === "learningPath") {
        return serviceLine.learningPath === filtro.valor;
    }

    if (filtro.tipo === "serviceLine") {
        return serviceLine.serviceLine === filtro.valor;
    }

    return true;
}

function ordenarServiceLines(lista, ordenacao) {
    const listaOrdenada = [...lista];

    switch (ordenacao) {
        case "az":
            listaOrdenada.sort((a, b) =>
                obterNomeServiceLine(a).localeCompare(obterNomeServiceLine(b), "pt")
            );
            break;

        case "za":
            listaOrdenada.sort((a, b) =>
                obterNomeServiceLine(b).localeCompare(obterNomeServiceLine(a), "pt")
            );
            break;

        case "antigos":
            listaOrdenada.sort((a, b) => {
                const dataA = new Date(a.updated_service || 0);
                const dataB = new Date(b.updated_service || 0);

                return dataA - dataB;
            });
            break;

        case "recentes":
        default:
            listaOrdenada.sort((a, b) => {
                const dataA = new Date(a.updated_service || 0);
                const dataB = new Date(b.updated_service || 0);

                return dataB - dataA;
            });
            break;
    }

    return listaOrdenada;
}

function TabServiceLine({ onRegisterAdicionar }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [ordenacao, setOrdenacao] = useState("recentes");
    const [filtro, setFiltro] = useState({
        tipo: "todos",
        valor: "",
        label: "Todos",
    });

    const [serviceLines, setServiceLines] = useState([]);
    const [learningPaths, setLearningPaths] = useState([]);
    const [isLoadingServiceLines, setIsLoadingServiceLines] = useState(true);
    const [serviceLineAEliminar, setServiceLineAEliminar] = useState(null);
    const [utilizadoresElegiveis, setUtilizadoresElegiveis] = useState([]);

    const [isServiceLineModalOpen, setIsServiceLineModalOpen] = useState(false);
    const [serviceLineToEdit, setServiceLineToEdit] = useState(null);

    const carregarServiceLines = async () => {
        try {
            setIsLoadingServiceLines(true);
            const [sls, lps] = await Promise.all([
                obterServiceLinesNormalizadas(),
                obterLearningPathsNormalizados()
            ]);
            setServiceLines(sls);
            setLearningPaths(lps);
        } catch (error) {
            console.error("Erro ao carregar service lines e learning paths:", error);
            setServiceLines([]);
            setLearningPaths([]);
        } finally {
            setIsLoadingServiceLines(false);
        }
    };

    useEffect(() => {
        carregarServiceLines();
    }, []);

    const carregarLideresElegiveis = async (idSL) => {
        try {
            const lista = await obterLideresElegiveis(idSL);
            setUtilizadoresElegiveis(lista);
        } catch (err) {
            console.error("Erro ao carregar líderes elegíveis:", err);
            setUtilizadoresElegiveis([]);
        }
    };

    const handleOpenCreateModal = useCallback(() => {
        setServiceLineToEdit(null);
        carregarLideresElegiveis(null);
        setIsServiceLineModalOpen(true);
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

    const handleOpenEditModal = (serviceLine) => {
        const idSL = obterIdServiceLine(serviceLine);
        setServiceLineToEdit({
            ...serviceLine,
            id: idSL,
            id_service_line: idSL,
            nome: serviceLine.nome_service_line ?? serviceLine.nomeServiceLine ?? serviceLine.nome ?? "",
            descricao: serviceLine.descricao_service_line ?? serviceLine.descricao ?? "",
            learningPathId: serviceLine.learningPathId ?? serviceLine.id_learning_path ?? "",
            id_lider: serviceLine.id_lider ?? serviceLine.idLider ?? null,
            lider: serviceLine.lider ?? serviceLine.nome_lider ?? ""
        });

        carregarLideresElegiveis(idSL);
        setIsServiceLineModalOpen(true);
    };

    const handleConfirmDeleteServiceLine = async () => {
        if (!serviceLineAEliminar) {
            return;
        }

        const idSL = obterIdServiceLine(serviceLineAEliminar);

        try {
            await removerServiceLine(idSL);
            await carregarServiceLines();
            setServiceLineAEliminar(null);
        } catch (err) {
            const mensagemErro = err.response?.data?.error || "Erro ao eliminar a Service Line.";
            alert(mensagemErro);
            setServiceLineAEliminar(null);
        }
    };

    const handleSaveServiceLine = async (serviceLineObj) => {
        try {
            const idExistente = serviceLineToEdit ? obterIdServiceLine(serviceLineToEdit) : null;

            if (idExistente) {
                await atualizarServiceLine(idExistente, serviceLineObj);
            } else {
                await criarServiceLine(serviceLineObj);
            }

            await carregarServiceLines();
        } catch (err) {
            const mensagemErro = err.response?.data?.error || "Erro ao guardar a Service Line.";
            alert(mensagemErro);
        }
    };

    const opcoesFiltroAvancado = useMemo(() => {
        return {
            learningPath: criarOpcoesUnicas(serviceLines, "learningPath"),
            serviceLine: criarOpcoesUnicas(serviceLines, "serviceLine"),
            area: [],
        };
    }, [serviceLines]);

    const serviceLinesVisiveis = useMemo(() => {
        let lista = [...serviceLines];

        const pesquisaNormalizada = normalizarTexto(searchTerm).trim();

        if (pesquisaNormalizada) {
            lista = lista.filter((serviceLine) => {
                const camposPesquisaveis = [
                    serviceLine.nome,
                    serviceLine.nome_service_line,
                    serviceLine.serviceLine,
                    serviceLine.learningPath,
                    serviceLine.nome_learning_path,
                ];

                return camposPesquisaveis.some((campo) =>
                    normalizarTexto(campo).includes(pesquisaNormalizada)
                );
            });
        }

        lista = lista.filter((serviceLine) =>
            serviceLineCumpreFiltro(serviceLine, filtro)
        );

        return ordenarServiceLines(lista, ordenacao);
    }, [serviceLines, searchTerm, filtro, ordenacao]);

    const metricas = useMemo(() => {
        const totalAreas = serviceLines.reduce(
            (acc, serviceLine) => acc + Number(serviceLine.totalAreas ?? 0),
            0
        );

        const totalLearningPaths = new Set(
            serviceLines
                .map((serviceLine) => serviceLine.learningPath)
                .filter(Boolean)
        ).size;

        return [
            {
                titulo: "Service Lines",
                valor: serviceLines.length,
                icon: "fi-br-diagram-project",
            },
            {
                titulo: "Áreas",
                valor: totalAreas,
                icon: "fi-br-target",
            },
            {
                titulo: "Learning Paths",
                valor: totalLearningPaths,
                icon: "fi-br-road",
            },
        ];
    }, [serviceLines]);

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
                    placeholderPesquisa="Pesquisar Service Line..."
                />

                <MetricasResumo metricas={metricas} />

                <div className="editar-badges-resultados">
                    <VistaTabelaServiceLines
                        serviceLines={serviceLinesVisiveis}
                        isLoading={isLoadingServiceLines}
                        onEdit={handleOpenEditModal}
                        onDelete={setServiceLineAEliminar}
                    />
                </div>
            </div>

            <ServiceLineModal
                isOpen={isServiceLineModalOpen}
                onClose={() => setIsServiceLineModalOpen(false)}
                onSave={handleSaveServiceLine}
                serviceLineToEdit={serviceLineToEdit}
                utilizadoresElegiveis={utilizadoresElegiveis}
                learningPaths={learningPaths}
            />

            <ModalConfirmacao
                isOpen={!!serviceLineAEliminar}
                onClose={() => setServiceLineAEliminar(null)}
                onConfirm={handleConfirmDeleteServiceLine}
                titulo="Eliminar service line"
                mensagem={`Tem a certeza que pretende eliminar a service line "${obterNomeServiceLine(
                    serviceLineAEliminar || {}
                )}"?`}
                textoConfirmar="Eliminar"
                textoCancelar="Cancelar"
                isDanger={true}
            />
        </>
    );
}

export default TabServiceLine;