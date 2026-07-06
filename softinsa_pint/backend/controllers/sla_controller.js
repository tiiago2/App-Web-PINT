const db = require('../models');
const { Op } = db.Sequelize;

// Valores por defeito para seed automático
const SLA_DEFAULTS = {
    AVALIACAO_TM: { descricao: 'AVALIACAO_TM', tempo_max: 5 },
    AVALIACAO_SL: { descricao: 'AVALIACAO_SL', tempo_max: 3 },
    AVISO_OBJETIVO: { descricao: 'AVISO_OBJETIVO', tempo_max: 7 }
};

// ID do toggle de notificações push na tabela defs_notificacao
const ID_DEF_PUSH_INTERNA = 1;

/**
 * Garante que os 3 registos SLA existem na BD.
 * Se algum não existir, cria-o com os valores por defeito.
 */
async function garantirRegistosSla() {
    const registos = {};

    for (const [chave, defaults] of Object.entries(SLA_DEFAULTS)) {
        let registo = await db.Sla.findOne({
            where: { descricao_sla: defaults.descricao }
        });

        if (!registo) {
            registo = await db.Sla.create({
                descricao_sla: defaults.descricao,
                tempo_max: defaults.tempo_max,
                data_modificacao: new Date()
            });
            console.log(`[SLA Seed] Registo "${defaults.descricao}" criado com tempo_max=${defaults.tempo_max} dias.`);
        }

        registos[chave] = registo;
    }

    return registos;
}

/**
 * Calcula as métricas de SLA em tempo real a partir das submissões na BD.
 */
async function calcularMetricasSla(slaTM, slaSL) {
    const hoje = new Date();

    // Buscar submissões em aberto (pendente ou aceite talent)
    const submissoesAbertas = await db.Submissoes.findAll({
        where: {
            status: { [Op.in]: ['pendente', 'aceite talent'] }
        },
        include: [{ model: db.Historico, required: false }]
    });

    let emRisco = 0;
    let foraPrazo = 0;

    for (const sub of submissoesAbertas) {
        // Determinar a data de referência (último histórico ou data de submissão)
        let dataRef = new Date(sub.data_submissao);
        const historicos = sub.Historicos || [];
        if (historicos.length > 0) {
            const datasHist = historicos.map(h => new Date(h.data_avaliacao));
            dataRef = new Date(Math.max(...datasHist));
        }

        // Escolher o SLA aplicável consoante a fase
        const slaAplicavel = sub.status === 'pendente' ? slaTM : slaSL;
        if (!slaAplicavel) continue;

        const limiteMs = slaAplicavel.tempo_max * 24 * 60 * 60 * 1000;
        const tempoDecorrido = hoje.getTime() - dataRef.getTime();
        const tempoRestante = limiteMs - tempoDecorrido;

        if (tempoRestante < 0) {
            // Já ultrapassou o SLA
            foraPrazo++;
        } else if (tempoRestante < 24 * 60 * 60 * 1000) {
            // A menos de 24h de estourar
            emRisco++;
        }
    }

    // Calcular média de resposta (submissões fechadas com histórico)
    const submissoesFechadas = await db.Submissoes.findAll({
        where: {
            status: { [Op.in]: ['aceite', 'recusada'] }
        },
        include: [{ model: db.Historico, required: true }]
    });

    let somaDias = 0;
    let totalComHistorico = 0;

    for (const sub of submissoesFechadas) {
        const historicos = sub.Historicos || [];
        if (historicos.length === 0) continue;

        const datasHist = historicos.map(h => new Date(h.data_avaliacao));
        const ultimaAvaliacao = new Date(Math.max(...datasHist));
        const dataSubmissao = new Date(sub.data_submissao);

        const diffMs = ultimaAvaliacao.getTime() - dataSubmissao.getTime();
        const diffDias = diffMs / (1000 * 60 * 60 * 24);

        if (diffDias >= 0) {
            somaDias += diffDias;
            totalComHistorico++;
        }
    }

    const mediaDias = totalComHistorico > 0
        ? Math.round((somaDias / totalComHistorico) * 10) / 10
        : 0;

    return {
        risco: emRisco,
        foraPrazo: foraPrazo,
        mediaDias: mediaDias
    };
}

/**
 * GET /api/sla
 * Devolve a configuração completa de SLA + métricas em tempo real.
 */
exports.obterConfigSla = async (req, res) => {
    try {
        // 1. Garantir que os registos SLA existem
        const registos = await garantirRegistosSla();

        // 2. Ler o estado do toggle "push interna"
        const defPush = await db.Defs_notificacao.findByPk(ID_DEF_PUSH_INTERNA);
        const pushInterna = defPush ? defPush.estado : true;

        // 3. Calcular métricas em tempo real
        const metricas = await calcularMetricasSla(registos.AVALIACAO_TM, registos.AVALIACAO_SL);

        return res.status(200).json({
            fase1_dias: registos.AVALIACAO_TM.tempo_max,
            fase2_dias: registos.AVALIACAO_SL.tempo_max,
            aviso_objetivo_dias: registos.AVISO_OBJETIVO.tempo_max,
            push_interna: pushInterna,
            metricas: metricas
        });
    } catch (error) {
        console.error('Erro ao obter configuração SLA:', error);
        return res.status(500).json({ error: 'Erro ao obter configuração SLA.' });
    }
};

/**
 * PUT /api/sla
 * Guarda a configuração de prazos SLA e o toggle de notificações.
 */
exports.atualizarConfigSla = async (req, res) => {
    try {
        const { fase1_dias, fase2_dias, aviso_objetivo_dias, push_interna } = req.body;

        // Validações
        if (fase1_dias !== undefined && (isNaN(fase1_dias) || fase1_dias < 1 || fase1_dias > 99)) {
            return res.status(400).json({ error: 'O prazo da Fase 1 deve ser entre 1 e 99 dias.' });
        }
        if (fase2_dias !== undefined && (isNaN(fase2_dias) || fase2_dias < 1 || fase2_dias > 99)) {
            return res.status(400).json({ error: 'O prazo da Fase 2 deve ser entre 1 e 99 dias.' });
        }
        if (aviso_objetivo_dias !== undefined && (isNaN(aviso_objetivo_dias) || aviso_objetivo_dias < 1 || aviso_objetivo_dias > 99)) {
            return res.status(400).json({ error: 'O prazo de Aviso de Objetivo deve ser entre 1 e 99 dias.' });
        }

        const agora = new Date();

        // Garantir que os registos existem
        const registos = await garantirRegistosSla();

        // Atualizar cada registo SLA
        if (fase1_dias !== undefined) {
            registos.AVALIACAO_TM.tempo_max = Number(fase1_dias);
            registos.AVALIACAO_TM.data_modificacao = agora;
            await registos.AVALIACAO_TM.save();
        }

        if (fase2_dias !== undefined) {
            registos.AVALIACAO_SL.tempo_max = Number(fase2_dias);
            registos.AVALIACAO_SL.data_modificacao = agora;
            await registos.AVALIACAO_SL.save();
        }

        if (aviso_objetivo_dias !== undefined) {
            registos.AVISO_OBJETIVO.tempo_max = Number(aviso_objetivo_dias);
            registos.AVISO_OBJETIVO.data_modificacao = agora;
            await registos.AVISO_OBJETIVO.save();
        }

        // Atualizar o toggle de notificações push
        if (push_interna !== undefined) {
            const defPush = await db.Defs_notificacao.findByPk(ID_DEF_PUSH_INTERNA);
            if (defPush) {
                defPush.estado = Boolean(push_interna);
                defPush.last_update_def = agora;
                await defPush.save();
            }
        }

        // Registar na tabela de logs
        await db.Logs.create({
            tabela: 'SLA',
            tipo: 2,
            id_alvo: registos.AVALIACAO_TM.id_sla,
            data_log: agora
        });

        return res.status(200).json({
            message: 'Configuração SLA guardada com sucesso.',
            fase1_dias: registos.AVALIACAO_TM.tempo_max,
            fase2_dias: registos.AVALIACAO_SL.tempo_max,
            aviso_objetivo_dias: registos.AVISO_OBJETIVO.tempo_max,
            push_interna: push_interna !== undefined ? Boolean(push_interna) : undefined
        });
    } catch (error) {
        console.error('Erro ao atualizar configuração SLA:', error);
        return res.status(500).json({ error: 'Erro ao atualizar configuração SLA.' });
    }
};
