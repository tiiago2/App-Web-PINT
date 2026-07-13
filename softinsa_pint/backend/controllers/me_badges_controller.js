const { Op, QueryTypes } = require('sequelize');
const db = require('../models');
const { enviarEmail } = require('../helpers/emailHelper');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

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

function criarErroComCodigo(statusCode, mensagem, codigo, extra = {}) {
    const erro = criarErroHttp(statusCode, mensagem);
    erro.codigo = codigo;
    Object.assign(erro, extra);
    return erro;
}

function validarInteiroPositivo(valor, campo) {
    const texto = String(valor ?? '').trim();

    if (!/^\d+$/.test(texto)) {
        throw criarErroHttp(400, `${campo} deve ser um inteiro positivo.`);
    }

    const numero = Number(texto);
    if (!Number.isSafeInteger(numero) || numero <= 0) {
        throw criarErroHttp(400, `${campo} deve ser um inteiro positivo.`);
    }

    return numero;
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

async function carregarEstadoPessoalBadges(idUtilizador, { idBadge = null, incluirRequisitos = false } = {}) {
    const wherePessoal = idBadge
        ? { id_utilizador: idUtilizador, id_badge: idBadge }
        : { id_utilizador: idUtilizador };

    const [submissoes, registos] = await Promise.all([
        db.Submissoes.findAll({
            attributes: ['id_submissao', 'id_badge', 'id_utilizador', 'status', 'data_submissao'],
            where: wherePessoal
        }),
        db.RegistoBadges.findAll({
            attributes: ['id_registo', 'id_badge', 'id_utilizador', 'data_obtencao', 'expirado'],
            where: wherePessoal
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
        order: [['id_badge', 'ASC']]
    });

    if (badges.length === 0) {
        return [];
    }

    const idsBadgesAtivos = badges.map((badge) => badge.id_badge);
    const relacoesRequisitos = await db.RequisitosBadge.findAll({
        attributes: ['id_badge', 'id_requisito'],
        where: { id_badge: { [Op.in]: idsBadgesAtivos } },
        order: [['id_badge', 'ASC'], ['id_requisito', 'ASC']]
    });
    const idsRequisitosRelacionados = [...new Set(relacoesRequisitos.map((relacao) => relacao.id_requisito))];
    const requisitos = idsRequisitosRelacionados.length > 0
        ? await db.Requisitos.findAll({
            attributes: ['id_requisito', 'nome_requisito', 'descricao_requisito'],
            where: {
                id_requisito: { [Op.in]: idsRequisitosRelacionados },
                deleted_requisitos: false
            },
            order: [['id_requisito', 'ASC']]
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
            const estadoInfo = determinarEstado({ badge, submissao, registo, agora: new Date() });
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
                }
            }),
            db.Historico.findAll({
                attributes: ['id_utilizador', 'id_submissao', 'aceite', 'feedback', 'data_avaliacao'],
                where: { id_submissao: { [Op.in]: idsSubmissoes } }
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
    const agora = new Date();

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

async function obterSubmissoesERegistos(idUtilizador, idBadge, transaction = null) {
    const where = {
        id_utilizador: idUtilizador,
        id_badge: idBadge
    };

    const [submissoes, registos] = await Promise.all([
        db.Submissoes.findAll({
            attributes: ['id_submissao', 'id_badge', 'id_utilizador', 'status', 'data_submissao'],
            where,
            transaction
        }),
        db.RegistoBadges.findAll({
            attributes: ['id_registo', 'id_badge', 'id_utilizador', 'data_obtencao', 'expirado'],
            where,
            transaction
        })
    ]);

    return { submissoes, registos };
}

async function obterBadgeAtivo(idBadge, transaction = null) {
    const opcoes = {
        attributes: ['id_badge', 'validade'],
        where: {
            id_badge: idBadge,
            deleted_badge: false
        },
        transaction
    };

    if (transaction) {
        opcoes.lock = transaction.LOCK.UPDATE;
    }

    const badge = await db.Badges.findOne(opcoes);

    if (!badge) {
        throw criarErroHttp(404, 'Badge nao encontrado.');
    }

    return badge;
}

async function obterRequisitoAtivoAssociado(idBadge, idRequisito, transaction = null) {
    const requisito = await db.Requisitos.findOne({
        attributes: ['id_requisito'],
        where: {
            id_requisito: idRequisito,
            deleted_requisitos: false
        },
        transaction
    });

    if (!requisito) {
        throw criarErroHttp(404, 'Requisito nao encontrado.');
    }

    const relacao = await db.RequisitosBadge.findOne({
        attributes: ['id_badge', 'id_requisito'],
        where: {
            id_badge: idBadge,
            id_requisito: idRequisito
        },
        transaction
    });

    if (!relacao) {
        throw criarErroComCodigo(409, 'O requisito nao pertence a este badge.', 'requisito_nao_associado');
    }

    return requisito;
}

async function obterRascunhoEditavel(idUtilizador, idBadge, transaction = null) {
    const opcoes = {
        attributes: ['id_submissao', 'id_badge', 'id_utilizador', 'status', 'data_submissao'],
        where: {
            id_utilizador: idUtilizador,
            id_badge: idBadge
        },
        order: [
            ['data_submissao', 'DESC'],
            ['id_submissao', 'DESC']
        ],
        transaction
    };

    if (transaction) {
        opcoes.lock = transaction.LOCK.UPDATE;
    }

    const submissao = await db.Submissoes.findOne(opcoes);

    if (!submissao) {
        throw criarErroComCodigo(409, 'Nao existe rascunho para este badge.', 'rascunho_inexistente');
    }

    const statusAtual = normalizarStatus(submissao.status);
    if (statusAtual !== 'em_progresso') {
        throw criarErroComCodigo(409, 'A submissao atual nao pode ser editada.', 'submissao_nao_editavel', {
            status_atual: statusAtual
        });
    }

    return submissao;
}

async function uploadEvidenciaCloudinary(file) {
    const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const uploadResult = await cloudinary.uploader.upload(fileBase64, {
        folder: 'evidencias_badges',
        resource_type: 'auto'
    });

    return {
        ficheiro: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        resource_type: uploadResult.resource_type || 'image'
    };
}

async function limparUploadEvidencia(uploadInfo) {
    if (!uploadInfo?.public_id) {
        return;
    }

    try {
        await cloudinary.uploader.destroy(uploadInfo.public_id, {
            resource_type: uploadInfo.resource_type || 'image'
        });
    } catch (cleanupError) {
        console.error('Erro ao limpar upload de evidencia:', cleanupError);
    }
}

function montarEvidencia(documento) {
    return {
        id_ficheiro: documento.id_ficheiro,
        id_submissao: documento.id_submissao,
        id_requisito: documento.id_requisito,
        ficheiro: documento.ficheiro,
        updated_file: documento.updated_file,
        deleted_file: documento.deleted_file
    };
}

function responderErroOperacaoEvidencia(res, error, mensagemFallback) {
    if (error.statusCode === 400 || error.statusCode === 403 || error.statusCode === 404 || error.statusCode === 409) {
        const corpo = { error: error.message };

        if (error.codigo) {
            corpo.codigo = error.codigo;
        }

        if (error.status_atual !== undefined) {
            corpo.status_atual = error.status_atual;
        }

        return res.status(error.statusCode).json(corpo);
    }

    console.error(mensagemFallback, error);
    return res.status(500).json({ error: mensagemFallback });
}

async function copiarEvidenciasParaRascunho({ idBadge, submissaoOrigem, rascunho, transaction }) {
    if (!submissaoOrigem) {
        return 0;
    }

    const relacoesRequisitos = await db.RequisitosBadge.findAll({
        attributes: ['id_requisito'],
        where: { id_badge: idBadge },
        transaction
    });
    const idsRequisitosRelacionados = [...new Set(relacoesRequisitos.map((relacao) => relacao.id_requisito))];

    if (idsRequisitosRelacionados.length === 0) {
        return 0;
    }

    const requisitosAtivos = await db.Requisitos.findAll({
        attributes: ['id_requisito'],
        where: {
            id_requisito: { [Op.in]: idsRequisitosRelacionados },
            deleted_requisitos: false
        },
        transaction
    });
    const idsRequisitosAtivos = requisitosAtivos.map((requisito) => requisito.id_requisito);

    if (idsRequisitosAtivos.length === 0) {
        return 0;
    }

    const documentosOrigem = await db.Documentos.findAll({
        attributes: ['id_submissao', 'id_ficheiro', 'id_requisito', 'ficheiro', 'updated_file'],
        where: {
            id_submissao: submissaoOrigem.id_submissao,
            id_requisito: { [Op.in]: idsRequisitosAtivos },
            deleted_file: false
        },
        transaction
    });
    const documentosEscolhidos = escolherDocumentosParaCopiar(documentosOrigem);

    if (documentosEscolhidos.length === 0) {
        return 0;
    }

    const agora = new Date();
    await db.Documentos.bulkCreate(
        documentosEscolhidos.map((documento) => ({
            id_submissao: rascunho.id_submissao,
            id_ficheiro: documento.id_ficheiro,
            id_requisito: documento.id_requisito,
            ficheiro: documento.ficheiro,
            updated_file: agora,
            deleted_file: false
        })),
        { transaction }
    );

    return documentosEscolhidos.length;
}

function prepararRespostaRascunho({ reutilizado, renovacao, origemEvidencias, evidenciasCopiadas, badge }) {
    return {
        message: reutilizado
            ? 'Ja existia um rascunho para este badge.'
            : 'Rascunho criado com sucesso.',
        reutilizado,
        renovacao,
        origem_evidencias: origemEvidencias,
        evidencias_copiadas: evidenciasCopiadas,
        badge
    };
}

async function obterIdsRequisitosAtivosDoBadge(idBadge, transaction) {
    const relacoes = await db.RequisitosBadge.findAll({
        attributes: ['id_requisito'],
        where: { id_badge: idBadge },
        transaction
    });
    const idsRelacionados = [...new Set(relacoes.map((relacao) => relacao.id_requisito))];

    if (idsRelacionados.length === 0) {
        throw criarErroComCodigo(409, 'Este badge nao tem requisitos ativos.', 'badge_sem_requisitos');
    }

    const requisitos = await db.Requisitos.findAll({
        attributes: ['id_requisito'],
        where: {
            id_requisito: { [Op.in]: idsRelacionados },
            deleted_requisitos: false
        },
        transaction
    });
    const idsAtivos = requisitos.map((requisito) => requisito.id_requisito);

    if (idsAtivos.length === 0) {
        throw criarErroComCodigo(409, 'Este badge nao tem requisitos ativos.', 'badge_sem_requisitos');
    }

    return idsAtivos;
}

async function validarRascunhoCompleto(rascunho, idsRequisitosAtivos, transaction) {
    const documentos = await db.Documentos.findAll({
        attributes: ['id_requisito'],
        where: {
            id_submissao: rascunho.id_submissao,
            id_requisito: { [Op.in]: idsRequisitosAtivos },
            deleted_file: false
        },
        transaction
    });
    const idsAnexados = new Set(documentos.map((documento) => documento.id_requisito));
    const requisitosEmFalta = idsRequisitosAtivos.filter((idRequisito) => !idsAnexados.has(idRequisito));

    if (requisitosEmFalta.length > 0) {
        throw criarErroComCodigo(409, 'A candidatura ainda nao tem todos os requisitos preenchidos.', 'requisitos_incompletos', {
            total_requisitos: idsRequisitosAtivos.length,
            requisitos_anexados: idsAnexados.size,
            requisitos_em_falta: requisitosEmFalta
        });
    }
}

function criarResumoComunicacoesVazio() {
    return {
        emails: {
            enviados: 0,
            falhados: 0
        },
        notificacoes: {
            destinatarios: 0,
            criadas: 0,
            falhadas: 0
        }
    };
}

function normalizarEmail(email) {
    return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizarEmail(email));
}

function obterNomeUtilizador(utilizador, fallback = 'utilizador') {
    return utilizador?.nome_user || utilizador?.nome || fallback;
}

function normalizarNomeRole(nomeRole) {
    return String(nomeRole || '').trim().toLowerCase();
}

function utilizadorTemRoleTalentManager(utilizador) {
    return (utilizador.Roles || []).some((role) => {
        const nomeRole = normalizarNomeRole(role.nome_role);
        return nomeRole === 'talent' || nomeRole === 'talent manager';
    });
}

function desduplicarDestinatarios(destinatarios) {
    const ids = new Set();
    const emails = new Set();
    const unicos = [];

    for (const destinatario of destinatarios) {
        if (!destinatario?.id_utilizador) {
            continue;
        }

        const id = Number(destinatario.id_utilizador);
        const email = normalizarEmail(destinatario.email);

        if (ids.has(id) || (email && emails.has(email))) {
            continue;
        }

        ids.add(id);
        if (email) {
            emails.add(email);
        }

        unicos.push({
            id_utilizador: id,
            nome_user: destinatario.nome_user,
            email: destinatario.email
        });
    }

    return unicos;
}

async function obterTalentManagersAtivos() {
    const utilizadores = await db.Utilizador.findAll({
        attributes: ['id_utilizador', 'nome_user', 'email', 'ativo'],
        where: { ativo: true },
        include: [{
            model: db.Role,
            attributes: ['nome_role'],
            through: { attributes: [] },
            required: true
        }]
    });

    return utilizadores.filter(utilizadorTemRoleTalentManager);
}

async function obterDadosComunicacaoSubmissao({ idSubmissao, idUtilizador, idBadge }) {
    const consultor = await db.Utilizador.findOne({
        attributes: ['id_utilizador', 'nome_user', 'email', 'ativo'],
        where: {
            id_utilizador: idUtilizador,
            ativo: true
        }
    });
    const badge = await db.Badges.findOne({
        attributes: ['id_badge', 'nome_badge', 'id_area'],
        where: {
            id_badge: idBadge,
            deleted_badge: false
        }
    });

    let area = null;
    let serviceLine = null;
    let lider = null;

    if (badge) {
        area = await db.Area.findOne({
            attributes: ['id_area', 'id_service_line'],
            where: {
                id_area: badge.id_area,
                deleted_area: false
            }
        });
    }

    if (area) {
        serviceLine = await db.ServiceLine.findOne({
            attributes: ['id_service_line', 'id_lider'],
            where: {
                id_service_line: area.id_service_line,
                deleted_service: false
            }
        });
    }

    if (serviceLine?.id_lider) {
        lider = await db.Utilizador.findOne({
            attributes: ['id_utilizador', 'nome_user', 'email', 'ativo'],
            where: {
                id_utilizador: serviceLine.id_lider,
                ativo: true
            }
        });
    }

    const talentManagers = await obterTalentManagersAtivos();
    const avaliadores = desduplicarDestinatarios([
        ...talentManagers,
        ...(lider ? [lider] : [])
    ]);

    return {
        idSubmissao,
        consultor,
        badge,
        area,
        serviceLine,
        lider,
        avaliadores
    };
}

function criarEmailConsultor({ consultor, badge, idSubmissao }) {
    const nomeConsultor = obterNomeUtilizador(consultor, 'consultor');
    const nomeBadge = badge?.nome_badge || 'Badge';

    return {
        to: consultor.email,
        subject: `Candidatura submetida - ${nomeBadge}`,
        text:
            `Ola ${nomeConsultor},\n\n` +
            `A tua candidatura ao badge "${nomeBadge}" foi submetida com sucesso e encontra-se agora pendente de avaliacao.\n\n` +
            `Numero da candidatura: ${idSubmissao}\n\n` +
            'Receberas uma atualizacao quando existir uma decisao.',
        html:
            `<p>Ola ${nomeConsultor},</p>` +
            `<p>A tua candidatura ao badge <strong>"${nomeBadge}"</strong> foi submetida com sucesso e encontra-se agora pendente de avaliacao.</p>` +
            `<p>Numero da candidatura: <strong>${idSubmissao}</strong></p>` +
            '<p>Receberas uma atualizacao quando existir uma decisao.</p>'
    };
}

function criarEmailAvaliador({ destinatario, consultor, badge, idSubmissao }) {
    const nomeDestinatario = obterNomeUtilizador(destinatario, 'avaliador');
    const nomeConsultor = obterNomeUtilizador(consultor, 'consultor');
    const nomeBadge = badge?.nome_badge || 'Badge';

    return {
        to: destinatario.email,
        subject: `Nova candidatura para avaliacao - ${nomeBadge}`,
        text:
            `Ola ${nomeDestinatario},\n\n` +
            `${nomeConsultor} submeteu uma candidatura ao badge "${nomeBadge}".\n\n` +
            `Numero da candidatura: ${idSubmissao}\n\n` +
            'A candidatura esta pendente de avaliacao na plataforma.',
        html:
            `<p>Ola ${nomeDestinatario},</p>` +
            `<p>${nomeConsultor} submeteu uma candidatura ao badge <strong>"${nomeBadge}"</strong>.</p>` +
            `<p>Numero da candidatura: <strong>${idSubmissao}</strong></p>` +
            '<p>A candidatura esta pendente de avaliacao na plataforma.</p>'
    };
}

async function enviarEmailsSubmissao(dados) {
    const mensagens = [];

    // Permissão 8: Confirmação de candidatura
    const perm8 = await db.Permissoes.findByPk(8);
    if (perm8?.toggle !== false && dados.consultor?.email && emailValido(dados.consultor.email)) {
        mensagens.push(criarEmailConsultor(dados));
    }

    // Permissão 10: Alerta nova candidatura (apenas para Talent Managers)
    const perm10 = await db.Permissoes.findByPk(10);
    if (perm10?.toggle !== false) {
        const talentManagers = await obterTalentManagersAtivos();
        for (const tm of talentManagers) {
            if (tm.email && emailValido(tm.email)) {
                mensagens.push(criarEmailAvaliador({
                    ...dados,
                    destinatario: tm
                }));
            }
        }
    }

    if (mensagens.length === 0) {
        return { enviados: 0, falhados: 0 };
    }

    const resultados = await Promise.allSettled(
        mensagens.map((mensagem) => enviarEmail(mensagem))
    );

    return resultados.reduce((resumo, resultado) => {
        if (resultado.status === 'fulfilled' && resultado.value?.sucesso === true) {
            resumo.enviados += 1;
            return resumo;
        }

        resumo.falhados += 1;
        const erro = resultado.status === 'rejected'
            ? resultado.reason
            : resultado.value?.erro;
        console.error('Falha ao enviar email de submissao:', erro?.message || erro);
        return resumo;
    }, { enviados: 0, falhados: 0 });
}

async function criarNotificacoesSubmissao(dados) {
    // Permissão 10: Alerta nova candidatura
    const perm10 = await db.Permissoes.findByPk(10);
    if (perm10?.toggle === false) {
        return {
            destinatarios: 0,
            criadas: 0,
            falhadas: 0
        };
    }

    const talentManagers = await obterTalentManagersAtivos();
    const tms = talentManagers.filter((tm) => tm.id_utilizador);
    const totalDestinatarios = tms.length;

    if (totalDestinatarios === 0) {
        return {
            destinatarios: 0,
            criadas: 0,
            falhadas: 0
        };
    }

    try {
        await db.sequelize.transaction(async (transaction) => {
            const nomeConsultor = obterNomeUtilizador(dados.consultor, 'consultor');
            const nomeBadge = dados.badge?.nome_badge || 'Badge';
            const notificacao = await db.Notificacoes.create({
                id_utilizador: dados.consultor?.id_utilizador,
                descricao_notificacao: `${nomeConsultor} submeteu uma candidatura ao badge ${nomeBadge}.`,
                data_envio: new Date(),
                tipo_notificacao: 'NOVA_CANDIDATURA'
            }, { transaction });

            await db.Recetor.bulkCreate(
                tms.map((tm) => ({
                    id_notificacao: notificacao.id_notificacao,
                    id_utilizador: tm.id_utilizador,
                    lida: false,
                    last_read: null
                })),
                { transaction }
            );
        });

        return {
            destinatarios: totalDestinatarios,
            criadas: totalDestinatarios,
            falhadas: 0
        };
    } catch (error) {
        console.error('Falha ao criar notificacoes internas de submissao:', error?.message || error);
        return {
            destinatarios: totalDestinatarios,
            criadas: 0,
            falhadas: totalDestinatarios
        };
    }
}

async function processarComunicacoesSubmissao({ idSubmissao, idUtilizador, idBadge }) {
    try {
        const dados = await obterDadosComunicacaoSubmissao({
            idSubmissao,
            idUtilizador,
            idBadge
        });
        const [emails, notificacoes] = await Promise.all([
            enviarEmailsSubmissao(dados),
            criarNotificacoesSubmissao(dados)
        ]);

        return { emails, notificacoes };
    } catch (error) {
        console.error('Falha ao processar comunicacoes de submissao:', error?.message || error);
        return criarResumoComunicacoesVazio();
    }
}

exports.listarMeusBadges = async (req, res) => {
    try {
        const idUtilizador = req.utilizadorLogado?.id_utilizador;
        const consultor = await obterConsultorAutenticado(idUtilizador);
        const badges = await carregarEstadoPessoalBadges(idUtilizador);

        return res.status(200).json({
            id_utilizador: consultor.id_utilizador,
            id_area_consultor: consultor.id_area_consultor,
            badges
        });
    } catch (error) {
        if (error.statusCode === 403 || error.statusCode === 404) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        console.error('Erro ao listar badges pessoais:', error);
        return res.status(500).json({ error: 'Erro ao listar badges pessoais.' });
    }
};

exports.listarSugestoesBadges = async (req, res) => {
    try {
        const idUtilizador = req.utilizadorLogado?.id_utilizador;
        const consultor = await obterConsultorAutenticado(idUtilizador);
        const sugestoes = await db.sequelize.query(
            `
                SELECT
                    id_badge,
                    nome_badge,
                    justificacao
                FROM public.fn_sugerir_badges(:idUtilizador)
            `,
            {
                replacements: {
                    idUtilizador
                },
                type: QueryTypes.SELECT
            }
        );
        const sugestoesNormalizadas = Array.isArray(sugestoes)
            ? sugestoes.map((sugestao) => ({
                id_badge: Number(sugestao.id_badge),
                nome_badge: String(sugestao.nome_badge ?? ''),
                justificacao: String(sugestao.justificacao ?? '')
            }))
            : [];

        return res.status(200).json({
            id_utilizador: consultor.id_utilizador,
            total: sugestoesNormalizadas.length,
            sugestoes: sugestoesNormalizadas
        });
    } catch (error) {
        if (error.statusCode === 403 || error.statusCode === 404) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        console.error('Erro ao obter sugestoes de badges:', error);
        return res.status(500).json({ error: 'Erro ao obter sugestões de badges.' });
    }
};

exports.obterMeuBadge = async (req, res) => {
    try {
        const idBadge = validarInteiroPositivo(req.params.id, 'id');
        let idUtilizador = req.utilizadorLogado?.id_utilizador;

        // Verificar a role ativa para permitir gestores verem badges de consultores
        const perfil = req.headers['x-user-role'];
        const isGestor = ['Administrador', 'Talent Manager', 'Service Line Leader'].includes(perfil);

        if (isGestor && req.query.idUtilizador) {
            idUtilizador = Number(req.query.idUtilizador);
        } else {
            await obterConsultorAutenticado(idUtilizador);
        }

        const badge = await db.Badges.findOne({
            attributes: ['id_badge'],
            where: {
                id_badge: idBadge,
                deleted_badge: false
            }
        });

        if (!badge) {
            return res.status(404).json({ error: 'Badge nao encontrado.' });
        }

        const badgePessoal = await obterDetalhePessoalBadge(idUtilizador, idBadge);

        if (!badgePessoal) {
            return res.status(404).json({ error: 'Badge pessoal nao encontrado.' });
        }

        return res.status(200).json(badgePessoal);
    } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 403 || error.statusCode === 404) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        console.error('Erro ao obter badge pessoal:', error);
        return res.status(500).json({ error: 'Erro ao obter badge pessoal.' });
    }
};

exports.criarOuObterRascunho = async (req, res) => {
    try {
        const idBadge = validarInteiroPositivo(req.params.id, 'id');
        const idUtilizador = req.utilizadorLogado?.id_utilizador;
        await obterConsultorAutenticado(idUtilizador);
        const badge = await obterBadgeAtivo(idBadge);
        const agora = new Date();
        const { submissoes, registos } = await obterSubmissoesERegistos(idUtilizador, idBadge);
        const submissaoMaisRecente = selecionarSubmissaoMaisRecente(submissoes);
        const registoMaisRecente = selecionarRegistoMaisRecente(registos);
        const bloqueio = determinarBloqueioRascunho({
            badge,
            submissaoMaisRecente,
            registoMaisRecente,
            agora
        });

        if (bloqueio) {
            const corpo = { error: bloqueio.message };
            if (bloqueio.inconsistencias) {
                corpo.inconsistencias = bloqueio.inconsistencias;
            }

            return res.status(bloqueio.statusCode).json(corpo);
        }

        if (normalizarStatus(submissaoMaisRecente?.status) === 'em_progresso') {
            const badgePessoal = await obterDetalhePessoalBadge(idUtilizador, idBadge);
            return res.status(200).json(prepararRespostaRascunho({
                reutilizado: true,
                renovacao: Boolean(badgePessoal?.renovacao),
                origemEvidencias: null,
                evidenciasCopiadas: 0,
                badge: badgePessoal
            }));
        }

        const resultado = await db.sequelize.transaction(
            { isolationLevel: 'SERIALIZABLE' },
            async (transaction) => {
                const badgeTransacao = await obterBadgeAtivo(idBadge, transaction);
                const dadosAtuais = await obterSubmissoesERegistos(idUtilizador, idBadge, transaction);
                const submissaoAtual = selecionarSubmissaoMaisRecente(dadosAtuais.submissoes);
                const registoAtual = selecionarRegistoMaisRecente(dadosAtuais.registos);
                const bloqueioAtual = determinarBloqueioRascunho({
                    badge: badgeTransacao,
                    submissaoMaisRecente: submissaoAtual,
                    registoMaisRecente: registoAtual,
                    agora: new Date()
                });

                if (bloqueioAtual) {
                    throw bloqueioAtual;
                }

                if (normalizarStatus(submissaoAtual?.status) === 'em_progresso') {
                    return {
                        reutilizado: true,
                        origemEvidencias: null,
                        evidenciasCopiadas: 0
                    };
                }

                const registoExpirado = Boolean(registoAtual && registoEstaExpirado(badgeTransacao, registoAtual, new Date()));
                const { submissaoOrigem, origem_evidencias } = escolherOrigemEvidencias({
                    submissoes: dadosAtuais.submissoes,
                    submissaoMaisRecente: submissaoAtual,
                    registoMaisRecente: registoAtual,
                    renovacao: registoExpirado
                });
                const rascunho = await db.Submissoes.create({
                    id_badge: idBadge,
                    id_utilizador: idUtilizador,
                    status: 'em_progresso',
                    data_submissao: new Date(),
                    notificacao_sla: false
                }, { transaction });
                const evidenciasCopiadas = await copiarEvidenciasParaRascunho({
                    idBadge,
                    submissaoOrigem,
                    rascunho,
                    transaction
                });

                return {
                    reutilizado: false,
                    renovacao: registoExpirado,
                    origemEvidencias: origem_evidencias,
                    evidenciasCopiadas
                };
            }
        );

        const badgePessoal = await obterDetalhePessoalBadge(idUtilizador, idBadge);
        const statusResposta = resultado.reutilizado ? 200 : 201;

        return res.status(statusResposta).json(prepararRespostaRascunho({
            reutilizado: resultado.reutilizado,
            renovacao: Boolean(resultado.renovacao ?? badgePessoal?.renovacao),
            origemEvidencias: resultado.origemEvidencias,
            evidenciasCopiadas: resultado.evidenciasCopiadas,
            badge: badgePessoal
        }));
    } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 403 || error.statusCode === 404 || error.statusCode === 409) {
            const corpo = { error: error.message };
            if (error.inconsistencias) {
                corpo.inconsistencias = error.inconsistencias;
            }

            return res.status(error.statusCode).json(corpo);
        }

        console.error('Erro ao criar ou obter rascunho pessoal:', error);
        return res.status(500).json({ error: 'Erro ao criar ou obter rascunho.' });
    }
};

exports.submeterMinhaCandidatura = async (req, res) => {
    try {
        const idBadge = validarInteiroPositivo(req.params.id, 'id');
        const idUtilizador = req.utilizadorLogado?.id_utilizador;

        await obterConsultorAutenticado(idUtilizador);
        await obterBadgeAtivo(idBadge);

        const resultadoSubmissao = await db.sequelize.transaction(
            { isolationLevel: 'SERIALIZABLE' },
            async (transaction) => {
                await obterBadgeAtivo(idBadge, transaction);
                const rascunho = await obterRascunhoEditavel(idUtilizador, idBadge, transaction);
                const idsRequisitosAtivos = await obterIdsRequisitosAtivosDoBadge(idBadge, transaction);

                await validarRascunhoCompleto(rascunho, idsRequisitosAtivos, transaction);

                rascunho.status = 'pendente';
                rascunho.data_submissao = new Date();
                await rascunho.save({ transaction });

                return {
                    idSubmissao: rascunho.id_submissao
                };
            }
        );

        const comunicacoes = await processarComunicacoesSubmissao({
            idSubmissao: resultadoSubmissao.idSubmissao,
            idUtilizador,
            idBadge
        });
        const badge = await obterDetalhePessoalBadge(idUtilizador, idBadge);

        return res.status(200).json({
            message: 'Candidatura submetida com sucesso.',
            submetida: true,
            badge,
            emails: comunicacoes.emails,
            notificacoes: comunicacoes.notificacoes
        });
    } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 403 || error.statusCode === 404 || error.statusCode === 409) {
            const corpo = { error: error.message };

            if (error.codigo) {
                corpo.codigo = error.codigo;
            }

            for (const campo of ['status_atual', 'total_requisitos', 'requisitos_anexados', 'requisitos_em_falta']) {
                if (error[campo] !== undefined) {
                    corpo[campo] = error[campo];
                }
            }

            return res.status(error.statusCode).json(corpo);
        }

        console.error('Erro ao submeter candidatura pessoal:', error);
        return res.status(500).json({ error: 'Erro ao submeter candidatura.' });
    }
};

exports.guardarEvidenciaRascunho = async (req, res) => {
    let uploadInfo = null;

    try {
        const idBadge = validarInteiroPositivo(req.params.id, 'id');
        const idRequisito = validarInteiroPositivo(req.params.idRequisito, 'idRequisito');
        const idUtilizador = req.utilizadorLogado?.id_utilizador;

        await obterConsultorAutenticado(idUtilizador);
        await obterBadgeAtivo(idBadge);
        await obterRequisitoAtivoAssociado(idBadge, idRequisito);
        await obterRascunhoEditavel(idUtilizador, idBadge);

        if (!req.file) {
            throw criarErroComCodigo(400, 'Ficheiro obrigatorio.', 'ficheiro_obrigatorio');
        }

        uploadInfo = await uploadEvidenciaCloudinary(req.file);

        const resultado = await db.sequelize.transaction(
            { isolationLevel: 'SERIALIZABLE' },
            async (transaction) => {
                await obterBadgeAtivo(idBadge, transaction);
                await obterRequisitoAtivoAssociado(idBadge, idRequisito, transaction);
                const rascunho = await obterRascunhoEditavel(idUtilizador, idBadge, transaction);

                const evidenciasAtivas = await db.Documentos.findAll({
                    attributes: ['id_submissao', 'id_ficheiro', 'id_requisito', 'ficheiro', 'updated_file', 'deleted_file'],
                    where: {
                        id_submissao: rascunho.id_submissao,
                        id_requisito: idRequisito,
                        deleted_file: false
                    },
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                const agora = new Date();
                const substituida = evidenciasAtivas.length > 0;

                if (substituida) {
                    await db.Documentos.update(
                        {
                            deleted_file: true,
                            updated_file: agora
                        },
                        {
                            where: {
                                id_submissao: rascunho.id_submissao,
                                id_requisito: idRequisito,
                                deleted_file: false
                            },
                            transaction
                        }
                    );
                }

                const evidencia = await db.Documentos.create({
                    id_submissao: rascunho.id_submissao,
                    id_requisito: idRequisito,
                    ficheiro: uploadInfo.ficheiro,
                    updated_file: agora,
                    deleted_file: false
                }, { transaction });

                return {
                    criada: !substituida,
                    substituida,
                    evidencia: montarEvidencia(evidencia)
                };
            }
        );

        uploadInfo = null;

        const badge = await obterDetalhePessoalBadge(idUtilizador, idBadge);
        return res.status(resultado.criada ? 201 : 200).json({
            mensagem: resultado.criada
                ? 'Evidencia criada com sucesso.'
                : 'Evidencia substituida com sucesso.',
            criada: resultado.criada,
            substituida: resultado.substituida,
            evidencia: resultado.evidencia,
            badge
        });
    } catch (error) {
        await limparUploadEvidencia(uploadInfo);
        return responderErroOperacaoEvidencia(res, error, 'Erro ao guardar evidencia.');
    }
};

exports.removerEvidenciaRascunho = async (req, res) => {
    try {
        const idBadge = validarInteiroPositivo(req.params.id, 'id');
        const idRequisito = validarInteiroPositivo(req.params.idRequisito, 'idRequisito');
        const idUtilizador = req.utilizadorLogado?.id_utilizador;

        await obterConsultorAutenticado(idUtilizador);
        await obterBadgeAtivo(idBadge);
        await obterRequisitoAtivoAssociado(idBadge, idRequisito);

        const resultado = await db.sequelize.transaction(
            { isolationLevel: 'SERIALIZABLE' },
            async (transaction) => {
                await obterBadgeAtivo(idBadge, transaction);
                await obterRequisitoAtivoAssociado(idBadge, idRequisito, transaction);
                const rascunho = await obterRascunhoEditavel(idUtilizador, idBadge, transaction);

                const evidenciasAtivas = await db.Documentos.findAll({
                    attributes: ['id_submissao', 'id_ficheiro'],
                    where: {
                        id_submissao: rascunho.id_submissao,
                        id_requisito: idRequisito,
                        deleted_file: false
                    },
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                if (evidenciasAtivas.length === 0) {
                    throw criarErroComCodigo(404, 'Evidencia inexistente.', 'evidencia_inexistente');
                }

                await db.Documentos.update(
                    {
                        deleted_file: true,
                        updated_file: new Date()
                    },
                    {
                        where: {
                            id_submissao: rascunho.id_submissao,
                            id_requisito: idRequisito,
                            deleted_file: false
                        },
                        transaction
                    }
                );

                return {
                    quantidadeRemovida: evidenciasAtivas.length
                };
            }
        );

        const badge = await obterDetalhePessoalBadge(idUtilizador, idBadge);
        return res.status(200).json({
            mensagem: 'Evidencia removida com sucesso.',
            removida: true,
            id_requisito: idRequisito,
            quantidade_removida: resultado.quantidadeRemovida,
            badge
        });
    } catch (error) {
        return responderErroOperacaoEvidencia(res, error, 'Erro ao remover evidencia.');
    }
};
