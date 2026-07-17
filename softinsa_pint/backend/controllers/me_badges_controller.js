const { Op, QueryTypes } = require('sequelize');
const db = require('../models');
const { enviarEmail } = require('../helpers/emailHelper');
const cloudinary = require('cloudinary').v2;
const {
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
} = require('../services/personal_badges_service');
const { scheduleUsersDataChanged } = require('../services/sync_push_service');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

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

        if (!resultado.reutilizado) {
            scheduleUsersDataChanged({ userIds: [idUtilizador], entity: 'submissions' });
        }
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

        processarComunicacoesSubmissao({
            idSubmissao: resultadoSubmissao.idSubmissao,
            idUtilizador,
            idBadge
        }).catch(err => console.error("Erro silencioso nas comunicações:", err));
        
        const comunicacoes = { 
            emails: { enviados: 0, falhados: 0 }, 
            notificacoes: { destinatarios: 0, criadas: 0, falhadas: 0 } 
        };
        const badge = await obterDetalhePessoalBadge(idUtilizador, idBadge);

        scheduleUsersDataChanged({ userIds: [idUtilizador], entity: 'submissions' });
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

        // Verificar se a permissão "Upload de Evidências" está ativa
        const permUpload = await db.Permissoes.findOne({
            where: { descricao_permissao: 'Upload de Evidências' }
        });
        if (permUpload && permUpload.toggle === false) {
            throw criarErroComCodigo(403, 'A funcionalidade de upload de evidências está desativada.', 'upload_evidencias_desativado');
        }

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
        scheduleUsersDataChanged({ userIds: [idUtilizador], entity: 'documents' });
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

        // Verificar se a permissão "Upload de Evidências" está ativa
        const permUpload = await db.Permissoes.findOne({
            where: { descricao_permissao: 'Upload de Evidências' }
        });
        if (permUpload && permUpload.toggle === false) {
            throw criarErroComCodigo(403, 'A funcionalidade de upload de evidências está desativada.', 'upload_evidencias_desativado');
        }

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
        scheduleUsersDataChanged({ userIds: [idUtilizador], entity: 'documents' });
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
