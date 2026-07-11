import { useEffect, useMemo, useState } from "react";
import SeletorAbas from "../../ui/SeletorAbas/SeletorAbas_Galeria";
import GaleriaSugeridos from "../GaleriaSugeridos/GaleriaSugeridos";
import GaleriaTodosBadges from "../GaleriaTodosBadges/GaleriaTodosBadges";
import GaleriaToolbar from "../GaleriaToolbar/GaleriaToolbar";
import FiltroEstadoBadges from "../FiltroEstadoBadges/FiltroEstadoBadges";
import ModalConfirmacao from "../../ui/ModalConfirmacao/ModalConfirmacao";
import ToastNotificacao from "../../ui/ToastNotificacao/ToastNotificacao";
import BotaoExportar from "../../ui/BotaoExportar/BotaoExportar";
import BadgeDetalheModal from "../../BadgeDetalhe/BadgeDetalheModal";
import {
    obterMeuBadge,
    criarOuObterRascunho,
    submeterMinhaCandidatura,
    guardarEvidencia,
    removerEvidencia,
    obterUrlPublicaDoBadge,
    obterUrlPartilhaLinkedInDoBadge,
} from "../../../services/badgeDetalheService";
import {
    obterBadgesCatalogoNormalizados,
    obterBadgesConsultorNormalizados,
    obterBadge,
} from "../../../services/badgesService";
import { normalizarBadgeDetalheCatalogo } from "../../../utils/badgeDetalheNormalizadores";
import "./GaleriaBadges.css";
import {
    obterRoleAutenticada,
    obterUtilizadorAutenticadoBasico,
    verificarPermissaoExportacaoBadges,
    verificarPermissaoPartilhaLinkedIn,
} from "../../../services/permissoesService";

function normalizarTexto(texto = "") {
    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function obterIdBadge(badge = {}) {
    return badge.id_badge ?? badge.idBadge ?? badge.id;
}

function obterNomeRequisito(requisito = {}) {
    return (
        requisito.nome_requisito ??
        requisito.nomeRequisito ??
        requisito.nome ??
        "requisito"
    );
}

function obterDescricaoRequisito(requisito = {}) {
    return (
        requisito.descricao_requisito ??
        requisito.descricaoRequisito ??
        requisito.descricao ??
        obterNomeRequisito(requisito)
    );
}

function obterNomeFicheiro(ficheiro) {
    if (!ficheiro) {
        return "ficheiro selecionado";
    }

    if (typeof ficheiro === "string") {
        return ficheiro;
    }

    return ficheiro.name ?? "ficheiro selecionado";
}

function obterMensagemErroOperacao(error) {
    const status = error.response?.status;
    const codigo = error.response?.data?.codigo;
    const mensagem = error.response?.data?.error;

    if (status === 401) {
        return "Sessão inválida. Inicia sessão novamente.";
    }

    if (codigo === "rascunho_inexistente") {
        return "Cria ou continua um rascunho antes de anexar evidências.";
    }

    if (codigo === "submissao_nao_editavel") {
        return "Esta candidatura já não pode ser editada.";
    }

    if (codigo === "ficheiro_obrigatorio") {
        return "Seleciona um ficheiro antes de continuar.";
    }

    if (codigo === "multipart_invalido") {
        return "Não foi possível processar o ficheiro enviado.";
    }

    if (codigo === "requisitos_incompletos") {
        return "Completa todos os requisitos antes de submeter a candidatura.";
    }

    if (codigo === "badge_sem_requisitos") {
        return "Este badge nao tem requisitos ativos para submeter.";
    }

    if (status === 404) {
        return "O badge, requisito ou evidência já não existe.";
    }

    if (status === 409) {
        return mensagem || "A operação não pode ser concluída neste estado.";
    }

    return mensagem || "Não foi possível concluir a operação.";
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

function criarMensagemConfirmacaoAnexo(anexoPendente, detalheBadge) {
    if (!anexoPendente) {
        return "";
    }

    const nomeFicheiro = obterNomeFicheiro(anexoPendente.ficheiro);
    const descricaoRequisito = obterDescricaoRequisito(
        anexoPendente.requisito
    );

    let mensagem = `Vais anexar o ficheiro "${nomeFicheiro}" ao requisito "${descricaoRequisito}". Queres continuar?`;

    if (detalheBadge?.estado === "bloqueados") {
        mensagem +=
            " Depois de anexares o primeiro requisito, este badge passa para Em Progresso.";
    }

    return mensagem;
}

function obterContextoExportacao({ isConsultor, abaAtual, consultor }) {
    if (isConsultor) {
        const separador =
            abaAtual === "sugeridos" ? "Sugeridos" : "Todos os Badges";
        const nome = consultor?.nome ?? "Consultor";
        const email = consultor?.email ? ` | Email: ${consultor.email}` : "";

        return `Consultor: ${nome}${email} | Separador: ${separador}`;
    }

    const role = obterRoleAutenticada();
    return role === "Service Line Leader"
        ? "Service Line Leader"
        : "Talent Manager";
}

function badgeTemConquistaConfirmada(detalhe) {
    if (!detalhe || typeof detalhe !== "object") {
        return false;
    }

    const estado = String(detalhe.estado ?? "")
        .trim()
        .toLowerCase();
    const estadosConquistados = new Set(["conquistados", "conquistado", "aceite"]);

    return (
        estadosConquistados.has(estado) &&
        !!detalhe.registo &&
        detalhe.registo?.expirado !== true
    );
}

function GaleriaBadges({ modo = "consultor" }) {
    const isConsultor = modo === "consultor";

    const [badgesConsultor, setBadgesConsultor] = useState([]);

    const [abaAtiva, setAbaAtiva] = useState("sugeridos");
    const [pesquisa, setPesquisa] = useState("");
    const [ordenacao, setOrdenacao] = useState("recentes");
    const [filtro, setFiltro] = useState({
        tipo: "todos",
        valor: "",
        label: "Todos",
    });
    const [estadoBadgeAtivo, setEstadoBadgeAtivo] = useState("todos");

    const [isDetalheBadgeOpen, setIsDetalheBadgeOpen] = useState(false);
    const [detalheBadge, setDetalheBadge] = useState(null);
    const [isLoadingDetalheBadge, setIsLoadingDetalheBadge] = useState(false);
    const [isLoadingCatalogo, setIsLoadingCatalogo] = useState(false);
    const [erroCatalogo, setErroCatalogo] = useState("");
    const [anexoPendente, setAnexoPendente] = useState(null);
    const [remocaoPendente, setRemocaoPendente] = useState(null);
    const [requisitosEmProcessamento, setRequisitosEmProcessamento] = useState({});
    const [isCriandoRascunho, setIsCriandoRascunho] = useState(false);
    const [submissaoPendenteConfirmacao, setSubmissaoPendenteConfirmacao] = useState(null);
    const [isSubmetendoCandidatura, setIsSubmetendoCandidatura] = useState(false);
    const [avisoPermissaoLinkedIn, setAvisoPermissaoLinkedIn] = useState(false);
    const [podeExportarBadges, setPodeExportarBadges] = useState(false);
    const [badgesSugeridosExportacao, setBadgesSugeridosExportacao] = useState([]);
    const [badgesTodosExportacao, setBadgesTodosExportacao] = useState([]);
    const [consultorAutenticado, setConsultorAutenticado] = useState(null);
    const [isGerandoCertificado, setIsGerandoCertificado] = useState(false);
    const [toast, setToast] = useState({
        visivel: false,
        mensagem: "",
        tipo: "sucesso",
    });

    const mostrarToast = (mensagem, tipo = "sucesso") => {
        setToast({ visivel: true, mensagem, tipo });
    };
    const fecharToast = () => {
        setToast((prev) => ({ ...prev, visivel: false }));
    };

    const definirProcessamentoRequisito = (idRequisito, ativo) => {
        setRequisitosEmProcessamento((prev) => ({
            ...prev,
            [idRequisito]: ativo,
        }));
    };

    useEffect(() => {
        let ativo = true;

        async function carregarCatalogo() {
            setBadgesConsultor([]);
            setIsLoadingCatalogo(true);
            setErroCatalogo("");

            try {
                const badgesCatalogo = isConsultor
                    ? await obterBadgesConsultorNormalizados()
                    : await obterBadgesCatalogoNormalizados();

                if (ativo) {
                    setBadgesConsultor(badgesCatalogo);
                }
            } catch (error) {
                console.error("Erro ao carregar catálogo de badges:", error);

                if (ativo) {
                    setErroCatalogo("Não foi possível carregar o catálogo de badges.");
                }
            } finally {
                if (ativo) {
                    setIsLoadingCatalogo(false);
                }
            }
        }

        carregarCatalogo();

        return () => {
            ativo = false;
        };
    }, [isConsultor]);

    useEffect(() => {
        let ativo = true;

        async function carregarPermissaoExportacao() {
            const autorizado = await verificarPermissaoExportacaoBadges({ modo });

            if (ativo) {
                setPodeExportarBadges(autorizado);
            }
        }

        carregarPermissaoExportacao();

        return () => {
            ativo = false;
        };
    }, [modo]);

    useEffect(() => {
        if (!isConsultor) {
            setConsultorAutenticado(null);
            return undefined;
        }

        let ativo = true;

        async function carregarConsultorAutenticado() {
            const utilizador = await obterUtilizadorAutenticadoBasico();

            if (ativo) {
                setConsultorAutenticado(utilizador);
            }
        }

        carregarConsultorAutenticado();

        return () => {
            ativo = false;
        };
    }, [isConsultor]);

    const opcoesFiltro = useMemo(() => {
        return {
            learningPath: criarOpcoesUnicas(
                badgesConsultor,
                "learningPath"
            ),
            serviceLine: criarOpcoesUnicas(
                badgesConsultor,
                "serviceLine"
            ),
            area: criarOpcoesUnicas(badgesConsultor, "nomeArea"),
        };
    }, [badgesConsultor]);

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
        let lista = [...badgesConsultor];

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
    }, [badgesConsultor, pesquisa, filtro]);

    const contagensEstadoBadge = useMemo(() => {
        return calcularContagensEstadoBadges(badgesParaContagem);
    }, [badgesParaContagem]);

    const mensagemGaleriaVazia = isLoadingCatalogo
        ? "A carregar badges..."
        : erroCatalogo || undefined;

    const atualizarBadgeConsultorNaGaleria = (detalheAtualizado) => {
        const idBadge = obterIdBadge(detalheAtualizado);

        if (!idBadge) {
            return;
        }

        setBadgesConsultor((prev) =>
            prev.map((badge) => {
                if (Number(obterIdBadge(badge)) !== Number(idBadge)) {
                    return badge;
                }

                return {
                    ...badge,
                    estado: detalheAtualizado.estado,
                    progresso: detalheAtualizado.progresso,
                    data_candidatura:
                        detalheAtualizado.datas?.candidatura ??
                        badge.data_candidatura,
                    data_obtencao:
                        detalheAtualizado.datas?.obtencao ??
                        badge.data_obtencao,
                    data_expiracao:
                        detalheAtualizado.datas?.expiracao ??
                        badge.data_expiracao,
                };
            })
        );
    };

    const handleOpenDetalheBadge = async (badge) => {
        const idBadge = obterIdBadge(badge);

        if (!idBadge) {
            return;
        }

        setDetalheBadge(null);
        setIsLoadingDetalheBadge(true);

        if (isConsultor) {
            setIsDetalheBadgeOpen(true);
        }

        try {
            if (isConsultor) {
                const detalhe = await obterMeuBadge(idBadge, { badgeData: badge });
                setDetalheBadge(detalhe);
                return;
            }

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
            mostrarToast(obterMensagemErroOperacao(error), "erro");

            if (!isConsultor) {
                setIsDetalheBadgeOpen(false);
            }
        } finally {
            setIsLoadingDetalheBadge(false);
        }
    };

    const handleCloseDetalheBadge = () => {
        setIsDetalheBadgeOpen(false);
        setDetalheBadge(null);
        setAnexoPendente(null);
        setRemocaoPendente(null);
        setSubmissaoPendenteConfirmacao(null);
        setRequisitosEmProcessamento({});
    };

    const handleSelecionarFicheiroRequisito = ({ requisito, ficheiro }) => {
        setAnexoPendente({
            requisito,
            ficheiro,
        });
    };

    const handleConfirmarAnexoRequisito = async () => {
        if (!anexoPendente || !detalheBadge) {
            return;
        }

        const idBadge = obterIdBadge(detalheBadge);
        const idRequisito =
            anexoPendente.requisito.id_requisito ??
            anexoPendente.requisito.idRequisito ??
            anexoPendente.requisito.id;

        if (!idBadge || !idRequisito) {
            return;
        }

        definirProcessamentoRequisito(idRequisito, true);

        try {
            const resposta = await guardarEvidencia(
                idBadge,
                idRequisito,
                anexoPendente.ficheiro,
                { badgeData: detalheBadge }
            );
            const detalheAtualizado = resposta.badge;

            setDetalheBadge(detalheAtualizado);
            atualizarBadgeConsultorNaGaleria(detalheAtualizado);
            mostrarToast(
                resposta.substituida
                    ? "Evidência substituída com sucesso."
                    : "Evidência anexada com sucesso."
            );
        } catch (error) {
            console.error("Erro ao anexar requisito:", error);
            mostrarToast(obterMensagemErroOperacao(error), "erro");
        } finally {
            definirProcessamentoRequisito(idRequisito, false);
            setAnexoPendente(null);
        }
    };

    const handleCriarOuObterRascunho = async (badgeDetalhe) => {
        const idBadge = obterIdBadge(badgeDetalhe);

        if (!idBadge) {
            return;
        }

        setIsCriandoRascunho(true);

        try {
            const resposta = await criarOuObterRascunho(idBadge, {
                badgeData: badgeDetalhe,
            });
            const detalheAtualizado = resposta.badge;

            setDetalheBadge(detalheAtualizado);
            atualizarBadgeConsultorNaGaleria(detalheAtualizado);
            mostrarToast(
                resposta.reutilizado
                    ? "Rascunho existente carregado."
                    : "Rascunho criado com sucesso."
            );
        } catch (error) {
            console.error("Erro ao criar ou obter rascunho:", error);
            mostrarToast(obterMensagemErroOperacao(error), "erro");
        } finally {
            setIsCriandoRascunho(false);
        }
    };

    const handleSolicitarSubmeterCandidatura = (badgeDetalhe) => {
        setSubmissaoPendenteConfirmacao(badgeDetalhe);
    };

    const handleConfirmarSubmeterCandidatura = async () => {
        if (isSubmetendoCandidatura) {
            return;
        }

        const badgeOrigem = submissaoPendenteConfirmacao ?? detalheBadge;
        const idBadge = obterIdBadge(badgeOrigem);

        if (!idBadge) {
            return;
        }

        setIsSubmetendoCandidatura(true);

        try {
            const resposta = await submeterMinhaCandidatura(idBadge, {
                badgeData: badgeOrigem,
            });
            const detalheAtualizado = resposta.badge;

            setDetalheBadge(detalheAtualizado);
            atualizarBadgeConsultorNaGaleria(detalheAtualizado);
            setSubmissaoPendenteConfirmacao(null);
            mostrarToast("Candidatura submetida com sucesso.");
        } catch (error) {
            console.error("Erro ao submeter candidatura:", error);
            mostrarToast(obterMensagemErroOperacao(error), "erro");
        } finally {
            setIsSubmetendoCandidatura(false);
        }
    };

    const handleSolicitarRemoverEvidencia = ({ requisito }) => {
        setRemocaoPendente({ requisito });
    };

    const handleConfirmarRemoverEvidencia = async () => {
        if (!remocaoPendente || !detalheBadge) {
            return;
        }

        const idBadge = obterIdBadge(detalheBadge);
        const idRequisito =
            remocaoPendente.requisito.id_requisito ??
            remocaoPendente.requisito.idRequisito ??
            remocaoPendente.requisito.id;

        if (!idBadge || !idRequisito) {
            return;
        }

        definirProcessamentoRequisito(idRequisito, true);

        try {
            const resposta = await removerEvidencia(idBadge, idRequisito, {
                badgeData: detalheBadge,
            });
            const detalheAtualizado = resposta.badge;

            setDetalheBadge(detalheAtualizado);
            atualizarBadgeConsultorNaGaleria(detalheAtualizado);
            mostrarToast("Evidência removida com sucesso.");
        } catch (error) {
            console.error("Erro ao remover evidência:", error);
            mostrarToast(obterMensagemErroOperacao(error), "erro");
        } finally {
            definirProcessamentoRequisito(idRequisito, false);
            setRemocaoPendente(null);
        }
    };

    const handleVerPaginaPublicaBadge = (badgeDetalhe) => {
        const idBadge = obterIdBadge(badgeDetalhe);

        if (!idBadge) {
            return;
        }

        const urlPublica =
            badgeDetalhe?.urlPublica ?? obterUrlPublicaDoBadge(idBadge);

        window.open(urlPublica, "_blank", "noopener,noreferrer");
    };

    const handleCopiarLinkPublicoBadge = async (badgeDetalhe) => {
        const idBadge = obterIdBadge(badgeDetalhe);

        if (!idBadge) {
            return;
        }

        const urlPublica =
            badgeDetalhe?.urlPublica ?? obterUrlPublicaDoBadge(idBadge);

        const urlAbsoluta = `${window.location.origin}${urlPublica}`;

        try {
            await navigator.clipboard.writeText(urlAbsoluta);
            mostrarToast("Link público copiado.", "sucesso");
        } catch (error) {
            console.error("Erro ao copiar link público:", error);
            window.prompt("Copia o link público:", urlAbsoluta);
        }
    };

    const handlePartilharLinkedIn = async (badgeDetalhe) => {
        const idBadge = obterIdBadge(badgeDetalhe);

        if (!idBadge) {
            return;
        }

        const temPermissao = await verificarPermissaoPartilhaLinkedIn();

        if (!temPermissao) {
            setAvisoPermissaoLinkedIn(true);
            return;
        }

        const urlLinkedIn = obterUrlPartilhaLinkedInDoBadge(idBadge);

        window.open(urlLinkedIn, "_blank", "noopener,noreferrer");
    };

    const obterListaAtualExportacao = () => {
        if (isConsultor && abaAtual === "sugeridos") {
            return badgesSugeridosExportacao;
        }

        return badgesTodosExportacao;
    };

    const tratarErroExportacao = (error) => {
        if (error?.codigo === "sem_badges_para_exportar") {
            mostrarToast("Não existem badges para exportar.", "erro");
            return;
        }

        console.error("Erro ao exportar badges:", error);
        mostrarToast("Não foi possível exportar os badges.", "erro");
    };

    const handleExportarExcel = async () => {
        try {
            const { exportarBadgesExcel } = await import(
                "../../../utils/exportarBadges"
            );

            await exportarBadgesExcel({
                badges: obterListaAtualExportacao(),
                titulo: isConsultor
                    ? "Galeria de Badges do Consultor"
                    : "Galeria de Badges",
                contexto: obterContextoExportacao({
                    isConsultor,
                    abaAtual,
                    consultor: consultorAutenticado,
                }),
                tipo: isConsultor ? "consultor" : "catalogo",
                nomeFicheiro: isConsultor
                    ? "Galeria_Badges_Consultor"
                    : "Galeria_Badges_Talent_Service",
            });
        } catch (error) {
            tratarErroExportacao(error);
        }
    };

    const handleExportarPDF = async () => {
        try {
            const { exportarBadgesPdf } = await import(
                "../../../utils/exportarBadges"
            );

            await exportarBadgesPdf({
                badges: obterListaAtualExportacao(),
                titulo: isConsultor
                    ? "Galeria de Badges do Consultor"
                    : "Galeria de Badges",
                contexto: obterContextoExportacao({
                    isConsultor,
                    abaAtual,
                    consultor: consultorAutenticado,
                }),
                tipo: isConsultor ? "consultor" : "catalogo",
                nomeFicheiro: isConsultor
                    ? "Galeria_Badges_Consultor"
                    : "Galeria_Badges_Talent_Service",
            });
        } catch (error) {
            tratarErroExportacao(error);
        }
    };

    const handleDownloadCertificadoBadge = async (badgeDetalhe) => {
        if (
            !isConsultor ||
            !podeExportarBadges ||
            !badgeTemConquistaConfirmada(badgeDetalhe) ||
            isGerandoCertificado
        ) {
            return;
        }

        setIsGerandoCertificado(true);

        try {
            const { gerarCertificadoBadgePdf } = await import(
                "../../../utils/gerarCertificadoBadgePdf"
            );
            const idBadge = obterIdBadge(badgeDetalhe);
            const urlPublica =
                badgeDetalhe?.urlPublica ?? obterUrlPublicaDoBadge(idBadge);

            await gerarCertificadoBadgePdf({
                badge: badgeDetalhe,
                consultor: consultorAutenticado,
                urlPublica: `${window.location.origin}${urlPublica}`,
            });
        } catch (error) {
            console.error("Erro ao gerar certificado do badge:", error);
            mostrarToast(
                "Não foi possível gerar o certificado do badge.",
                "erro"
            );
        } finally {
            setIsGerandoCertificado(false);
        }
    };

    return (
        <main className="galeria-badges-page">
            <div className="galeria-badges-topo">
                <div className="galeria-badges-topo-esquerda">
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
                                    {
                                        valor: "todos",
                                        label: "Todos os Badges",
                                    },
                                ]}
                            />
                        </div>
                    )}
                </div>

                {podeExportarBadges && (
                    <div className="galeria-badges-topo-acoes">
                        <BotaoExportar
                            onExportarExcel={handleExportarExcel}
                            onExportarPDF={handleExportarPDF}
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
                        <GaleriaSugeridos
                            badges={badgesConsultor}
                            onBadgeClick={handleOpenDetalheBadge}
                            onBadgesSugeridosChange={setBadgesSugeridosExportacao}
                        />
                    )}

                    {abaAtual === "todos" && (
                        <GaleriaTodosBadges
                            modo={modo}
                            badges={badgesConsultor}
                            pesquisa={pesquisa}
                            ordenacao={ordenacao}
                            filtro={filtro}
                            estadoAtivo={
                                isConsultor ? estadoBadgeAtivo : "todos"
                            }
                            mostrarEstado={isConsultor}
                            onBadgeClick={handleOpenDetalheBadge}
                            emptyMessage={mensagemGaleriaVazia}
                            onBadgesFiltradosChange={setBadgesTodosExportacao}
                        />
                    )}
                </div>
            </div>

            <BadgeDetalheModal
                isOpen={isDetalheBadgeOpen}
                onClose={handleCloseDetalheBadge}
                modo={isConsultor ? "consultor" : "catalogo"}
                detalhe={detalheBadge}
                isLoading={isLoadingDetalheBadge}
                onSelecionarFicheiroRequisito={
                    isConsultor ? handleSelecionarFicheiroRequisito : undefined
                }
                onRemoverFicheiroRequisito={
                    isConsultor ? handleSolicitarRemoverEvidencia : undefined
                }
                requisitosEmProcessamento={requisitosEmProcessamento}
                onCriarOuObterRascunho={
                    isConsultor ? handleCriarOuObterRascunho : undefined
                }
                onSubmeterCandidatura={
                    isConsultor ? handleSolicitarSubmeterCandidatura : undefined
                }
                isProcessandoRascunho={isCriandoRascunho}
                isSubmetendoCandidatura={isSubmetendoCandidatura}
                onVerPaginaPublica={handleVerPaginaPublicaBadge}
                onCopiarLinkPublico={handleCopiarLinkPublicoBadge}
                onPartilharLinkedIn={
                    isConsultor ? handlePartilharLinkedIn : undefined
                }
                acaoCertificado={
                    isConsultor &&
                    podeExportarBadges &&
                    detalheBadge &&
                    badgeTemConquistaConfirmada(detalheBadge)
                        ? {
                              onDownload: handleDownloadCertificadoBadge,
                              emProcessamento: isGerandoCertificado,
                          }
                        : null
                }
            />

            <ModalConfirmacao
                isOpen={isConsultor && avisoPermissaoLinkedIn}
                onClose={() => setAvisoPermissaoLinkedIn(false)}
                onConfirm={() => setAvisoPermissaoLinkedIn(false)}
                titulo="Sem autorização"
                mensagem="Não tens autorização para partilhar badges no LinkedIn. Esta permissão pode ser ativada nas definições pelo Administrador."
                textoConfirmar="Compreendido"
                textoCancelar="Fechar"
                isDanger={false}
            />

            <ModalConfirmacao
                isOpen={isConsultor && !!anexoPendente}
                onClose={() => setAnexoPendente(null)}
                onConfirm={handleConfirmarAnexoRequisito}
                titulo="Anexar requisito"
                mensagem={criarMensagemConfirmacaoAnexo(
                    anexoPendente,
                    detalheBadge
                )}
                textoConfirmar="Anexar requisito"
                textoCancelar="Cancelar"
                isDanger={false}
            />

            <ModalConfirmacao
                isOpen={isConsultor && !!submissaoPendenteConfirmacao}
                onClose={() => setSubmissaoPendenteConfirmacao(null)}
                onConfirm={handleConfirmarSubmeterCandidatura}
                titulo="Submeter candidatura"
                mensagem="Vais submeter esta candidatura para avaliaÃ§Ã£o. Queres continuar?"
                textoConfirmar={
                    isSubmetendoCandidatura
                        ? "A submeter..."
                        : "Submeter candidatura"
                }
                textoCancelar="Cancelar"
                isDanger={false}
            />

            <ModalConfirmacao
                isOpen={isConsultor && !!remocaoPendente}
                onClose={() => setRemocaoPendente(null)}
                onConfirm={handleConfirmarRemoverEvidencia}
                titulo="Remover evidência"
                mensagem={
                    remocaoPendente
                        ? `Vais remover a evidência do requisito "${obterDescricaoRequisito(remocaoPendente.requisito)}". Queres continuar?`
                        : ""
                }
                textoConfirmar="Remover evidência"
                textoCancelar="Cancelar"
                isDanger
            />

            <ToastNotificacao
                visivel={toast.visivel}
                mensagem={toast.mensagem}
                tipo={toast.tipo}
                onFechar={fecharToast}
            />
        </main>
    );
}

export default GaleriaBadges;
