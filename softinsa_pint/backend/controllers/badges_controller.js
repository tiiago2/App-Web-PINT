const db = require('../models');

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
