const db = require('../models');

module.exports = async (req, res, next) => {
    try {
        const idUtilizador = req.utilizadorLogado?.id_utilizador;

        if (!idUtilizador) {
            return res.status(401).json({ error: 'Utilizador nao autenticado.' });
        }

        const utilizador = await db.Utilizador.findByPk(idUtilizador, {
            include: [
                {
                    model: db.Role,
                    attributes: ['nome_role'],
                    through: { attributes: [] }
                }
            ]
        });

        if (!utilizador) {
            return res.status(401).json({ error: 'Utilizador nao autenticado.' });
        }

        const roles = (utilizador.Roles || []).map((role) =>
            String(role.nome_role || '').trim().toLowerCase()
        );

        const isAdmin = roles.includes('admin') || roles.includes('administrador');
        if (!isAdmin) {
            return res.status(403).json({ error: 'Acesso reservado a administradores.' });
        }

        return next();
    } catch (error) {
        console.error('Erro ao autorizar administrador:', error);
        return res.status(500).json({ error: 'Erro ao validar permissoes.' });
    }
};
