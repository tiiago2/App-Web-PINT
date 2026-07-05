const { RegistoBadges, Badges, Notificacoes } = require('../models');
const { Op } = require('sequelize');

const checkBadgesExpirados = async () => {
    try {
        const registosAtivos = await RegistoBadges.findAll({
            where: { expirado: false },
            include: [{
                model: Badges,
                where: { validade: { [Op.not]: null } }
            }]
        });

        const hoje = new Date();

        for (const registo of registosAtivos) {
            const dataExpiracao = new Date(registo.data_obtencao);
            dataExpiracao.setDate(dataExpiracao.getDate() + Number(registo.Badge.validade));

            if (hoje > dataExpiracao) {
                await Notificacoes.create({
                    id_utilizador: registo.id_utilizador,
                    descricao_notificacao: `O badge '${registo.Badge.nome_badge}' expirou.`,
                    data_envio: hoje,
                    tipo_notificacao: 'BADGE_EXPIRADO'
                });
                await registo.update({ expirado: true });
            }
        }
    } catch (error) {
        console.error('Erro no checkBadgesExpirados:', error);
    }
};

module.exports = checkBadgesExpirados;