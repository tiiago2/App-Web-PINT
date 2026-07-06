import {
    badgesCatalogoMock,
    badgesConsultorEstadoMock,
    requisitosMock,
    requisitosBadgeMock,
    badgeDetalheConsultorMock,
} from "../data/mocks";
import api from "./api";

import {
    normalizarBadgeDetalheCatalogo,
    normalizarBadgeDetalheConsultor,
    obterUrlPublicaBadge,
    ESTADOS_BADGE_CONSULTOR,
} from "../utils/badgeDetalheNormalizadores";
import { normalizarBadgeCatalogo } from "../utils/badgesNormalizadores";

function clonar(valor) {
    return JSON.parse(JSON.stringify(valor));
}

let submissoesMockLocal = clonar(badgeDetalheConsultorMock.submissoes);
let documentosMockLocal = clonar(badgeDetalheConsultorMock.documentos);
let historicoMockLocal = clonar(badgeDetalheConsultorMock.historico);
let registoBadgesMockLocal = clonar(badgeDetalheConsultorMock.registoBadges);

const estadoOverridePorBadge = new Map();

function obterBadgeCatalogoPorId(idBadge, badgeData = null) {
    if (badgeData) {
        return normalizarBadgeCatalogo({
            ...badgeData,
            id_badge:
                badgeData.id_badge ??
                badgeData.idBadge ??
                badgeData.id ??
                Number(idBadge),
        });
    }

    const encontrado = badgesCatalogoMock.find(
        (badge) => Number(badge.id_badge) === Number(idBadge)
    );

    return encontrado
        ? normalizarBadgeCatalogo(encontrado)
        : null;
}
function normalizarStatus(status) {
    return typeof status === "string" ? status.trim().toLowerCase() : "";
}

function criarDetalheConsultorSemEstado(idBadge, badgeData = null) {
    const badge = obterBadgeCatalogoPorId(idBadge, badgeData);

    if (!badge) {
        return null;
    }

    const requisitos = badgeData
        ? Array.isArray(badge.requisitos)
            ? badge.requisitos
            : []
        : obterRequisitosPorBadge(idBadge);

    const detalhe = normalizarBadgeDetalheConsultor({
        badge,
        requisitos,
        estadoConsultor: {
            id_badge: Number(idBadge),
            estado: ESTADOS_BADGE_CONSULTOR.BLOQUEADO,
            progresso: 0,
            data_candidatura: null,
            data_obtencao: null,
            data_expiracao: null,
        },
        submissao: null,
        documentos: [],
        historico: null,
        registo: null,
    });

    return {
        ...detalhe,
        podeAnexarRequisitos: false,
        podeSubmeterCandidatura: false,
    };
}

function normalizarMeuBadgeBackend(badgePessoal, badgeData = null) {
    if (!badgePessoal) {
        return null;
    }

    const idBadge =
        badgePessoal.id_badge ??
        badgeData?.id_badge ??
        badgeData?.idBadge ??
        badgeData?.id;
    const badge = obterBadgeCatalogoPorId(idBadge, badgeData);

    if (!badge) {
        return null;
    }

    const requisitos = Array.isArray(badgePessoal.requisitos)
        ? badgePessoal.requisitos
        : [];
    const documentos = requisitos
        .map((requisito) => {
            if (!requisito.documento) {
                return null;
            }

            return {
                ...requisito.documento,
                id_requisito: requisito.id_requisito,
                id_submissao:
                    requisito.documento.id_submissao ??
                    badgePessoal.submissao?.id_submissao ??
                    null,
                deleted_file: false,
            };
        })
        .filter(Boolean);
    const statusSubmissao = normalizarStatus(badgePessoal.submissao?.status);
    const detalhe = normalizarBadgeDetalheConsultor({
        badge,
        requisitos,
        estadoConsultor: {
            ...badgePessoal,
            estado: badgePessoal.estado ?? ESTADOS_BADGE_CONSULTOR.BLOQUEADO,
            progresso: badgePessoal.progresso ?? 0,
        },
        submissao: badgePessoal.submissao,
        documentos,
        historico: badgePessoal.avaliacao,
        registo: badgePessoal.registo,
    });

    const progresso = badgePessoal.progresso ?? detalhe.progresso ?? 0;

    return {
        ...detalhe,
        ...badgePessoal,
        modo: "consultor",
        badge: detalhe.badge,
        requisitos: detalhe.requisitos,
        estado: badgePessoal.estado ?? detalhe.estado,
        estadoLabel: detalhe.estadoLabel,
        progresso,
        totalRequisitos:
            badgePessoal.documentos?.total_requisitos ?? detalhe.totalRequisitos,
        requisitosAnexados:
            badgePessoal.documentos?.requisitos_anexados ?? detalhe.requisitosAnexados,
        submissao: detalhe.submissao,
        registo: badgePessoal.registo,
        avaliacao: badgePessoal.avaliacao,
        documentos: badgePessoal.documentos,
        inconsistencias: badgePessoal.inconsistencias ?? [],
        datas: {
            candidatura: badgePessoal.data_candidatura ?? null,
            obtencao: badgePessoal.data_obtencao ?? null,
            expiracao: badgePessoal.data_expiracao ?? null,
            avaliacao: badgePessoal.avaliacao?.data_avaliacao ?? null,
        },
        podeAnexarRequisitos: statusSubmissao === "em_progresso",
        podeSubmeterCandidatura:
            statusSubmissao === "em_progresso" && Number(progresso) === 100,
        podePartilharConquista:
            badgePessoal.estado === ESTADOS_BADGE_CONSULTOR.CONQUISTADO,
        urlPublica: obterUrlPublicaBadge(idBadge),
    };
}

function normalizarRespostaComBadge(resposta, badgeData = null) {
    return {
        ...resposta,
        badge: normalizarMeuBadgeBackend(resposta?.badge, badgeData),
    };
}

function obterEstadoConsultorPorBadge(idBadge) {
    const estadoBase = badgesConsultorEstadoMock.find(
        (estado) => Number(estado.id_badge) === Number(idBadge)
    );

    const estadoOverride = estadoOverridePorBadge.get(Number(idBadge));

    if (!estadoOverride) {
        return estadoBase ?? null;
    }

    return {
        ...(estadoBase ?? {
            id_badge: Number(idBadge),
            progresso: 0,
            data_candidatura: null,
            data_obtencao: null,
            data_expiracao: null,
        }),
        ...estadoOverride,
    };
}

function obterRequisitosPorBadge(idBadge) {
    const idsRequisitosDoBadge = requisitosBadgeMock
        .filter((relacao) => Number(relacao.id_badge) === Number(idBadge))
        .map((relacao) => Number(relacao.id_requisito));

    const requisitos = requisitosMock.filter((requisito) =>
        idsRequisitosDoBadge.includes(Number(requisito.id_requisito))
    );

    // Se o badge não tiver requisitos estáticos mapeados, devolve os requisitos base por defeito
    if (requisitos.length === 0) {
        return requisitosMock.slice(0, 2);
    }

    return requisitos;
}

function obterSubmissaoAtivaPorBadge(idBadge, idUtilizador = 1) {
    const submissoesDoBadge = submissoesMockLocal.filter(
        (submissao) =>
            Number(submissao.id_badge) === Number(idBadge) &&
            Number(submissao.id_utilizador) === Number(idUtilizador)
    );

    if (!submissoesDoBadge.length) {
        return null;
    }

    return [...submissoesDoBadge].sort(
        (a, b) => new Date(b.data_submissao) - new Date(a.data_submissao)
    )[0];
}

function obterDocumentosPorSubmissao(idSubmissao) {
    if (!idSubmissao) {
        return [];
    }

    return documentosMockLocal.filter(
        (documento) => Number(documento.id_submissao) === Number(idSubmissao)
    );
}

function obterHistoricoPorSubmissao(idSubmissao, idUtilizador = 1) {
    if (!idSubmissao) {
        return null;
    }

    return (
        historicoMockLocal.find(
            (historico) =>
                Number(historico.id_submissao) === Number(idSubmissao) &&
                Number(historico.id_utilizador) === Number(idUtilizador)
        ) ?? null
    );
}

function obterRegistoPorBadge(idBadge, idUtilizador = 1) {
    return (
        registoBadgesMockLocal.find(
            (registo) =>
                Number(registo.id_badge) === Number(idBadge) &&
                Number(registo.id_utilizador) === Number(idUtilizador)
        ) ?? null
    );
}

function criarSubmissaoEmProgresso(idBadge, idUtilizador = 1) {
    const novoIdSubmissao =
        Math.max(
            0,
            ...submissoesMockLocal.map((submissao) =>
                Number(submissao.id_submissao)
            )
        ) + 1;

    const novaSubmissao = {
        id_submissao: novoIdSubmissao,
        id_badge: Number(idBadge),
        id_utilizador: Number(idUtilizador),
        status: "em_progresso",
        data_submissao: new Date().toISOString(),
    };

    submissoesMockLocal = [novaSubmissao, ...submissoesMockLocal];

    return novaSubmissao;
}

function criarDocumentoParaRequisito({
    idSubmissao,
    idRequisito,
    ficheiro,
}) {
    const novoIdFicheiro =
        Math.max(
            0,
            ...documentosMockLocal.map((documento) =>
                Number(documento.id_ficheiro)
            )
        ) + 1;

    const nomeFicheiro =
        typeof ficheiro === "string"
            ? ficheiro
            : ficheiro?.name ?? "ficheiro-anexado.pdf";

    const novoDocumento = {
        id_submissao: Number(idSubmissao),
        id_ficheiro: novoIdFicheiro,
        id_requisito: Number(idRequisito),
        ficheiro: nomeFicheiro,
        updated_file: new Date().toISOString(),
        deleted_file: false,
    };

    documentosMockLocal = documentosMockLocal.filter(
        (documento) =>
            !(
                Number(documento.id_submissao) === Number(idSubmissao) &&
                Number(documento.id_requisito) === Number(idRequisito)
            )
    );

    documentosMockLocal = [novoDocumento, ...documentosMockLocal];

    return novoDocumento;
}

export async function obterBadgeDetalheCatalogo(idBadge, opcoes = {}) {
    const { badgeData = null } = opcoes;
    const badge = obterBadgeCatalogoPorId(idBadge, badgeData);

    if (!badge) {
        return null;
    }

    const requisitos = obterRequisitosPorBadge(idBadge);

    return normalizarBadgeDetalheCatalogo({
        badge,
        requisitos,
    });
}

export async function obterBadgePublico(idBadge) {
    const textoId = String(idBadge ?? "").trim();

    if (!/^\d+$/.test(textoId)) {
        const erro = new Error("Identificador de badge inválido.");
        erro.response = {
            status: 400,
            data: {
                erro: "Identificador de badge inválido.",
                codigo: "id_badge_invalido",
            },
        };
        throw erro;
    }

    const idNumerico = Number(textoId);
    if (!Number.isSafeInteger(idNumerico) || idNumerico <= 0) {
        const erro = new Error("Identificador de badge inválido.");
        erro.response = {
            status: 400,
            data: {
                erro: "Identificador de badge inválido.",
                codigo: "id_badge_invalido",
            },
        };
        throw erro;
    }

    const res = await api.get(`/badges/public/${idNumerico}`);

    return normalizarBadgeDetalheCatalogo({
        badge: res.data,
        requisitos: Array.isArray(res.data?.requisitos)
            ? res.data.requisitos
            : [],
    });
}

export async function obterBadgeDetalheConsultor(idBadge, opcoes = {}) {
    const { idUtilizador = 1, badgeData = null } = opcoes;

    const badge = obterBadgeCatalogoPorId(idBadge, badgeData);

    if (!badge) {
        return null;
    }

    const requisitos = obterRequisitosPorBadge(idBadge);
    const estadoConsultor = obterEstadoConsultorPorBadge(idBadge);

    const submissao = obterSubmissaoAtivaPorBadge(idBadge, idUtilizador);
    const documentos = obterDocumentosPorSubmissao(submissao?.id_submissao);
    const historico = obterHistoricoPorSubmissao(
        submissao?.id_submissao,
        idUtilizador
    );
    const registo = obterRegistoPorBadge(idBadge, idUtilizador);

    return normalizarBadgeDetalheConsultor({
        badge,
        requisitos,
        estadoConsultor,
        submissao,
        documentos,
        historico,
        registo,
    });
}

export async function obterMeuBadge(idBadge, opcoes = {}) {
    const { badgeData = null } = opcoes;

    try {
        const res = await api.get(`/me/badges/${idBadge}`);
        return normalizarMeuBadgeBackend(res.data, badgeData);
    } catch (error) {
        const mensagem = error.response?.data?.error ?? "";
        if (
            error.response?.status === 404 &&
            mensagem.toLowerCase().includes("pessoal")
        ) {
            const resCatalogo = await api.get(`/badges/${idBadge}`);
            return criarDetalheConsultorSemEstado(idBadge, resCatalogo.data);
        }

        throw error;
    }
}

export async function criarOuObterRascunho(idBadge, opcoes = {}) {
    const { badgeData = null } = opcoes;
    const res = await api.post(`/me/badges/${idBadge}/rascunho`);
    return normalizarRespostaComBadge(res.data, badgeData);
}

export async function submeterMinhaCandidatura(idBadge, opcoes = {}) {
    const { badgeData = null } = opcoes;
    const res = await api.post(`/me/badges/${idBadge}/submeter`);
    return normalizarRespostaComBadge(res.data, badgeData);
}

export async function guardarEvidencia(idBadge, idRequisito, ficheiro, opcoes = {}) {
    const { badgeData = null } = opcoes;
    const formData = new FormData();
    formData.append("ficheiro", ficheiro);

    const res = await api.put(
        `/me/badges/${idBadge}/evidencias/${idRequisito}`,
        formData
    );

    return normalizarRespostaComBadge(res.data, badgeData);
}

export async function removerEvidencia(idBadge, idRequisito, opcoes = {}) {
    const { badgeData = null } = opcoes;
    const res = await api.delete(`/me/badges/${idBadge}/evidencias/${idRequisito}`);
    return normalizarRespostaComBadge(res.data, badgeData);
}

export async function anexarRequisitoAoBadge({
    idBadge,
    idRequisito,
    ficheiro,
    idUtilizador = 1,
}) {
    const badge = obterBadgeCatalogoPorId(idBadge);

    if (!badge) {
        throw new Error("Badge não encontrado.");
    }

    const requisitos = obterRequisitosPorBadge(idBadge);
    const requisitoExiste = requisitos.some(
        (requisito) => Number(requisito.id_requisito) === Number(idRequisito)
    );

    if (!requisitoExiste) {
        throw new Error("O requisito não pertence a este badge.");
    }

    let submissao = obterSubmissaoAtivaPorBadge(idBadge, idUtilizador);

    if (
        !submissao ||
        ["recusada", "recusado", "aceite", "aprovada", "aprovado"].includes(
            String(submissao.status).toLowerCase()
        )
    ) {
        submissao = criarSubmissaoEmProgresso(idBadge, idUtilizador);
    }

    submissao.status = "em_progresso";

    criarDocumentoParaRequisito({
        idSubmissao: submissao.id_submissao,
        idRequisito,
        ficheiro,
    });

    estadoOverridePorBadge.set(Number(idBadge), {
        estado: ESTADOS_BADGE_CONSULTOR.EM_PROGRESSO,
        progresso: undefined,
        data_candidatura: submissao.data_submissao,
        data_obtencao: null,
        data_expiracao: null,
    });

    return obterBadgeDetalheConsultor(idBadge, { idUtilizador });
}

export async function submeterCandidaturaBadge(idBadge, opcoes = {}) {
    const { idUtilizador = 1 } = opcoes;

    let submissao = obterSubmissaoAtivaPorBadge(idBadge, idUtilizador);

    if (!submissao) {
        submissao = criarSubmissaoEmProgresso(idBadge, idUtilizador);
    }

    submissao.status = "pendente";
    submissao.data_submissao = new Date().toISOString();

    estadoOverridePorBadge.set(Number(idBadge), {
        estado: ESTADOS_BADGE_CONSULTOR.PENDENTE,
        progresso: 100,
        data_candidatura: submissao.data_submissao,
        data_obtencao: null,
        data_expiracao: null,
    });

    return obterBadgeDetalheConsultor(idBadge, { idUtilizador });
}

export function obterUrlPublicaDoBadge(idBadge) {
    return obterUrlPublicaBadge(idBadge);
}

export function resetBadgeDetalheMocks() {
    submissoesMockLocal = clonar(badgeDetalheConsultorMock.submissoes);
    documentosMockLocal = clonar(badgeDetalheConsultorMock.documentos);
    historicoMockLocal = clonar(badgeDetalheConsultorMock.historico);
    registoBadgesMockLocal = clonar(badgeDetalheConsultorMock.registoBadges);
    estadoOverridePorBadge.clear();
}

export function obterUrlPartilhaLinkedInDoBadge(idBadge) {
    const urlPublica = obterUrlPublicaDoBadge(idBadge);
    const urlAbsoluta = `${window.location.origin}${urlPublica}`;

    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        urlAbsoluta
    )}`;
}
