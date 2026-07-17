const { Op } = require('sequelize');
const db = require('../models');

const STATUS_PARA_ESTADO = {
    em_progresso: 'emProgresso',
    pendente: 'pendentes',
    'aceite talent': 'pendentes',
    recusada: 'recusados'
};
const STATUS_RECONHECIDOS = new Set(['em_progresso', 'pendente', 'aceite talent', 'aceite', 'recusada']);

function criarErroHttp(statusCode, mensagem) {
    const erro = new Error(mensagem);
    erro.statusCode = statusCode;
    return erro;
}
function normalizarStatus(status) {
    return typeof status === 'string' ? status.trim().toLowerCase() : '';
}

function obterTimestamp(data) {
    if (!data) {
        return 0;
    }

    const timestamp = new Date(data).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function compararPorDataEIdDesc(a, b, campoData, campoId) {
    const diferencaData = obterTimestamp(b[campoData]) - obterTimestamp(a[campoData]);
    if (diferencaData !== 0) {
        return diferencaData;
    }

    return Number(b[campoId] || 0) - Number(a[campoId] || 0);
}

function selecionarSubmissaoMaisRecente(submissoes) {
    return [...submissoes].sort((a, b) => compararPorDataEIdDesc(a, b, 'data_submissao', 'id_submissao'))[0] || null;
}

function selecionarRegistoMaisRecente(registos) {
    return [...registos].sort((a, b) => compararPorDataEIdDesc(a, b, 'data_obtencao', 'id_registo'))[0] || null;
}

function calcularExpiracao(badge, registo) {
    if (!badge || !registo || badge.validade === null || badge.validade === undefined) {
        return null;
    }

    const validade = Number(badge.validade);
    if (!Number.isInteger(validade) || validade <= 0) {
        return null;
    }

    const dataObtencao = new Date(registo.data_obtencao);
    if (Number.isNaN(dataObtencao.getTime())) {
        return null;
    }

    const dataExpiracao = new Date(dataObtencao);
    dataExpiracao.setUTCDate(dataExpiracao.getUTCDate() + validade);
    return dataExpiracao;
}

function registoEstaExpirado(badge, registo, agora) {
    if (!registo) {
        return false;
    }

    const dataExpiracao = calcularExpiracao(badge, registo);
    return Boolean(registo.expirado) || Boolean(dataExpiracao && dataExpiracao.getTime() <= agora.getTime());
}

function agruparPor(lista, campo) {
    return lista.reduce((grupos, item) => {
        const chave = item[campo];
        if (!grupos.has(chave)) {
            grupos.set(chave, []);
        }

        grupos.get(chave).push(item);
        return grupos;
    }, new Map());
}

function mapearRequisitosPorBadge(relacoes, requisitosPorId) {
    const requisitosPorBadge = new Map();
    const idsPorBadge = new Map();

    for (const relacao of relacoes) {
        const requisito = requisitosPorId.get(relacao.id_requisito);
        if (!requisito) {
            continue;
        }

        if (!requisitosPorBadge.has(relacao.id_badge)) {
            requisitosPorBadge.set(relacao.id_badge, []);
            idsPorBadge.set(relacao.id_badge, new Set());
        }

        const ids = idsPorBadge.get(relacao.id_badge);
        if (ids.has(relacao.id_requisito)) {
            continue;
        }

        ids.add(relacao.id_requisito);
        requisitosPorBadge.get(relacao.id_badge).push(requisito);
    }

    return { requisitosPorBadge, idsPorBadge };
}

function calcularDocumentos(idSubmissao, idBadge, documentosPorSubmissao, idsRequisitosPorBadge) {
    const idsRequisitos = idsRequisitosPorBadge.get(idBadge) || new Set();
    const totalRequisitos = idsRequisitos.size;
    const idsAnexados = new Set();

    if (idSubmissao) {
        const documentos = documentosPorSubmissao.get(idSubmissao) || [];
        for (const documento of documentos) {
            if (idsRequisitos.has(documento.id_requisito)) {
                idsAnexados.add(documento.id_requisito);
            }
        }
    }

    return {
        total_requisitos: totalRequisitos,
        requisitos_anexados: idsAnexados.size
    };
}

function calcularProgresso(documentos, temRegisto, progressoForcado) {
    if (typeof progressoForcado === 'number') {
        return progressoForcado;
    }

    if (documentos.total_requisitos === 0) {
        return temRegisto ? 100 : 0;
    }

    const progresso = Math.floor((documentos.requisitos_anexados / documentos.total_requisitos) * 100);
    return Math.max(0, Math.min(100, progresso));
}

function selecionarAvaliacaoMaisRecente(historicos) {
    return [...historicos].sort((a, b) => {
        const diferencaData = obterTimestamp(b.data_avaliacao) - obterTimestamp(a.data_avaliacao);
        if (diferencaData !== 0) {
            return diferencaData;
        }

        return Number(b.id_utilizador || 0) - Number(a.id_utilizador || 0);
    })[0] || null;
}

function determinarEstado({ badge, submissao, registo, agora }) {
    const inconsistencias = [];
    const dataExpiracao = calcularExpiracao(badge, registo);
    const expiradoPorData = Boolean(
        registo &&
        !registo.expirado &&
        dataExpiracao &&
        dataExpiracao.getTime() <= agora.getTime()
    );

    if (expiradoPorData) {
        inconsistencias.push('registo_ativo_com_validade_ultrapassada');
        inconsistencias.push('registo_nao_marcado_como_expirado');
    }

    const registoExpirado = registoEstaExpirado(badge, registo, agora);

    if (registo && !registoExpirado) {
        return {
            estado: 'conquistados',
            progressoForcado: 100,
            renovacao: false,
            dataExpiracao,
            registoExpirado,
            inconsistencias
        };
    }

    if (registo && registoExpirado) {
        const submissaoPosterior = submissao && obterTimestamp(submissao.data_submissao) > obterTimestamp(registo.data_obtencao);

        if (!submissaoPosterior) {
            return {
                estado: 'expirados',
                progressoForcado: 100,
                renovacao: false,
                dataExpiracao,
                registoExpirado,
                inconsistencias
            };
        }

        const estadoSubmissao = mapearEstadoSubmissao(submissao, inconsistencias);
        return {
            estado: estadoSubmissao,
            progressoForcado: null,
            renovacao: true,
            dataExpiracao,
            registoExpirado,
            inconsistencias
        };
    }

    const estadoSubmissao = mapearEstadoSubmissao(submissao, inconsistencias);
    return {
        estado: estadoSubmissao,
        progressoForcado: null,
        renovacao: false,
        dataExpiracao: null,
        registoExpirado: false,
        inconsistencias
    };
}

function mapearEstadoSubmissao(submissao, inconsistencias) {
    if (!submissao) {
        return null;
    }

    const status = normalizarStatus(submissao.status);

    if (status === 'aceite') {
        inconsistencias.push('submissao_aceite_sem_registo');
        return null;
    }

    if (Object.prototype.hasOwnProperty.call(STATUS_PARA_ESTADO, status)) {
        return STATUS_PARA_ESTADO[status];
    }

    inconsistencias.push('status_submissao_desconhecido');
    return null;
}

function selecionarSubmissaoHistoricaAceite(submissoes, registo) {
    if (!registo) {
        return null;
    }

    const dataRegisto = obterTimestamp(registo.data_obtencao);
    return submissoes
        .filter((submissao) => {
            return normalizarStatus(submissao.status) === 'aceite' &&
                obterTimestamp(submissao.data_submissao) <= dataRegisto;
        })
        .sort((a, b) => compararPorDataEIdDesc(a, b, 'data_submissao', 'id_submissao'))[0] || null;
}

function selecionarSubmissaoAceiteOrigem(submissoes, registo) {
    const dataRegisto = registo ? obterTimestamp(registo.data_obtencao) : 0;
    const aceites = submissoes.filter((submissao) => normalizarStatus(submissao.status) === 'aceite');
    const anterioresAoRegisto = aceites.filter((submissao) => obterTimestamp(submissao.data_submissao) <= dataRegisto);

    return (anterioresAoRegisto.length > 0 ? anterioresAoRegisto : aceites)
        .sort((a, b) => compararPorDataEIdDesc(a, b, 'data_submissao', 'id_submissao'))[0] || null;
}

function submissaoAceiteTemRegistoCorrespondente(submissao, registo) {
    return Boolean(
        registo &&
        obterTimestamp(registo.data_obtencao) >= obterTimestamp(submissao.data_submissao)
    );
}

function determinarBloqueioRascunho({ badge, submissaoMaisRecente, registoMaisRecente, agora }) {
    const status = normalizarStatus(submissaoMaisRecente?.status);

    if (status === 'aceite' && !submissaoAceiteTemRegistoCorrespondente(submissaoMaisRecente, registoMaisRecente)) {
        const erro = criarErroHttp(409, 'A candidatura esta aceite, mas nao existe registo de conquista correspondente.');
        erro.inconsistencias = ['submissao_aceite_sem_registo'];
        return erro;
    }

    const registoAtivo = registoMaisRecente && !registoEstaExpirado(badge, registoMaisRecente, agora);
    if (registoAtivo) {
        return criarErroHttp(409, 'Este badge ainda se encontra valido e nao pode ser renovado.');
    }

    if (!submissaoMaisRecente) {
        return null;
    }

    if (status === 'pendente') {
        return criarErroHttp(409, 'Ja existe uma candidatura pendente para este badge.');
    }

    if (status === 'aceite talent') {
        return criarErroHttp(409, 'A candidatura ja foi aceite pelo Talent Manager e aguarda avaliacao final.');
    }

    if (!STATUS_RECONHECIDOS.has(status)) {
        return criarErroHttp(409, 'A submissao mais recente tem um status desconhecido.');
    }

    return null;
}

function escolherOrigemEvidencias({ submissoes, submissaoMaisRecente, registoMaisRecente, renovacao }) {
    const statusMaisRecente = normalizarStatus(submissaoMaisRecente?.status);

    if (statusMaisRecente === 'recusada') {
        return {
            submissaoOrigem: submissaoMaisRecente,
            origem_evidencias: 'recusada'
        };
    }

    if (renovacao) {
        const submissaoOrigem = selecionarSubmissaoAceiteOrigem(submissoes, registoMaisRecente);
        return {
            submissaoOrigem,
            origem_evidencias: submissaoOrigem ? 'aceite' : null
        };
    }

    return {
        submissaoOrigem: null,
        origem_evidencias: null
    };
}

function escolherDocumentosParaCopiar(documentos) {
    const documentosPorRequisito = agruparPor(documentos, 'id_requisito');
    const escolhidos = [];

    for (const docs of documentosPorRequisito.values()) {
        const documento = [...docs].sort((a, b) => compararPorDataEIdDesc(a, b, 'updated_file', 'id_ficheiro'))[0];
        if (documento) {
            escolhidos.push(documento);
        }
    }

    return escolhidos;
}

function montarAvaliacao(avaliacao) {
    if (!avaliacao) {
        return null;
    }

    return {
        id_utilizador: avaliacao.id_utilizador,
        aceite: avaliacao.aceite,
        feedback: avaliacao.feedback,
        data_avaliacao: avaliacao.data_avaliacao
    };
}

function montarSubmissao(submissao) {
    if (!submissao) {
        return null;
    }

    return {
        id_submissao: submissao.id_submissao,
        status: normalizarStatus(submissao.status),
        data_submissao: submissao.data_submissao
    };
}

function montarRegisto(registo, registoExpirado) {
    if (!registo) {
        return null;
    }

    return {
        id_registo: registo.id_registo,
        data_obtencao: registo.data_obtencao,
        expirado: registoExpirado
    };
}

function montarDocumentoMaisRecente(documentos) {
    const documento = [...documentos].sort((a, b) => compararPorDataEIdDesc(a, b, 'updated_file', 'id_ficheiro'))[0];

    if (!documento) {
        return null;
    }

    return {
        id_ficheiro: documento.id_ficheiro,
        ficheiro: documento.ficheiro,
        updated_file: documento.updated_file
    };
}

function montarRequisitosDetalhe(requisitos, submissaoDocumento, documentosPorSubmissao) {
    const documentos = submissaoDocumento
        ? documentosPorSubmissao.get(submissaoDocumento.id_submissao) || []
        : [];
    const documentosPorRequisito = agruparPor(documentos, 'id_requisito');

    return requisitos.map((requisito) => ({
        id_requisito: requisito.id_requisito,
        nome_requisito: requisito.nome_requisito,
        descricao_requisito: requisito.descricao_requisito,
        documento: montarDocumentoMaisRecente(documentosPorRequisito.get(requisito.id_requisito) || [])
    }));
}

function formatarBadgeRelacoes(badge) {
    if (!badge) return null;
    const nivel = badge.Nivel;
    const area = badge.Area;
    const serviceLine = area?.ServiceLine;
    const learningPath = serviceLine?.LearningPath;

    return {
        id_badge: badge.id_badge,
        nome_badge: badge.nome_badge,
        descricao_badge: badge.descricao_badge,
        imagem: badge.imagem,
        pontos_badge: badge.pontos_badge,
        validade: badge.validade ?? null,
        especial: badge.especial,
        nivel: nivel
            ? {
                id_nivel: nivel.id_nivel,
                nome_nivel: nivel.nome_nivel
            }
            : null,
        area: area
            ? {
                id_area: area.id_area,
                nome_area: area.nome_area,
                service_line: serviceLine
                    ? {
                        id_service_line: serviceLine.id_service_line,
                        nome_service_line: serviceLine.nome_service_line,
                        learning_path: learningPath
                            ? {
                                id_learning_path: learningPath.id_learning_path,
                                nome_learning_path: learningPath.nome_learning_path
                            }
                            : null
                    }
                    : null
            }
            : null
    };
}

function montarEstadoPessoal({
    badge,
    submissoes,
    registos,
    documentosPorSubmissao,
    requisitosPorBadge,
    idsRequisitosPorBadge,
    historicosPorSubmissao,
    agora,
    incluirRequisitos = false
}) {
    const submissao = selecionarSubmissaoMaisRecente(submissoes);
    const registo = selecionarRegistoMaisRecente(registos);
    const estadoInfo = determinarEstado({ badge, submissao, registo, agora });
    const documentos = calcularDocumentos(
        submissao?.id_submissao,
        badge.id_badge,
        documentosPorSubmissao,
        idsRequisitosPorBadge
    );
    const avaliacao = submissao
        ? selecionarAvaliacaoMaisRecente(historicosPorSubmissao.get(submissao.id_submissao) || [])
        : null;

    const resposta = {
        id_badge: badge.id_badge,
        badge: formatarBadgeRelacoes(badge),
        estado: estadoInfo.estado,
        progresso: calcularProgresso(documentos, Boolean(registo), estadoInfo.progressoForcado),
        renovacao: estadoInfo.renovacao,
        data_candidatura: submissao?.data_submissao || null,
        data_obtencao: registo?.data_obtencao || null,
        data_expiracao: estadoInfo.dataExpiracao,
        submissao: montarSubmissao(submissao),
        registo: montarRegisto(registo, estadoInfo.registoExpirado),
        avaliacao: montarAvaliacao(avaliacao),
        documentos,
        inconsistencias: estadoInfo.inconsistencias
    };

    if (incluirRequisitos) {
        let submissaoDocumento = submissao;

        if (estadoInfo.estado === 'expirados' && registo && !estadoInfo.renovacao) {
            // Para registos expirados sem nova tentativa, mostram-se as evidencias aceites que originaram a conquista.
            submissaoDocumento = selecionarSubmissaoHistoricaAceite(submissoes, registo) || submissao;
        }

        resposta.requisitos = montarRequisitosDetalhe(
            requisitosPorBadge.get(badge.id_badge) || [],
            submissaoDocumento,
            documentosPorSubmissao
        );
    }

    return resposta;
}

async function obterConsultorAutenticado(idUtilizador) {
    const utilizador = await db.Utilizador.findOne({
        attributes: ['id_utilizador', 'ativo'],
        where: {
            id_utilizador: idUtilizador,
            ativo: true
        }
    });

    if (!utilizador) {
        throw criarErroHttp(404, 'Utilizador nao encontrado.');
    }

    const consultor = await db.Consultor.findOne({
        attributes: ['id_utilizador', 'id_area'],
        where: { id_utilizador: idUtilizador }
    });

    if (!consultor) {
        throw criarErroHttp(403, 'Utilizador sem registo de consultor.');
    }

    return {
        id_utilizador: consultor.id_utilizador,
        id_area_consultor: consultor.id_area
    };
}

async function carregarEstadoPessoalBadges(idUtilizador, {
    idBadge = null,
    incluirRequisitos = false,
    transaction,
    agora = new Date()
} = {}) {
    const wherePessoal = idBadge
        ? { id_utilizador: idUtilizador, id_badge: idBadge }
        : { id_utilizador: idUtilizador };

    const [submissoes, registos] = await Promise.all([
        db.Submissoes.findAll({
            attributes: ['id_submissao', 'id_badge', 'id_utilizador', 'status', 'data_submissao'],
            where: wherePessoal,
            transaction
        }),
        db.RegistoBadges.findAll({
            attributes: ['id_registo', 'id_badge', 'id_utilizador', 'data_obtencao', 'expirado'],
            where: wherePessoal,
            transaction
        })
    ]);

    const idsBadgesComInfo = new Set([
        ...submissoes.map((submissao) => submissao.id_badge),
        ...registos.map((registo) => registo.id_badge)
    ]);

    if (idsBadgesComInfo.size === 0) {
        return [];
    }

    const badges = await db.Badges.findAll({
        attributes: [
            'id_badge',
            'nome_badge',
            'descricao_badge',
            'imagem',
            'pontos_badge',
            'validade',
            'especial'
        ],
        where: {
            id_badge: { [Op.in]: [...idsBadgesComInfo] },
            deleted_badge: false
        },
        include: [
            {
                model: db.Nivel,
                attributes: ['id_nivel', 'nome_nivel'],
                required: false
            },
            {
                model: db.Area,
                attributes: ['id_area', 'nome_area'],
                required: false,
                include: [
                    {
                        model: db.ServiceLine,
                        attributes: ['id_service_line', 'nome_service_line'],
                        required: false,
                        include: [
                            {
                                model: db.LearningPath,
                                attributes: ['id_learning_path', 'nome_learning_path'],
                                required: false
                            }
                        ]
                    }
                ]
            }
        ],
        order: [['id_badge', 'ASC']],
        transaction
    });

    if (badges.length === 0) {
        return [];
    }

    const idsBadgesAtivos = badges.map((badge) => badge.id_badge);
    const relacoesRequisitos = await db.RequisitosBadge.findAll({
        attributes: ['id_badge', 'id_requisito'],
        where: { id_badge: { [Op.in]: idsBadgesAtivos } },
        order: [['id_badge', 'ASC'], ['id_requisito', 'ASC']],
        transaction
    });
    const idsRequisitosRelacionados = [...new Set(relacoesRequisitos.map((relacao) => relacao.id_requisito))];
    const requisitos = idsRequisitosRelacionados.length > 0
        ? await db.Requisitos.findAll({
            attributes: ['id_requisito', 'nome_requisito', 'descricao_requisito'],
            where: {
                id_requisito: { [Op.in]: idsRequisitosRelacionados },
                deleted_requisitos: false
            },
            order: [['id_requisito', 'ASC']],
            transaction
        })
        : [];

    const requisitosPorId = new Map(requisitos.map((requisito) => [requisito.id_requisito, requisito]));
    const { requisitosPorBadge, idsPorBadge } = mapearRequisitosPorBadge(relacoesRequisitos, requisitosPorId);
    const submissoesPorBadge = agruparPor(
        submissoes.filter((submissao) => idsBadgesAtivos.includes(submissao.id_badge)),
        'id_badge'
    );
    const registosPorBadge = agruparPor(
        registos.filter((registo) => idsBadgesAtivos.includes(registo.id_badge)),
        'id_badge'
    );

    const idsSubmissoesSelecionadas = new Set();
    for (const badge of badges) {
        const submissoesDoBadge = submissoesPorBadge.get(badge.id_badge) || [];
        const registosDoBadge = registosPorBadge.get(badge.id_badge) || [];
        const submissao = selecionarSubmissaoMaisRecente(submissoesDoBadge);
        const registo = selecionarRegistoMaisRecente(registosDoBadge);

        if (submissao) {
            idsSubmissoesSelecionadas.add(submissao.id_submissao);
        }

        if (incluirRequisitos) {
            const estadoInfo = determinarEstado({ badge, submissao, registo, agora });
            if (estadoInfo.estado === 'expirados' && registo && !estadoInfo.renovacao) {
                const submissaoHistorica = selecionarSubmissaoHistoricaAceite(submissoesDoBadge, registo);
                if (submissaoHistorica) {
                    idsSubmissoesSelecionadas.add(submissaoHistorica.id_submissao);
                }
            }
        }
    }

    const idsSubmissoes = [...idsSubmissoesSelecionadas];
    const [documentos, historicos] = idsSubmissoes.length > 0
        ? await Promise.all([
            db.Documentos.findAll({
                attributes: ['id_submissao', 'id_ficheiro', 'id_requisito', 'ficheiro', 'updated_file'],
                where: {
                    id_submissao: { [Op.in]: idsSubmissoes },
                    deleted_file: false
                },
                transaction
            }),
            db.Historico.findAll({
                attributes: ['id_utilizador', 'id_submissao', 'aceite', 'feedback', 'data_avaliacao'],
                where: { id_submissao: { [Op.in]: idsSubmissoes } },
                transaction
            })
        ])
        : [[], []];

    const submissoesPorId = new Map(submissoes.map((submissao) => [submissao.id_submissao, submissao]));
    const documentosValidos = documentos.filter((documento) => {
        const submissao = submissoesPorId.get(documento.id_submissao);
        const idsRequisitos = submissao ? idsPorBadge.get(submissao.id_badge) : null;
        return Boolean(idsRequisitos && idsRequisitos.has(documento.id_requisito));
    });

    const documentosPorSubmissao = agruparPor(documentosValidos, 'id_submissao');
    const historicosPorSubmissao = agruparPor(historicos, 'id_submissao');
    return badges.map((badge) => montarEstadoPessoal({
        badge,
        submissoes: submissoesPorBadge.get(badge.id_badge) || [],
        registos: registosPorBadge.get(badge.id_badge) || [],
        documentosPorSubmissao,
        requisitosPorBadge,
        idsRequisitosPorBadge: idsPorBadge,
        historicosPorSubmissao,
        agora,
        incluirRequisitos
    }));
}

async function obterDetalhePessoalBadge(idUtilizador, idBadge) {
    const badges = await carregarEstadoPessoalBadges(idUtilizador, {
        idBadge,
        incluirRequisitos: true
    });

    return badges[0] || null;
}

module.exports = {
    normalizarStatus,
    selecionarSubmissaoMaisRecente,
    selecionarRegistoMaisRecente,
    registoEstaExpirado,
    determinarBloqueioRascunho,
    escolherOrigemEvidencias,
    escolherDocumentosParaCopiar,
    obterConsultorAutenticado,
    carregarEstadoPessoalBadges,
    obterDetalhePessoalBadge
};
