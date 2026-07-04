const db = require('../models');
const { Op } = db.Sequelize;

/**
 * 1. Obter utilizadores elegíveis para serem Líderes de Service Line
 * (Filtra utilizadores que já sejam líderes ativos de OUTRA Service Line)
 */
exports.obterLideresElegiveis = async (req, res) => {
    try {
        const idServiceLineAtual = req.query.idServiceLine || req.query.id_service_line;

        // Procura todas as Service Lines ativas
        const serviceLinesAtivas = await db.ServiceLine.findAll({
            where: { deleted_service: false },
            attributes: ['id_service_line', 'id_lider']
        });

        // Conjunto de IDs de utilizadores que já são líderes de outras Service Lines
        const idsLideresOcupados = new Set();
        serviceLinesAtivas.forEach(sl => {
            if (sl.id_lider && String(sl.id_service_line) !== String(idServiceLineAtual)) {
                idsLideresOcupados.add(Number(sl.id_lider));
            }
        });

        // Procura todos os utilizadores
        const utilizadores = await db.Utilizador.findAll({
            attributes: ['id_utilizador', 'nome_user', 'email'],
            order: [['nome_user', 'ASC']]
        });

        // Filtra utilizadores elegíveis
        const elegiveis = utilizadores
            .filter(u => !idsLideresOcupados.has(Number(u.id_utilizador)))
            .map(u => ({
                id: u.id_utilizador,
                id_utilizador: u.id_utilizador,
                nome: u.nome_user,
                nome_user: u.nome_user,
                email: u.email
            }));

        return res.status(200).json(elegiveis);
    } catch (error) {
        console.error('Erro ao obter utilizadores elegíveis para líder:', error);
        return res.status(500).json({ error: 'Erro interno ao obter utilizadores elegíveis.' });
    }
};

// =========================================================================
// LEARNING PATHS
// =========================================================================

exports.listarLearningPaths = async (req, res) => {
    try {
        const lps = await db.LearningPath.findAll({
            where: { deleted_path: false },
            include: [
                {
                    model: db.ServiceLine,
                    where: { deleted_service: false },
                    required: false,
                    include: [
                        {
                            model: db.Area,
                            where: { deleted_area: false },
                            required: false,
                            include: [
                                {
                                    model: db.Badges,
                                    where: { deleted_badge: false },
                                    required: false
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['id_learning_path', 'ASC']]
        });

        const resultado = lps.map(lp => {
            const serviceLines = lp.ServiceLines || [];
            let totalAreas = 0;
            let totalBadges = 0;

            serviceLines.forEach(sl => {
                const areas = sl.Areas || [];
                totalAreas += areas.length;
                areas.forEach(a => {
                    totalBadges += (a.Badges || []).length;
                });
            });

            return {
                id_learning_path: lp.id_learning_path,
                id: lp.id_learning_path,
                nome_learning_path: lp.nome_learning_path,
                nome: lp.nome_learning_path,
                descricao_larning_path: lp.descricao_larning_path,
                descricao: lp.descricao_larning_path,
                updated_path: lp.updated_path,
                total_service_lines: serviceLines.length,
                totalServiceLines: serviceLines.length,
                total_areas: totalAreas,
                totalAreas: totalAreas,
                total_badges: totalBadges,
                totalBadges: totalBadges
            };
        });

        return res.status(200).json(resultado);
    } catch (error) {
        console.error('Erro ao listar Learning Paths:', error);
        return res.status(500).json({ error: 'Erro ao listar Learning Paths.' });
    }
};

exports.criarLearningPath = async (req, res) => {
    try {
        const { nome_learning_path, nome, descricao_larning_path, descricao } = req.body;
        const nomeFinal = nome_learning_path || nome;
        const descFinal = descricao_larning_path || descricao || '';

        if (!nomeFinal || !nomeFinal.trim()) {
            return res.status(400).json({ error: 'O nome do Learning Path é obrigatório.' });
        }

        const novoLP = await db.LearningPath.create({
            nome_learning_path: nomeFinal.trim(),
            descricao_larning_path: descFinal.trim(),
            updated_path: new Date(),
            deleted_path: false
        });

        return res.status(201).json(novoLP);
    } catch (error) {
        console.error('Erro ao criar Learning Path:', error);
        return res.status(500).json({ error: 'Erro ao criar Learning Path.' });
    }
};

exports.atualizarLearningPath = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome_learning_path, nome, descricao_larning_path, descricao } = req.body;
        const nomeFinal = nome_learning_path || nome;
        const descFinal = descricao_larning_path || descricao;

        const lp = await db.LearningPath.findByPk(id);
        if (!lp || lp.deleted_path) {
            return res.status(404).json({ error: 'Learning Path não encontrado.' });
        }

        if (nomeFinal) lp.nome_learning_path = nomeFinal.trim();
        if (descFinal !== undefined) lp.descricao_larning_path = descFinal ? descFinal.trim() : null;
        lp.updated_path = new Date();

        await lp.save();
        return res.status(200).json(lp);
    } catch (error) {
        console.error('Erro ao atualizar Learning Path:', error);
        return res.status(500).json({ error: 'Erro ao atualizar Learning Path.' });
    }
};

/**
 * Ponto 2: Bloqueio de eliminação em cascata para Learning Path
 */
exports.removerLearningPath = async (req, res) => {
    try {
        const { id } = req.params;

        const lp = await db.LearningPath.findByPk(id);
        if (!lp || lp.deleted_path) {
            return res.status(404).json({ error: 'Learning Path não encontrado.' });
        }

        // Verifica se existem Service Lines ativas associadas
        const slsAtivas = await db.ServiceLine.count({
            where: {
                id_learning_path: id,
                deleted_service: false
            }
        });

        if (slsAtivas > 0) {
            return res.status(400).json({
                error: `Não é possível eliminar o Learning Path "${lp.nome_learning_path}" pois possui ${slsAtivas} Service Line(s) associada(s) ativa(s). Elimine ou reassocie as Service Lines primeiro.`
            });
        }

        lp.deleted_path = true;
        lp.updated_path = new Date();
        await lp.save();

        return res.status(200).json({ message: 'Learning Path removido com sucesso.' });
    } catch (error) {
        console.error('Erro ao remover Learning Path:', error);
        return res.status(500).json({ error: 'Erro ao remover Learning Path.' });
    }
};

// =========================================================================
// SERVICE LINES
// =========================================================================

exports.listarServiceLines = async (req, res) => {
    try {
        const serviceLines = await db.ServiceLine.findAll({
            where: { deleted_service: false },
            include: [
                {
                    model: db.LearningPath,
                    attributes: ['id_learning_path', 'nome_learning_path']
                },
                {
                    model: db.Utilizador,
                    as: 'Lider',
                    attributes: ['id_utilizador', 'nome_user', 'email']
                },
                {
                    model: db.Area,
                    where: { deleted_area: false },
                    required: false,
                    include: [
                        {
                            model: db.Badges,
                            where: { deleted_badge: false },
                            required: false
                        }
                    ]
                }
            ],
            order: [['id_service_line', 'ASC']]
        });

        const resultado = serviceLines.map(sl => {
            const areas = sl.Areas || [];
            let totalBadges = 0;
            areas.forEach(a => {
                totalBadges += (a.Badges || []).length;
            });

            const lider = sl.Lider;

            return {
                id_service_line: sl.id_service_line,
                id: sl.id_service_line,
                nome_service_line: sl.nome_service_line,
                nome: sl.nome_service_line,
                descricao_service_line: sl.descricao_service_line,
                descricao: sl.descricao_service_line,
                id_learning_path: sl.id_learning_path,
                learningPathId: sl.id_learning_path,
                nome_learning_path: sl.LearningPath?.nome_learning_path || '—',
                learningPath: sl.LearningPath?.nome_learning_path || '—',
                id_lider: sl.id_lider,
                idLider: sl.id_lider,
                nome_lider: lider?.nome_user || '—',
                lider: lider?.nome_user || '—',
                updated_service: sl.updated_service,
                total_areas: areas.length,
                totalAreas: areas.length,
                total_badges: totalBadges,
                totalBadges: totalBadges
            };
        });

        return res.status(200).json(resultado);
    } catch (error) {
        console.error('Erro ao listar Service Lines:', error);
        return res.status(500).json({ error: 'Erro ao listar Service Lines.' });
    }
};

/**
 * Garante que o utilizador ganha a role de "Service Line Leader" na BD
 */
async function atribuirRoleLiderServiceLine(idUtilizador) {
    if (!idUtilizador) return;

    try {
        // Encontra a role "Service Line Leader"
        const roleLeader = await db.Role.findOne({
            where: {
                nome_role: { [Op.iLike]: '%Service Line Leader%' }
            }
        });

        if (!roleLeader) {
            console.log('Role Service Line Leader não encontrada na BD.');
            return;
        }

        const idRole = roleLeader.id_role;

        // Verifica se o utilizador já tem esta role
        const temRole = await db.UtilizadorRoles.findOne({
            where: {
                id_utilizador: Number(idUtilizador),
                id_role: Number(idRole)
            }
        });

        if (!temRole) {
            await db.UtilizadorRoles.create({
                id_utilizador: Number(idUtilizador),
                id_role: Number(idRole)
            });
            console.log(`Role Service Line Leader atribuída com sucesso ao utilizador ID ${idUtilizador}.`);
        }
    } catch (err) {
        console.error('Erro ao atribuir role de Service Line Leader:', err);
    }
}

exports.criarServiceLine = async (req, res) => {
    try {
        const {
            nome_service_line, nome,
            descricao_service_line, descricao,
            id_learning_path, learningPathId,
            id_lider, idLider
        } = req.body;

        const nomeFinal = nome_service_line || nome;
        const descFinal = descricao_service_line || descricao || '';
        const lpFinal = id_learning_path || learningPathId;
        const liderFinal = id_lider || idLider;

        if (!nomeFinal || !nomeFinal.trim()) {
            return res.status(400).json({ error: 'O nome da Service Line é obrigatório.' });
        }
        if (!lpFinal) {
            return res.status(400).json({ error: 'O Learning Path é obrigatório.' });
        }
        if (!liderFinal) {
            return res.status(400).json({ error: 'O Líder da Service Line é obrigatório.' });
        }

        // Ponto 1: Verificar se o líder já é líder ativo de outra Service Line
        const liderOcupado = await db.ServiceLine.findOne({
            where: {
                id_lider: Number(liderFinal),
                deleted_service: false
            }
        });

        if (liderOcupado) {
            return res.status(400).json({
                error: 'O utilizador selecionado já é líder de outra Service Line ativa.'
            });
        }

        const novaSL = await db.ServiceLine.create({
            nome_service_line: nomeFinal.trim(),
            descricao_service_line: descFinal.trim(),
            id_learning_path: Number(lpFinal),
            id_lider: Number(liderFinal),
            updated_service: new Date(),
            deleted_service: false
        });

        // Ponto 1: Atribuição automática da role "Service Line Leader"
        await atribuirRoleLiderServiceLine(liderFinal);

        return res.status(201).json(novaSL);
    } catch (error) {
        console.error('Erro ao criar Service Line:', error);
        return res.status(500).json({ error: 'Erro ao criar Service Line.' });
    }
};

exports.atualizarServiceLine = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nome_service_line, nome,
            descricao_service_line, descricao,
            id_learning_path, learningPathId,
            id_lider, idLider
        } = req.body;

        const sl = await db.ServiceLine.findByPk(id);
        if (!sl || sl.deleted_service) {
            return res.status(404).json({ error: 'Service Line não encontrada.' });
        }

        const nomeFinal = nome_service_line || nome;
        const descFinal = descricao_service_line || descricao;
        const lpFinal = id_learning_path || learningPathId;
        const liderFinal = id_lider || idLider;

        if (liderFinal) {
            // Ponto 1: Verificar se o novo líder já é líder de OUTRA Service Line
            const liderOcupado = await db.ServiceLine.findOne({
                where: {
                    id_lider: Number(liderFinal),
                    deleted_service: false,
                    id_service_line: { [Op.ne]: Number(id) }
                }
            });

            if (liderOcupado) {
                return res.status(400).json({
                    error: 'O utilizador selecionado já é líder de outra Service Line ativa.'
                });
            }
        }

        if (nomeFinal) sl.nome_service_line = nomeFinal.trim();
        if (descFinal !== undefined) sl.descricao_service_line = descFinal ? descFinal.trim() : null;
        if (lpFinal) sl.id_learning_path = Number(lpFinal);
        if (liderFinal) sl.id_lider = Number(liderFinal);
        sl.updated_service = new Date();

        await sl.save();

        if (liderFinal) {
            await atribuirRoleLiderServiceLine(liderFinal);
        }

        return res.status(200).json(sl);
    } catch (error) {
        console.error('Erro ao atualizar Service Line:', error);
        return res.status(500).json({ error: 'Erro ao atualizar Service Line.' });
    }
};

/**
 * Ponto 2: Bloqueio de eliminação em cascata para Service Line
 */
exports.removerServiceLine = async (req, res) => {
    try {
        const { id } = req.params;

        const sl = await db.ServiceLine.findByPk(id);
        if (!sl || sl.deleted_service) {
            return res.status(404).json({ error: 'Service Line não encontrada.' });
        }

        // Verifica se existem Áreas ativas associadas
        const areasAtivas = await db.Area.count({
            where: {
                id_service_line: id,
                deleted_area: false
            }
        });

        if (areasAtivas > 0) {
            return res.status(400).json({
                error: `Não é possível eliminar a Service Line "${sl.nome_service_line}" pois possui ${areasAtivas} Área(s) associada(s) ativa(s). Elimine ou reassocie as Áreas primeiro.`
            });
        }

        sl.deleted_service = true;
        sl.updated_service = new Date();
        await sl.save();

        return res.status(200).json({ message: 'Service Line removida com sucesso.' });
    } catch (error) {
        console.error('Erro ao remover Service Line:', error);
        return res.status(500).json({ error: 'Erro ao remover Service Line.' });
    }
};

// =========================================================================
// ÁREAS
// =========================================================================

exports.listarAreas = async (req, res) => {
    try {
        const areas = await db.Area.findAll({
            where: { deleted_area: false },
            include: [
                {
                    model: db.ServiceLine,
                    where: { deleted_service: false },
                    required: false,
                    include: [
                        {
                            model: db.LearningPath,
                            attributes: ['id_learning_path', 'nome_learning_path']
                        },
                        {
                            model: db.Utilizador,
                            as: 'Lider',
                            attributes: ['id_utilizador', 'nome_user']
                        }
                    ]
                },
                {
                    model: db.Badges,
                    where: { deleted_badge: false },
                    required: false
                }
            ],
            order: [['id_area', 'ASC']]
        });

        const resultado = areas.map(a => {
            const sl = a.ServiceLine;
            const lp = sl?.LearningPath;
            const lider = sl?.Lider;
            const badges = a.Badges || [];

            return {
                id_area: a.id_area,
                id: a.id_area,
                nome_area: a.nome_area,
                nome: a.nome_area,
                area: a.nome_area,
                descricao_area: a.descricao_area,
                descricao: a.descricao_area,
                id_service_line: a.id_service_line,
                serviceLineId: a.id_service_line,
                nome_service_line: sl?.nome_service_line || '—',
                serviceLine: sl?.nome_service_line || '—',
                id_learning_path: sl?.id_learning_path || null,
                learningPathId: sl?.id_learning_path || null,
                nome_learning_path: lp?.nome_learning_path || '—',
                learningPath: lp?.nome_learning_path || '—',
                nome_lider: lider?.nome_user || '—',
                lider: lider?.nome_user || '—',
                updated_area: a.updated_area,
                total_badges: badges.length,
                totalBadges: badges.length
            };
        });

        return res.status(200).json(resultado);
    } catch (error) {
        console.error('Erro ao listar Áreas:', error);
        return res.status(500).json({ error: 'Erro ao listar Áreas.' });
    }
};

exports.criarArea = async (req, res) => {
    try {
        const { nome_area, nome, descricao_area, descricao, id_service_line, serviceLineId } = req.body;
        const nomeFinal = nome_area || nome;
        const descFinal = descricao_area || descricao || '';
        const slFinal = id_service_line || serviceLineId;

        if (!nomeFinal || !nomeFinal.trim()) {
            return res.status(400).json({ error: 'O nome da Área é obrigatório.' });
        }
        if (!slFinal) {
            return res.status(400).json({ error: 'A Service Line é obrigatória.' });
        }

        const novaArea = await db.Area.create({
            nome_area: nomeFinal.trim(),
            descricao_area: descFinal.trim(),
            id_service_line: Number(slFinal),
            updated_area: new Date(),
            deleted_area: false
        });

        return res.status(201).json(novaArea);
    } catch (error) {
        console.error('Erro ao criar Área:', error);
        return res.status(500).json({ error: 'Erro ao criar Área.' });
    }
};

exports.atualizarArea = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome_area, nome, descricao_area, descricao, id_service_line, serviceLineId } = req.body;

        const area = await db.Area.findByPk(id);
        if (!area || area.deleted_area) {
            return res.status(404).json({ error: 'Área não encontrada.' });
        }

        const nomeFinal = nome_area || nome;
        const descFinal = descricao_area || descricao;
        const slFinal = id_service_line || serviceLineId;

        if (nomeFinal) area.nome_area = nomeFinal.trim();
        if (descFinal !== undefined) area.descricao_area = descFinal ? descFinal.trim() : null;
        if (slFinal) area.id_service_line = Number(slFinal);
        area.updated_area = new Date();

        await area.save();
        return res.status(200).json(area);
    } catch (error) {
        console.error('Erro ao atualizar Área:', error);
        return res.status(500).json({ error: 'Erro ao atualizar Área.' });
    }
};

/**
 * Ponto 2: Bloqueio de eliminação em cascata para Área
 */
exports.removerArea = async (req, res) => {
    try {
        const { id } = req.params;

        const area = await db.Area.findByPk(id);
        if (!area || area.deleted_area) {
            return res.status(404).json({ error: 'Área não encontrada.' });
        }

        // Verifica se existem Badges ativos associados
        const badgesAtivos = await db.Badges.count({
            where: {
                id_area: id,
                deleted_badge: false
            }
        });

        if (badgesAtivos > 0) {
            return res.status(400).json({
                error: `Não é possível eliminar a Área "${area.nome_area}" pois possui ${badgesAtivos} Badge(s) associado(s) ativo(s). Elimine ou reassocie os Badges primeiro.`
            });
        }

        area.deleted_area = true;
        area.updated_area = new Date();
        await area.save();

        return res.status(200).json({ message: 'Área removida com sucesso.' });
    } catch (error) {
        console.error('Erro ao remover Área:', error);
        return res.status(500).json({ error: 'Erro ao remover Área.' });
    }
};


