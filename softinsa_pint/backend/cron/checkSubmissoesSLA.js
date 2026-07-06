const { Submissoes, Sla, Historico, Consultor, Area, ServiceLine, Utilizador, Role, Notificacoes, Recetor, Defs_notificacao } = require('../models');
const { Op } = require('sequelize');
const { enviarEmail } = require('../helpers/emailHelper');

/**
 * Cria uma notificação e o respetivo registo na tabela recetor.
 */
async function criarNotificacaoComRecetor(idUtilizador, descricao, tipo) {
    const notificacao = await Notificacoes.create({
        id_utilizador: idUtilizador,
        descricao_notificacao: descricao,
        data_envio: new Date(),
        tipo_notificacao: tipo
    });

    await Recetor.create({
        id_notificacao: notificacao.id_notificacao,
        id_utilizador: idUtilizador,
        lida: false
    });

    return notificacao;
}

const checkSubmissoesSla = async () => {
    try {
        // Verificar se as notificações push internas estão ativadas
        const defPush = await Defs_notificacao.findByPk(1);
        const pushAtiva = defPush ? defPush.estado : true;

        const slaTM = await Sla.findOne({ where: { descricao_sla: 'AVALIACAO_TM' } });
        const slaSL = await Sla.findOne({ where: { descricao_sla: 'AVALIACAO_SL' } });
        const hoje = new Date();

        const submissoesEmEspera = await Submissoes.findAll({
            where: {
                notificacao_sla: false,
                status: { [Op.in]: ['pendente', 'aceite talent'] }
            },
            include: [
                { model: Historico, required: false },
                {
                    model: Utilizador,
                    include: [{
                        model: Consultor,
                        include: [{
                            model: Area,
                            include: [{ model: ServiceLine }]
                        }]
                    }]
                }
            ]
        });

        for (const submissao of submissoesEmEspera) {
            let dataRef = new Date(submissao.data_submissao);
            if (submissao.Historicos && submissao.Historicos.length > 0) {
                const datasHist = submissao.Historicos.map(h => new Date(h.data_avaliacao));
                dataRef = new Date(Math.max(...datasHist)); 
            }

            if (submissao.status === 'pendente' && slaTM) {
                const limite = new Date(dataRef);
                limite.setDate(limite.getDate() + slaTM.tempo_max);

                if (hoje > limite) {
                    const talentManagers = await Utilizador.findAll({
                        include: [{ model: Role, where: { nome_role: { [Op.iLike]: '%talent%' } } }]
                    });

                    for (const tm of talentManagers) {
                        await enviarEmail({
                            to: tm.email,
                            subject: `🚨 [Aviso SLA] Submissão #${submissao.id_submissao} Pendente`,
                            html: `<p>A submissão <b>#${submissao.id_submissao}</b> encontra-se pendente e ultrapassou o tempo máximo de avaliação.</p>`
                        });

                        // Criar notificação + recetor apenas se o toggle estiver ativo
                        if (pushAtiva) {
                            await criarNotificacaoComRecetor(
                                tm.id_utilizador,
                                `A submissão #${submissao.id_submissao} ultrapassou o tempo máximo de avaliação do Talent Manager.`,
                                'AVISO_SLA'
                            );
                        }
                    }
                    await submissao.update({ notificacao_sla: true });
                }
            }
            else if (submissao.status === 'aceite talent' && slaSL) {
                const limite = new Date(dataRef);
                limite.setDate(limite.getDate() + slaSL.tempo_max);

                if (hoje > limite) {
                    const idLider = submissao.Utilizador?.Consultor?.Area?.ServiceLine?.id_lider;
                    if (idLider) {
                        const lider = await Utilizador.findByPk(idLider);
                        if (lider) {
                            if (lider.email) {
                                await enviarEmail({
                                    to: lider.email,
                                    subject: `🚨 [Aviso SLA] Submissão #${submissao.id_submissao} Aguarda Avaliação Final`,
                                    html: `<p>A submissão <b>#${submissao.id_submissao}</b> foi aceite pelo Talent Manager mas aguarda a tua avaliação final há demasiado tempo.</p>`
                                });
                            }

                            // Criar notificação + recetor apenas se o toggle estiver ativo
                            if (pushAtiva) {
                                await criarNotificacaoComRecetor(
                                    lider.id_utilizador,
                                    `A submissão #${submissao.id_submissao} aguarda a tua avaliação final.`,
                                    'AVISO_SLA'
                                );
                            }
                        }
                    }
                    await submissao.update({ notificacao_sla: true });
                }
            }
        }
    } catch (error) {
        console.error('Erro no checkSubmissoesSla:', error);
    }
};

module.exports = checkSubmissoesSla;