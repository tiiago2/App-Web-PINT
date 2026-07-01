import React, { useCallback, useEffect, useMemo, useState } from "react";
import GaleriaToolbar from "../../../components/Galeria/GaleriaToolbar/GaleriaToolbar";
import MetricasResumo from "../../../components/ui/MetricasResumo/MetricasResumo";
import VistaTabelaServiceLines from "../../../components/Gestao/VistaTabelaServiceLines/VistaTabelaServiceLines";
import ModalConfirmacao from "../../../components/ui/ModalConfirmacao/ModalConfirmacao";
import ServiceLineModal from "../../../components/Criar_Editar/ServiceLineModal";
import { normalizarServiceLine } from "../../../utils/gestaoNormalizadores";
import { obterServiceLinesNormalizadas } from "../../../services/gestaoService";

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
    const [isLoadingServiceLines, setIsLoadingServiceLines] = useState(true);
    const [serviceLineAEliminar, setServiceLineAEliminar] = useState(null);

    const [isServiceLineModalOpen, setIsServiceLineModalOpen] = useState(false);
    const [serviceLineToEdit, setServiceLineToEdit] = useState(null);

    useEffect(() => {
        let ativo = true;

        async function carregarServiceLines() {
            try {
                setIsLoadingServiceLines(true);

                const serviceLinesNormalizadas =
                    await obterServiceLinesNormalizadas();

                if (ativo) {
                    setServiceLines(serviceLinesNormalizadas);
                }
            } catch (error) {
                console.error("Erro ao carregar service lines:", error);

                if (ativo) {
                    setServiceLines([]);
                }
            } finally {
                if (ativo) {
                    setIsLoadingServiceLines(false);
                }
            }
        }

        carregarServiceLines();

        return () => {
            ativo = false;
        };
    }, []);

    const handleOpenCreateModal = useCallback(() => {
        setServiceLineToEdit(null);
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
        setServiceLineToEdit({
            ...serviceLine,
            nome:
                serviceLine.nome_service_line ??
                serviceLine.nomeServiceLine ??
                serviceLine.nome ??
                serviceLine.serviceLine ??
                "",
            descricao:
                serviceLine.descricao_service_line ??
                serviceLine.descricao ??
                "",
            learningPathId:
                serviceLine.learningPathId ??
                serviceLine.id_learning_path ??
                serviceLine.idLearningPath ??
                "",
        });

        setIsServiceLineModalOpen(true);
    };

    const handleDeleteServiceLine = (id) => {
        setServiceLines((prev) =>
            prev.filter((serviceLine) => obterIdServiceLine(serviceLine) !== id)
        );
    };

    const handleConfirmDeleteServiceLine = () => {
        if (!serviceLineAEliminar) {
            return;
        }

        handleDeleteServiceLine(obterIdServiceLine(serviceLineAEliminar));
        setServiceLineAEliminar(null);
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
                icon: "fi-br-crosshairs",
            },
            {
                titulo: "Learning Paths",
                valor: totalLearningPaths,
                icon: "fi-br-road",
            },
        ];
    }, [serviceLines]);

    const handleSaveServiceLine = (serviceLineObj) => {
        const serviceLineNormalizada = normalizarServiceLine({
            ...serviceLineObj,
            id_service_line:
                serviceLineObj.id_service_line ??
                serviceLineObj.idServiceLine ??
                serviceLineObj.id ??
                Date.now(),
            updated_service:
                serviceLineObj.updated_service ??
                new Date().toISOString(),
        });

        const idServiceLineGuardada = obterIdServiceLine(serviceLineNormalizada);

        setServiceLines((prev) => {
            const exists = prev.some(
                (serviceLine) =>
                    obterIdServiceLine(serviceLine) === idServiceLineGuardada
            );

            if (exists) {
                return prev.map((serviceLine) =>
                    obterIdServiceLine(serviceLine) === idServiceLineGuardada
                        ? serviceLineNormalizada
                        : serviceLine
                );
            }

            return [serviceLineNormalizada, ...prev];
        });
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