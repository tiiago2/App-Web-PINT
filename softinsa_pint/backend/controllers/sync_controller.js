const db = require('../models');
const { Op } = require('sequelize');

exports.getSyncData = async (req, res) => {
    try {
        const lastSyncParam = req.query.last_sync;
        let lastSync;
        
        if (lastSyncParam) {
            lastSync = new Date(lastSyncParam);
            if (isNaN(lastSync.getTime())) {
                return res.status(400).json({ success: false, message: "Formato de last_sync inválido." });
            }
        }

        // Helper function to build query conditionally
        const buildQuery = (dateField) => {
            if (lastSync) {
                return { where: { [dateField]: { [Op.gte]: lastSync } } };
            }
            return {};
        };

        const [
            submissoes,
            historico,
            objetivos,
            notificacoes,
            registo_badges,
            nivel,
            permissoes,
            recetor,
            assinatura
        ] = await Promise.all([
            db.Submissoes.unscoped().findAll(buildQuery('updated_submissao')),
            db.Historico.unscoped().findAll(buildQuery('updated_historico')),
            db.Objetivos.unscoped().findAll(buildQuery('updated_objetivo')),
            db.Notificacoes.unscoped().findAll(buildQuery('updated_notificacao')),
            db.RegistoBadges.unscoped().findAll(buildQuery('updated_registo')),
            db.Nivel.unscoped().findAll(buildQuery('updated_nivel')),
            db.Permissoes.unscoped().findAll(buildQuery('updated_permissao')),
            db.Recetor.unscoped().findAll(buildQuery('updated_recetor')),
            db.Assinatura.unscoped().findAll(buildQuery('update_assinatura'))
        ]);

        res.status(200).json({
            success: true,
            sync_timestamp: new Date().toISOString(),
            data: {
                submissoes,
                historico,
                objetivos,
                notificacoes,
                registo_badges,
                nivel,
                permissoes,
                recetor,
                assinatura
            }
        });
    } catch (error) {
        console.error("Erro no sync_controller:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
