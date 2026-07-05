const { Submissoes, Sla, Historico, Consultor, Area, ServiceLine, Utilizador, Role, Notificacoes } = require('../models');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});

const checkSubmissoesSla = async () => {
    try {
        const slaTM = await Sla.findOne({ where: { descricao_sla: 'AVALIACAO_TM' } });
        const slaSL = await Sla.findOne({ where: { descricao_sla: 'AVALIACAO_SL' } });
        const hoje = new Date();

        const submissoesEmEspera = await Submissoes.findAll({
            where: {
                notificacao_sla: false,
                status: { [Op.in]: ['pendente', 'aceite talent manager'] }
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
                        include: [{ model: Role, where: { nome_role: { [Op.in]: ['talent', 'Talent Manager', 'talent manager'] } } }]
                    });

                    for (const tm of talentManagers) {
                        try {
                            await transporter.sendMail({
                                from: process.env.EMAIL_USER,
                                to: tm.email,
                                subject: `🚨 [Aviso SLA] Submissão #${submissao.id_submissao} Pendente`,
                                html: `<p>A submissão <b>#${submissao.id_submissao}</b> encontra-se pendente e ultrapassou o tempo máximo de avaliação.</p>`
                            });
                        } catch (mailError) {
                            console.error(`Erro ao enviar email para Talent Manager ${tm.email}:`, mailError.message);
                        }

                        await Notificacoes.create({
                            id_utilizador: tm.id_utilizador,
                            descricao_notificacao: `A submissão #${submissao.id_submissao} ultrapassou o tempo máximo de avaliação do Talent Manager.`,
                            data_envio: hoje,
                            tipo_notificacao: 'AVISO_SLA'
                        });
                    }
                    await submissao.update({ notificacao_sla: true });
                }
            }
            else if (submissao.status === 'aceite talent manager' && slaSL) {
                const limite = new Date(dataRef);
                limite.setDate(limite.getDate() + slaSL.tempo_max);

                if (hoje > limite) {
                    const idLider = submissao.Utilizador?.Consultor?.Area?.ServiceLine?.id_lider;
                    if (idLider) {
                        const lider = await Utilizador.findByPk(idLider);
                        if (lider) {
                            if (lider.email) {
                                try {
                                    await transporter.sendMail({
                                        from: process.env.EMAIL_USER,
                                        to: lider.email,
                                        subject: `🚨 [Aviso SLA] Submissão #${submissao.id_submissao} Aguarda Avaliação Final`,
                                        html: `<p>A submissão <b>#${submissao.id_submissao}</b> foi aceite pelo Talent Manager mas aguarda a tua avaliação final há demasiado tempo.</p>`
                                    });
                                } catch (mailError) {
                                    console.error(`Erro ao enviar email para Líder ${lider.email}:`, mailError.message);
                                }
                            }

                            await Notificacoes.create({
                                id_utilizador: lider.id_utilizador,
                                descricao_notificacao: `A submissão #${submissao.id_submissao} aguarda a tua avaliação final.`,
                                data_envio: hoje,
                                tipo_notificacao: 'AVISO_SLA'
                            });
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