const { Objetivos, Sla, Notificacoes, Recetor, Defs_notificacao } = require('../models');
const { Op } = require('sequelize');

const checkObjetivos = async () => {
    try {
        // Verificar se as notificações push internas estão ativadas
        const defPush = await Defs_notificacao.findByPk(1);
        const pushAtiva = defPush ? defPush.estado : true;

        if (!pushAtiva) return;

        const regraSla = await Sla.findOne({ where: { descricao_sla: 'AVISO_OBJETIVO' } });
        if (!regraSla) return;

        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() + regraSla.tempo_max);

        const objetivosPendentes = await Objetivos.findAll({
            where: {
                data_conclusao: null,
                notificacao_fim: false,
                data_final: { [Op.lte]: dataLimite }
            }
        });

        for (const objetivo of objetivosPendentes) {
            const notificacao = await Notificacoes.create({
                id_utilizador: objetivo.id_utilizador,
                descricao_notificacao: `O teu objetivo termina no dia ${objetivo.data_final}.`,
                data_envio: new Date(),
                tipo_notificacao: 'AVISO_OBJETIVO'
            });

            await Recetor.create({
                id_notificacao: notificacao.id_notificacao,
                id_utilizador: objetivo.id_utilizador,
                lida: false
            });

            await objetivo.update({ notificacao_fim: true });
        }
    } catch (error) {
        console.error('Erro no checkObjetivos:', error);
    }
};

module.exports = checkObjetivos;