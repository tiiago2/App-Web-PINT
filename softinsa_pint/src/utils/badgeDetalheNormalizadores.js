import { normalizarBadgeCatalogo } from "./badgesNormalizadores";

export const ESTADOS_BADGE_CONSULTOR = {
    CONQUISTADO: "conquistados",
    EM_PROGRESSO: "emProgresso",
    PENDENTE: "pendentes",
    EXPIRADO: "expirados",
    RECUSADO: "recusados",
    BLOQUEADO: "bloqueados",
};

export const LABEL_ESTADO_BADGE_CONSULTOR = {
    [ESTADOS_BADGE_CONSULTOR.CONQUISTADO]: "Conquistado",
    [ESTADOS_BADGE_CONSULTOR.EM_PROGRESSO]: "Em Progresso",
    [ESTADOS_BADGE_CONSULTOR.PENDENTE]: "Pendente",
    [ESTADOS_BADGE_CONSULTOR.EXPIRADO]: "Expirado",
    [ESTADOS_BADGE_CONSULTOR.RECUSADO]: "Recusado",
    [ESTADOS_BADGE_CONSULTOR.BLOQUEADO]: "Bloqueado",
};

export const ESTADOS_REQUISITO_DETALHE = {
    POR_ANEXAR: "porAnexar",
    ANEXADO: "anexado",
    SUBMETIDO: "submetido",
};

export function formatarValidade(dias) {
    if (
        dias === null ||
        dias === undefined ||
        (typeof dias === "string" && dias.trim() === "")
    ) {
        return "Vitalício";
    }

    const diasNumericos = Number(dias);

    if (
        Number.isNaN(diasNumericos) ||
        !Number.isInteger(diasNumericos) ||
        diasNumericos <= 0
    ) {
        return "Sem validade definida";
    }

    if (diasNumericos === 1) {
        return "1 dia";
    }

    return `${diasNumericos} dias`;
}

export function obterUrlPublicaBadge(idBadge) {
    return `/badges/${idBadge}`;
}

export function normalizarDocumentoRequisito(documento = null) {
    if (!documento) {
        return null;
    }

    return {
        ...documento,

        idSubmissao: documento.id_submissao,
        id_submissao: documento.id_submissao,

        idFicheiro: documento.id_ficheiro,
        id_ficheiro: documento.id_ficheiro,

        idRequisito: documento.id_requisito,
        id_requisito: documento.id_requisito,

        ficheiro: documento.ficheiro,
        nomeFicheiro: documento.ficheiro,

        updatedFile: documento.updated_file,
        updated_file: documento.updated_file,

        deletedFile: documento.deleted_file === true,
        deleted_file: documento.deleted_file === true,
    };
}

export function normalizarRequisitoDetalhe(
    requisito,
    opcoes = {}
) {
    const {
        documento = null,
        estadoConsultor = ESTADOS_BADGE_CONSULTOR.BLOQUEADO,
    } = opcoes;

    const documentoNormalizado = normalizarDocumentoRequisito(documento);
    const temAnexo = !!documentoNormalizado;

    let estadoRequisito = temAnexo
        ? ESTADOS_REQUISITO_DETALHE.ANEXADO
        : ESTADOS_REQUISITO_DETALHE.POR_ANEXAR;

    if (
        temAnexo &&
        [
            ESTADOS_BADGE_CONSULTOR.PENDENTE,
            ESTADOS_BADGE_CONSULTOR.CONQUISTADO,
            ESTADOS_BADGE_CONSULTOR.RECUSADO,
            ESTADOS_BADGE_CONSULTOR.EXPIRADO,
        ].includes(estadoConsultor)
    ) {
        estadoRequisito = ESTADOS_REQUISITO_DETALHE.SUBMETIDO;
    }

    const id = requisito.id_requisito ?? requisito.idRequisito ?? requisito.id;

    const nome =
        requisito.nome_requisito ??
        requisito.nomeRequisito ??
        requisito.nome ??
        "Requisito sem nome";

    const descricao =
        requisito.descricao_requisito ??
        requisito.descricaoRequisito ??
        requisito.descricao ??
        "";

    return {
        ...requisito,

        id,
        id_requisito: id,
        idRequisito: id,

        nome,
        nome_requisito: nome,
        nomeRequisito: nome,

        descricao,
        descricao_requisito: descricao,

        documento: documentoNormalizado,
        anexo: documentoNormalizado,
        temAnexo,

        estadoRequisito,
    };
}

export function normalizarRequisitosDetalhe(
    requisitos = [],
    opcoes = {}
) {
    return requisitos.map((requisito) =>
        normalizarRequisitoDetalhe(requisito, opcoes)
    );
}

export function normalizarSubmissaoDetalhe(submissao = null) {
    if (!submissao) {
        return null;
    }

    return {
        ...submissao,

        idSubmissao: submissao.id_submissao,
        id_submissao: submissao.id_submissao,

        idBadge: submissao.id_badge,
        id_badge: submissao.id_badge,

        idUtilizador: submissao.id_utilizador,
        id_utilizador: submissao.id_utilizador,

        status: submissao.status,
        dataSubmissao: submissao.data_submissao,
        data_submissao: submissao.data_submissao,
    };
}

export function normalizarHistoricoDetalhe(historico = null) {
    if (!historico) {
        return null;
    }

    return {
        ...historico,

        idUtilizador: historico.id_utilizador,
        id_utilizador: historico.id_utilizador,

        idSubmissao: historico.id_submissao,
        id_submissao: historico.id_submissao,

        aceite: historico.aceite === true,
        feedback: historico.feedback ?? null,

        dataAvaliacao: historico.data_avaliacao,
        data_avaliacao: historico.data_avaliacao,
    };
}

export function determinarEstadoConsultor({
    estadoConsultor,
    submissao,
    historico,
    registo,
} = {}) {
    if (estadoConsultor?.estado) {
        return estadoConsultor.estado;
    }

    if (historico?.aceite === false) {
        return ESTADOS_BADGE_CONSULTOR.RECUSADO;
    }

    if (historico?.aceite === true || registo) {
        return ESTADOS_BADGE_CONSULTOR.CONQUISTADO;
    }

    if (!submissao) {
        return ESTADOS_BADGE_CONSULTOR.BLOQUEADO;
    }

    const status = String(submissao.status || "").toLowerCase();

    if (["pendente", "submetida", "submetido"].includes(status)) {
        return ESTADOS_BADGE_CONSULTOR.PENDENTE;
    }

    if (["recusada", "recusado", "rejeitada", "rejeitado"].includes(status)) {
        return ESTADOS_BADGE_CONSULTOR.RECUSADO;
    }

    if (["aceite", "aprovada", "aprovado"].includes(status)) {
        return ESTADOS_BADGE_CONSULTOR.CONQUISTADO;
    }

    if (["em_progresso", "emprogresso", "rascunho"].includes(status)) {
        return ESTADOS_BADGE_CONSULTOR.EM_PROGRESSO;
    }

    return ESTADOS_BADGE_CONSULTOR.BLOQUEADO;
}

export function normalizarBadgeDetalheCatalogo({
    badge,
    requisitos = [],
} = {}) {
    const badgeNormalizado = normalizarBadgeCatalogo(badge);

    const requisitosNormalizados = normalizarRequisitosDetalhe(requisitos);

    const validadeFormatada = formatarValidade(badgeNormalizado.validade);

    return {
        ...badgeNormalizado,

        modo: "catalogo",

        badge: badgeNormalizado,

        requisitos: requisitosNormalizados,
        totalRequisitos: requisitosNormalizados.length,

        validadeFormatada,

        tipo: badgeNormalizado.especial ? "Especial" : "Normal",

        urlPublica: obterUrlPublicaBadge(badgeNormalizado.id_badge),

        hierarquia: {
            learningPath: badgeNormalizado.learningPath,
            serviceLine: badgeNormalizado.serviceLine,
            area: badgeNormalizado.area,
        },
    };
}

export function normalizarBadgeDetalheConsultor({
    badge,
    requisitos = [],
    estadoConsultor = null,
    submissao = null,
    documentos = [],
    historico = null,
    registo = null,
} = {}) {
    const detalheCatalogo = normalizarBadgeDetalheCatalogo({
        badge,
        requisitos,
    });

    const estado = determinarEstadoConsultor({
        estadoConsultor,
        submissao,
        historico,
        registo,
    });

    const documentosAtivos = documentos.filter(
        (documento) => documento.deleted_file !== true
    );

    const mapaDocumentosPorRequisito = new Map();

    documentosAtivos.forEach((documento) => {
        mapaDocumentosPorRequisito.set(documento.id_requisito, documento);
    });

    const requisitosComAnexos = requisitos.map((requisito) => {
        const idRequisito =
            requisito.id_requisito ??
            requisito.idRequisito ??
            requisito.id;

        return normalizarRequisitoDetalhe(requisito, {
            documento: mapaDocumentosPorRequisito.get(idRequisito) ?? null,
            estadoConsultor: estado,
        });
    });

    const totalRequisitos = requisitosComAnexos.length;
    const requisitosAnexados = requisitosComAnexos.filter(
        (requisito) => requisito.temAnexo
    ).length;

    const progresso =
        estadoConsultor?.progresso ??
        (totalRequisitos > 0
            ? Math.round((requisitosAnexados / totalRequisitos) * 100)
            : 0);

    return {
        ...detalheCatalogo,

        modo: "consultor",

        estado,
        estadoLabel:
            LABEL_ESTADO_BADGE_CONSULTOR[estado] ??
            LABEL_ESTADO_BADGE_CONSULTOR[ESTADOS_BADGE_CONSULTOR.BLOQUEADO],

        progresso,

        requisitos: requisitosComAnexos,
        totalRequisitos,
        requisitosAnexados,

        submissao: normalizarSubmissaoDetalhe(submissao),
        historico: normalizarHistoricoDetalhe(historico),
        feedback: historico?.feedback ?? null,

        registo,

        datas: {
            candidatura:
                estadoConsultor?.data_candidatura ??
                submissao?.data_submissao ??
                null,

            obtencao:
                estadoConsultor?.data_obtencao ??
                registo?.data_obtencao ??
                null,

            expiracao:
                estadoConsultor?.data_expiracao ??
                null,

            avaliacao:
                historico?.data_avaliacao ??
                null,
        },

        podeAnexarRequisitos: [
            ESTADOS_BADGE_CONSULTOR.BLOQUEADO,
            ESTADOS_BADGE_CONSULTOR.EM_PROGRESSO,
            ESTADOS_BADGE_CONSULTOR.RECUSADO,
        ].includes(estado),

        podeSubmeterCandidatura:
            estado === ESTADOS_BADGE_CONSULTOR.EM_PROGRESSO &&
            requisitosAnexados > 0,

        podePartilharConquista:
            estado === ESTADOS_BADGE_CONSULTOR.CONQUISTADO,

        urlPublica: obterUrlPublicaBadge(detalheCatalogo.id_badge),
    };
}
