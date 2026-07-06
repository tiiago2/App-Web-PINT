const { RegistoBadges, Badges, Notificacoes, Recetor, Defs_notificacao } = require('../models');
const { Op } = require('sequelize');

const checkBadgesExpirados = async () => {
    try {
        // Verificar se as notificações push internas estão ativadas
        const defPush = await Defs_notificacao.findByPk(1);
        const pushAtiva = defPush ? defPush.estado : true;

        if (!pushAtiva) return;

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
                const notificacao = await Notificacoes.create({
                    id_utilizador: registo.id_utilizador,
                    descricao_notificacao: `O badge '${registo.Badge.nome_badge}' expirou.`,
                    data_envio: hoje,
                    tipo_notificacao: 'BADGE_EXPIRADO'
                });

                await Recetor.create({
                    id_notificacao: notificacao.id_notificacao,
                    id_utilizador: registo.id_utilizador,
                    lida: false
                });

                await registo.update({ expirado: true });
            }
        }
    } catch (error) {
        console.error('Erro no checkBadgesExpirados:', error);
    }
};

module.exports = checkBadgesExpirados;