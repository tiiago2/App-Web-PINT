const db = require('../models');

function criarIncludesBadges({ incluirRequisitos = false } = {}) {
    const includes = [
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
    ];

    if (incluirRequisitos) {
        includes.push({
            model: db.Requisitos,
            attributes: ['id_requisito', 'nome_requisito', 'descricao_requisito'],
            where: { deleted_requisitos: false },
            required: false,
            through: { attributes: [] }
        });
    }

    return includes;
}

function formatarBadgeCatalogo(badge, { incluirRequisitos = false } = {}) {
    const nivel = badge.Nivel;
    const area = badge.Area;
    const serviceLine = area?.ServiceLine;
    const learningPath = serviceLine?.LearningPath;

    const resultado = {
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

    if (incluirRequisitos) {
        resultado.requisitos = (badge.Requisitos || []).map((requisito) => ({
            id_requisito: requisito.id_requisito,
            nome_requisito: requisito.nome_requisito,
            descricao_requisito: requisito.descricao_requisito
        }));
    }

    return resultado;
}

function criarErroHttp(statusCode, mensagem) {
    const erro = new Error(mensagem);
    erro.statusCode = statusCode;
    return erro;
}

function temPropriedade(objeto, propriedade) {
    return Object.prototype.hasOwnProperty.call(objeto, propriedade);
}

function validarInteiroPositivo(valor, campo) {
    if (typeof valor === 'number' && Number.isInteger(valor) && Number.isSafeInteger(valor) && valor > 0) {
        return valor;
    }

    if (typeof valor === 'string') {
        const texto = valor.trim();
        if (/^\d+$/.test(texto)) {
            const numero = Number(texto);
            if (Number.isSafeInteger(numero) && numero > 0) {
                return numero;
            }
        }
    }

    throw criarErroHttp(400, `${campo} deve ser um inteiro positivo.`);
}

function validarInteiroNaoNegativo(valor, campo) {
    if (typeof valor === 'number' && Number.isInteger(valor) && Number.isSafeInteger(valor) && valor >= 0) {
        return valor;
    }

    if (typeof valor === 'string') {
        const texto = valor.trim();
        if (/^\d+$/.test(texto)) {
            const numero = Number(texto);
            if (Number.isSafeInteger(numero) && numero >= 0) {
                return numero;
            }
        }
    }

    throw criarErroHttp(400, `${campo} deve ser um inteiro maior ou igual a zero.`);
}

function validarTextoObrigatorio(valor, campo) {
    if (typeof valor !== 'string') {
        throw criarErroHttp(400, `${campo} deve ser uma string nao vazia.`);
    }

    const texto = valor.trim();
    if (!texto) {
        throw criarErroHttp(400, `${campo} deve ser uma string nao vazia.`);
    }

    return texto;
}

function normalizarDescricao(valor) {
    if (valor === null) {
        return null;
    }

    if (typeof valor !== 'string') {
        throw criarErroHttp(400, 'descricao_badge deve ser uma string ou null.');
    }

    return valor.trim();
}

function normalizarValidade(valor) {
    if (valor === null) {
        return null;
    }

    if (typeof valor === 'string') {
        const texto = valor.trim();
        if (texto === '') {
            return null;
        }

        if (/^\d+$/.test(texto)) {
            const numero = Number(texto);
            if (Number.isSafeInteger(numero) && numero > 0) {
                return numero;
            }
        }
    }

    if (typeof valor === 'number' && Number.isInteger(valor) && Number.isSafeInteger(valor) && valor > 0) {
        return valor;
    }

    throw criarErroHttp(400, 'validade deve ser null, string vazia ou inteiro positivo.');
}

function validarBooleano(valor, campo) {
    if (typeof valor !== 'boolean') {
        throw criarErroHttp(400, `${campo} deve ser boolean true ou false.`);
    }

    return valor;
}

function validarBodyBadge(body, { parcial = false } = {}) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw criarErroHttp(400, 'Pedido invalido.');
    }

    const valores = {};
    const camposObrigatorios = ['nome_badge', 'imagem', 'id_area', 'id_nivel', 'pontos_badge', 'especial'];

    if (!parcial) {
        camposObrigatorios.forEach((campo) => {
            if (!temPropriedade(body, campo)) {
                throw criarErroHttp(400, `${campo} e obrigatorio.`);
            }
        });
    }

    if (temPropriedade(body, 'nome_badge')) {
        valores.nome_badge = validarTextoObrigatorio(body.nome_badge, 'nome_badge');
    }

    if (temPropriedade(body, 'imagem')) {
        valores.imagem = validarTextoObrigatorio(body.imagem, 'imagem');
    }

    if (temPropriedade(body, 'descricao_badge')) {
        valores.descricao_badge = normalizarDescricao(body.descricao_badge);
    } else if (!parcial) {
        valores.descricao_badge = null;
    }

    if (temPropriedade(body, 'id_area')) {
        valores.id_area = validarInteiroPositivo(body.id_area, 'id_area');
    }

    if (temPropriedade(body, 'id_nivel')) {
        valores.id_nivel = validarInteiroPositivo(body.id_nivel, 'id_nivel');
    }

    if (temPropriedade(body, 'pontos_badge')) {
        valores.pontos_badge = validarInteiroNaoNegativo(body.pontos_badge, 'pontos_badge');
    }

    if (temPropriedade(body, 'especial')) {
        valores.especial = validarBooleano(body.especial, 'especial');
    }

    if (temPropriedade(body, 'validade')) {
        valores.validade = normalizarValidade(body.validade);
    } else if (!parcial) {
        valores.validade = null;
    }

    return valores;
}

function validarFormatoRequisitos(body) {
    if (!temPropriedade(body, 'requisitos')) {
        return { presente: false, requisitos: [] };
    }

    if (!Array.isArray(body.requisitos)) {
        throw criarErroHttp(400, 'requisitos deve ser um array.');
    }

    const requisitos = body.requisitos.map((requisito, index) => {
        if (!requisito || typeof requisito !== 'object' || Array.isArray(requisito)) {
            throw criarErroHttp(400, `requisitos[${index}] deve ser um objeto.`);
        }

        const temId = temPropriedade(requisito, 'id_requisito');
        const temNome = temPropriedade(requisito, 'nome_requisito');
        const temDescricao = temPropriedade(requisito, 'descricao_requisito');

        if (temId && (temNome || temDescricao)) {
            throw criarErroHttp(400, `requisitos[${index}] mistura id_requisito com campos de criacao.`);
        }

        if (temId) {
            return {
                tipo: 'existente',
                id_requisito: validarInteiroPositivo(requisito.id_requisito, `requisitos[${index}].id_requisito`)
            };
        }

        if (!temNome || !temDescricao) {
            throw criarErroHttp(400, `requisitos[${index}] deve conter id_requisito ou campos de criacao.`);
        }

        return {
            tipo: 'novo',
            nome_requisito: validarTextoObrigatorio(requisito.nome_requisito, `requisitos[${index}].nome_requisito`),
            descricao_requisito: validarTextoObrigatorio(requisito.descricao_requisito, `requisitos[${index}].descricao_requisito`)
        };
    });

    return { presente: true, requisitos };
}

async function validarAreaAtiva(idArea, transaction) {
    const area = await db.Area.findOne({
        where: {
            id_area: idArea,
            deleted_area: false
        },
        transaction
    });

    if (!area) {
        throw criarErroHttp(400, 'Area invalida.');
    }
}

async function validarNivelExistente(idNivel, transaction) {
    const nivel = await db.Nivel.findByPk(idNivel, { transaction });

    if (!nivel) {
        throw criarErroHttp(400, 'Nivel invalido.');
    }
}

async function resolverRequisitos(requisitos, transaction) {
    const idsRequisitos = [];
    const idsExistentesAdicionados = new Set();

    for (const requisito of requisitos) {
        if (requisito.tipo === 'existente') {
            if (idsExistentesAdicionados.has(requisito.id_requisito)) {
                continue;
            }

            const requisitoExistente = await db.Requisitos.findOne({
                where: {
                    id_requisito: requisito.id_requisito,
                    deleted_requisitos: false
                },
                transaction
            });

            if (!requisitoExistente) {
                throw criarErroHttp(400, `Requisito ${requisito.id_requisito} invalido.`);
            }

            idsExistentesAdicionados.add(requisito.id_requisito);
            idsRequisitos.push(requisito.id_requisito);
            continue;
        }

        const novoRequisito = await db.Requisitos.create({
            nome_requisito: requisito.nome_requisito,
            descricao_requisito: requisito.descricao_requisito,
            updated_requisitos: new Date(),
            deleted_requisitos: false
        }, { transaction });

        idsRequisitos.push(novoRequisito.id_requisito);
    }

    return idsRequisitos;
}

async function criarRelacoesRequisitos(idBadge, idsRequisitos, transaction) {
    if (idsRequisitos.length === 0) {
        return;
    }

    const relacoes = idsRequisitos.map((idRequisito) => ({
        id_badge: idBadge,
        id_requisito: idRequisito
    }));

    await db.RequisitosBadge.bulkCreate(relacoes, { transaction });
}

async function obterBadgeCompletoPorId(idBadge, transaction) {
    return db.Badges.findOne({
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
            id_badge: idBadge,
            deleted_badge: false
        },
        include: criarIncludesBadges({ incluirRequisitos: true }),
        transaction
    });
}

exports.criarBadgeAdmin = async (req, res) => {
    let transaction;

    try {
        const valores = validarBodyBadge(req.body, { parcial: false });
        const requisitosInfo = validarFormatoRequisitos(req.body);

        transaction = await db.sequelize.transaction();

        await validarAreaAtiva(valores.id_area, transaction);
        await validarNivelExistente(valores.id_nivel, transaction);
        const idsRequisitos = await resolverRequisitos(requisitosInfo.requisitos, transaction);

        const badge = await db.Badges.create({
            id_area: valores.id_area,
            id_nivel: valores.id_nivel,
            validade: valores.validade,
            especial: valores.especial,
            pontos_badge: valores.pontos_badge,
            nome_badge: valores.nome_badge,
            imagem: valores.imagem,
            update_badge: new Date(),
            deleted_badge: false,
            descricao_badge: valores.descricao_badge
        }, { transaction });

        await criarRelacoesRequisitos(badge.id_badge, idsRequisitos, transaction);

        await db.Logs.create({
            tabela: 'badges',
            tipo: 1,
            id_alvo: badge.id_badge,
            data_log: new Date()
        }, { transaction });

        const badgeCompleto = await obterBadgeCompletoPorId(badge.id_badge, transaction);
        if (!badgeCompleto) {
            throw new Error('Badge completo nao encontrado apos criacao.');
        }

        const resposta = formatarBadgeCatalogo(badgeCompleto, { incluirRequisitos: true });

        await transaction.commit();
        transaction = null;

        return res.status(201).json(resposta);
    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }

        if (error.statusCode === 400) {
            return res.status(400).json({ error: error.message });
        }

        console.error('Erro ao criar Badge:', error);
        return res.status(500).json({ error: 'Erro ao criar badge.' });
    }
};

exports.atualizarBadgeAdmin = async (req, res) => {
    let transaction;

    try {
        const idBadge = validarInteiroPositivo(req.params.id, 'id');

        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: 'Body nao pode estar vazio.' });
        }

        const valores = validarBodyBadge(req.body, { parcial: true });
        const requisitosInfo = validarFormatoRequisitos(req.body);

        if (
            Object.keys(valores).length === 0 &&
            !requisitosInfo.presente
        ) {
            return res.status(400).json({
                error: 'Nenhum campo válido foi fornecido para atualização.'
            });
        }

        transaction = await db.sequelize.transaction();

        const badge = await db.Badges.findOne({
            where: {
                id_badge: idBadge,
                deleted_badge: false
            },
            transaction
        });

        if (!badge) {
            throw criarErroHttp(404, 'Badge nao encontrado.');
        }

        if (temPropriedade(valores, 'id_area')) {
            await validarAreaAtiva(valores.id_area, transaction);
            badge.id_area = valores.id_area;
        }

        if (temPropriedade(valores, 'id_nivel')) {
            await validarNivelExistente(valores.id_nivel, transaction);
            badge.id_nivel = valores.id_nivel;
        }

        if (temPropriedade(valores, 'nome_badge')) badge.nome_badge = valores.nome_badge;
        if (temPropriedade(valores, 'imagem')) badge.imagem = valores.imagem;
        if (temPropriedade(valores, 'descricao_badge')) badge.descricao_badge = valores.descricao_badge;
        if (temPropriedade(valores, 'pontos_badge')) badge.pontos_badge = valores.pontos_badge;
        if (temPropriedade(valores, 'especial')) badge.especial = valores.especial;
        if (temPropriedade(valores, 'validade')) badge.validade = valores.validade;

        badge.update_badge = new Date();
        await badge.save({ transaction });

        if (requisitosInfo.presente) {
            const idsRequisitos = await resolverRequisitos(requisitosInfo.requisitos, transaction);

            await db.RequisitosBadge.destroy({
                where: { id_badge: badge.id_badge },
                transaction
            });

            await criarRelacoesRequisitos(badge.id_badge, idsRequisitos, transaction);
        }

        await db.Logs.create({
            tabela: 'badges',
            tipo: 2,
            id_alvo: badge.id_badge,
            data_log: new Date()
        }, { transaction });

        const badgeCompleto = await obterBadgeCompletoPorId(badge.id_badge, transaction);
        if (!badgeCompleto) {
            throw new Error('Badge completo nao encontrado apos atualizacao.');
        }

        const resposta = formatarBadgeCatalogo(badgeCompleto, { incluirRequisitos: true });

        await transaction.commit();
        transaction = null;

        return res.status(200).json(resposta);
    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }

        if (error.statusCode === 400 || error.statusCode === 404) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        console.error('Erro ao atualizar Badge:', error);
        return res.status(500).json({ error: 'Erro ao atualizar badge.' });
    }
};

exports.removerBadgeAdmin = async (req, res) => {
    let transaction;

    try {
        const idBadge = validarInteiroPositivo(req.params.id, 'id');

        transaction = await db.sequelize.transaction();

        const badge = await db.Badges.findOne({
            where: {
                id_badge: idBadge,
                deleted_badge: false
            },
            transaction
        });

        if (!badge) {
            throw criarErroHttp(404, 'Badge nao encontrado.');
        }

        badge.deleted_badge = true;
        badge.update_badge = new Date();
        await badge.save({ transaction });

        await db.Logs.create({
            tabela: 'badges',
            tipo: 3,
            id_alvo: badge.id_badge,
            data_log: new Date()
        }, { transaction });

        await transaction.commit();
        transaction = null;

        return res.status(200).json({ message: 'Badge removido com sucesso.' });
    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }

        if (error.statusCode === 400 || error.statusCode === 404) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        console.error('Erro ao remover Badge:', error);
        return res.status(500).json({ error: 'Erro ao remover badge.' });
    }
};

exports.listarBadgesCatalogo = async (req, res) => {
    try {
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
            where: { deleted_badge: false },
            include: criarIncludesBadges(),
            order: [['id_badge', 'ASC']]
        });

        return res.status(200).json(badges.map((badge) => formatarBadgeCatalogo(badge)));
    } catch (error) {
        console.error('Erro ao listar Badges do catálogo:', error);
        return res.status(500).json({ error: 'Erro ao listar badges.' });
    }
};

exports.obterBadgeDetalhe = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({ error: 'Id do badge inválido.' });
        }

        const idBadge = Number(id);
        if (!Number.isSafeInteger(idBadge) || idBadge <= 0) {
            return res.status(400).json({ error: 'Id do badge inválido.' });
        }

        const badge = await db.Badges.findOne({
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
                id_badge: idBadge,
                deleted_badge: false
            },
            include: criarIncludesBadges({ incluirRequisitos: true })
        });

        if (!badge) {
            return res.status(404).json({ error: 'Badge não encontrado.' });
        }

        return res.status(200).json(formatarBadgeCatalogo(badge, { incluirRequisitos: true }));
    } catch (error) {
        console.error('Erro ao obter detalhe do Badge:', error);
        return res.status(500).json({ error: 'Erro ao obter badge.' });
    }
};

/**
 * Listar todos os Badges ativos no Admin com informações hierárquicas completas
 */
exports.listarBadgesAdmin = async (req, res) => {
    try {
        const badges = await db.Badges.findAll({
            where: { deleted_badge: false },
            include: [
                {
                    model: db.Nivel,
                    attributes: ['id_nivel', 'nome_nivel']
                },
                {
                    model: db.Area,
                    attributes: ['id_area', 'nome_area', 'id_service_line'],
                    include: [
                        {
                            model: db.ServiceLine,
                            attributes: ['id_service_line', 'nome_service_line', 'id_learning_path'],
                            include: [
                                {
                                    model: db.LearningPath,
                                    attributes: ['id_learning_path', 'nome_learning_path']
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['id_badge', 'ASC']]
        });

        const resultado = badges.map(b => {
            const area = b.Area;
            const sl = area?.ServiceLine;
            const lp = sl?.LearningPath;
            const nivel = b.Nivel;

            return {
                id_badge: b.id_badge,
                id: b.id_badge,
                nome_badge: b.nome_badge,
                nome: b.nome_badge,
                descricao_badge: b.descricao_badge,
                descricao: b.descricao_badge,
                imagem: b.imagem,
                pontos_badge: b.pontos_badge,
                pontos: b.pontos_badge,
                especial: b.especial,
                validade: b.validade,
                id_nivel: b.id_nivel,
                nome_nivel: nivel?.nome_nivel || '—',
                nivel: nivel?.nome_nivel || '—',
                id_area: b.id_area,
                nome_area: area?.nome_area || '—',
                area: area?.nome_area || '—',
                categoria: area?.nome_area || '—',
                id_service_line: area?.id_service_line || null,
                nome_service_line: sl?.nome_service_line || '—',
                serviceLine: sl?.nome_service_line || '—',
                id_learning_path: sl?.id_learning_path || null,
                nome_learning_path: lp?.nome_learning_path || '—',
                learningPath: lp?.nome_learning_path || '—',
                update_badge: b.update_badge
            };
        });

        return res.status(200).json(resultado);
    } catch (error) {
        console.error('Erro ao listar Badges no Admin:', error);
        return res.status(500).json({ error: 'Erro ao listar Badges.' });
    }
};

/**
 * Atualizar um Badge existente (incluindo o URL da imagem)
 */
exports.atualizarBadge = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nome_badge, nome,
            descricao_badge, descricao,
            imagem,
            pontos_badge, pontos,
            especial,
            validade,
            id_area, areaId,
            id_nivel, nivelId
        } = req.body;

        const badge = await db.Badges.findByPk(id);
        if (!badge || badge.deleted_badge) {
            return res.status(404).json({ error: 'Badge não encontrado.' });
        }

        if (nome_badge || nome) badge.nome_badge = (nome_badge || nome).trim();
        if (descricao_badge !== undefined || descricao !== undefined) {
            badge.descricao_badge = (descricao_badge ?? descricao ?? '').trim();
        }
        if (imagem !== undefined && imagem !== null) {
            badge.imagem = String(imagem).trim();
        }
        if (pontos_badge !== undefined || pontos !== undefined) {
            badge.pontos_badge = Number(pontos_badge ?? pontos);
        }
        if (especial !== undefined) badge.especial = Boolean(especial);
        if (validade !== undefined && validade !== '') {
            badge.validade = Number(validade);
        }
        if (id_area || areaId) badge.id_area = Number(id_area || areaId);
        if (id_nivel || nivelId) badge.id_nivel = Number(id_nivel || nivelId);

        badge.update_badge = new Date();
        await badge.save();

        return res.status(200).json(badge);
    } catch (error) {
        console.error('Erro ao atualizar Badge:', error);
        return res.status(500).json({ error: 'Erro ao atualizar Badge.' });
    }
};

/**
 * Eliminar (lógica) um Badge
 */
exports.removerBadge = async (req, res) => {
    try {
        const { id } = req.params;

        const badge = await db.Badges.findByPk(id);
        if (!badge || badge.deleted_badge) {
            return res.status(404).json({ error: 'Badge não encontrado.' });
        }

        badge.deleted_badge = true;
        badge.update_badge = new Date();
        await badge.save();

        return res.status(200).json({ message: 'Badge removido com sucesso.' });
    } catch (error) {
        console.error('Erro ao remover Badge:', error);
        return res.status(500).json({ error: 'Erro ao remover Badge.' });
    }
};
