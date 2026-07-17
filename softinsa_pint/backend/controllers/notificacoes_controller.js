const {
    sequelize,
    Utilizador,
    Role,
    Notificacoes,
    Recetor,
    SyncRecetorDeleted
} = require('../models');
const { Op } = require('sequelize');
const { scheduleUsersDataChanged } = require('../services/sync_push_service');

module.exports = {
    async getNotificacoes(req, res) {
        try {
            const id_utilizador = req.utilizadorLogado.id_utilizador;

            // Buscar as notificações associadas a este utilizador (excluindo avisos)
            const user = await Utilizador.findByPk(id_utilizador, {
                include: [{
                    model: Notificacoes,
                    where: {
                        tipo_notificacao: {
                            [Op.notILike]: 'aviso%'
                        }
                    },
                    through: { attributes: [] },
                    required: false
                }]
            });

            if (!user) {
                return res.status(404).json({ error: "Utilizador não encontrado." });
            }

            // Mapear para um formato limpo
            const lista = (user.Notificacoes || []).map(n => ({
                id_notificacao: n.id_notificacao,
                descricao_notificacao: n.descricao_notificacao,
                tipo_notificacao: n.tipo_notificacao,
                data_envio: n.data_envio
            }));

            // Ordenar por data mais recente primeiro
            lista.sort((a, b) => new Date(b.data_envio) - new Date(a.data_envio));

            return res.status(200).json(lista);
        } catch (error) {
            console.error("Erro ao obter notificações:", error);
            return res.status(500).json({ error: "Erro interno no servidor ao obter notificações." });
        }
    },

    async updateRecetor(req, res) {
        try {
            // No-op endpoint returning success to keep compatibility with frontend client calls
            return res.status(200).json({ message: "OK" });
        } catch (error) {
            console.error("Erro ao atualizar recetor:", error);
            return res.status(500).json({ error: "Erro interno no servidor." });
        }
    },

    async enviarAviso(req, res) {
        try {
            const id_remetente = req.utilizadorLogado.id_utilizador;
            const { mensagem, tipoDestino, destino } = req.body;

            if (!mensagem) {
                return res.status(400).json({ error: "O texto da mensagem é obrigatório." });
            }

            // 1. Criar a Notificação na tabela principal
            const novaNotif = await Notificacoes.create({
                id_utilizador: id_remetente,
                descricao_notificacao: mensagem,
                data_envio: new Date(),
                tipo_notificacao: `aviso:${tipoDestino || 'grupo'}:${destino || 'Todos'}`
            });

            // 2. Determinar destinatários
            let destinatariosIds = [];

            if (tipoDestino === 'grupo') {
                let roleQuery = null;
                if (destino === 'Todos os Consultores') {
                    roleQuery = 'Consultor';
                } else if (destino === 'Todos os Talent Managers') {
                    roleQuery = 'Talent Manager';
                } else if (destino === 'Todos os Service Line Leaders') {
                    roleQuery = 'Service Line Leader';
                }

                if (roleQuery) {
                    // Buscar utilizadores que têm esta Role
                    const users = await Utilizador.findAll({
                        include: [{
                            model: Role,
                            where: { nome_role: roleQuery },
                            through: { attributes: [] }
                        }],
                        attributes: ['id_utilizador']
                    });
                    destinatariosIds = users.map(u => u.id_utilizador);
                } else {
                    // "Todos" -> todos os utilizadores ativos
                    const users = await Utilizador.findAll({
                        where: { ativo: true },
                        attributes: ['id_utilizador']
                    });
                    destinatariosIds = users.map(u => u.id_utilizador);
                }
            } else if (tipoDestino === 'individual' && destino) {
                // Destinatário individual
                const user = await Utilizador.findOne({
                    where: {
                        [Op.or]: [
                            { nome_user: destino },
                            { email: destino }
                        ]
                    },
                    attributes: ['id_utilizador']
                });
                if (user) {
                    destinatariosIds = [user.id_utilizador];
                }
            }

            // 3. Inserir os destinatários na tabela intermédia Recetor
            if (destinatariosIds.length > 0) {
                const dadosRecetores = destinatariosIds.map(id_dest => ({
                    id_notificacao: novaNotif.id_notificacao,
                    id_utilizador: id_dest
                }));
                await Recetor.bulkCreate(dadosRecetores);
            }

            scheduleUsersDataChanged({
                userIds: destinatariosIds,
                entity: 'notifications'
            });
            return res.status(201).json({
                message: "Aviso enviado com sucesso!",
                id_notificacao: novaNotif.id_notificacao
            });
        } catch (error) {
            console.error("Erro ao enviar aviso:", error);
            return res.status(500).json({ error: "Erro interno no servidor ao enviar o aviso." });
        }
    },

    async getAvisosUtilizador(req, res) {
        try {
            const id_utilizador = req.utilizadorLogado.id_utilizador;

            // Helper para mapear avisos decodificando o tipoDestino e destino do campo tipo_notificacao
            const mapearAviso = (n, autorPadrao) => {
                const partes = (n.tipo_notificacao || "").split(":");
                const tipoDest = partes[1] || "grupo";
                const dest = partes[2] || "Todos";
                return {
                    id: n.id_notificacao,
                    mensagem: n.descricao_notificacao,
                    tipoDestino: tipoDest,
                    destino: dest,
                    data: n.data_envio,
                    autor: n.Utilizador?.nome_user || autorPadrao
                };
            };

            // 1. Obter avisos recebidos pelo utilizador (através da tabela intermédia Recetor)
            const userWithReceived = await Utilizador.findByPk(id_utilizador, {
                include: [{
                    model: Notificacoes,
                    where: { tipo_notificacao: { [Op.iLike]: 'aviso%' } },
                    through: { attributes: [] },
                    include: [{
                        model: Utilizador, // O autor/remetente do aviso
                        attributes: ['nome_user']
                    }]
                }]
            });

            const recebidos = (userWithReceived?.Notificacoes || []).map(n => mapearAviso(n, "Sistema"));

            // 2. Obter todos os avisos enviados por este utilizador
            const enviadosRaw = await Notificacoes.findAll({
                where: {
                    id_utilizador: id_utilizador,
                    tipo_notificacao: { [Op.iLike]: 'aviso%' }
                },
                include: [{
                    model: Utilizador,
                    attributes: ['nome_user']
                }],
                order: [['data_envio', 'DESC']]
            });

            const enviados = enviadosRaw.map(n => mapearAviso(n, "Eu"));

            return res.status(200).json({
                recebidos,
                enviados
            });
        } catch (error) {
            console.error("Erro ao obter avisos do utilizador:", error);
            return res.status(500).json({ error: "Erro interno no servidor ao obter os avisos." });
        }
    },

    async editarAviso(req, res) {
        try {
            const id_remetente = req.utilizadorLogado.id_utilizador;
            const { id } = req.params;
            const { mensagem, tipoDestino, destino } = req.body;

            if (!mensagem) {
                return res.status(400).json({ error: "O texto da mensagem é obrigatório." });
            }

            // 1. Procurar o aviso
            const aviso = await Notificacoes.findByPk(id);
            if (!aviso) {
                return res.status(404).json({ error: "Aviso não encontrado." });
            }

            // 2. Segurança: apenas o próprio utilizador que mandou pode editar
            if (aviso.id_utilizador !== id_remetente) {
                return res.status(403).json({ error: "Não autorizado a editar este aviso." });
            }

            const destinatariosAfetados = await sequelize.transaction(async (transaction) => {
                const avisoTransacao = await Notificacoes.findByPk(id, {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                const recetoresAtuais = await Recetor.findAll({
                    where: { id_notificacao: id },
                    attributes: ['id_utilizador'],
                    transaction,
                    raw: true
                });

                // 3. Determinar novos destinatários antes de alterar as relações atuais
                let destinatariosIds = [];
                if (tipoDestino === 'grupo') {
                    let roleQuery = null;
                    if (destino === 'Todos os Consultores') {
                        roleQuery = 'Consultor';
                    } else if (destino === 'Todos os Talent Managers') {
                        roleQuery = 'Talent Manager';
                    } else if (destino === 'Todos os Service Line Leaders') {
                        roleQuery = 'Service Line Leader';
                    }

                    if (roleQuery) {
                        const users = await Utilizador.findAll({
                            include: [{
                                model: Role,
                                where: { nome_role: roleQuery },
                                through: { attributes: [] }
                            }],
                            attributes: ['id_utilizador'],
                            transaction
                        });
                        destinatariosIds = users.map((user) => user.id_utilizador);
                    } else {
                        const users = await Utilizador.findAll({
                            where: { ativo: true },
                            attributes: ['id_utilizador'],
                            transaction
                        });
                        destinatariosIds = users.map((user) => user.id_utilizador);
                    }
                } else if (tipoDestino === 'individual' && destino) {
                    const user = await Utilizador.findOne({
                        where: {
                            [Op.or]: [
                                { nome_user: destino },
                                { email: destino }
                            ]
                        },
                        attributes: ['id_utilizador'],
                        transaction
                    });
                    if (user) {
                        destinatariosIds = [user.id_utilizador];
                    }
                }

                const idsAtuais = new Set(recetoresAtuais.map((recetor) => recetor.id_utilizador));
                const idsFinais = new Set(destinatariosIds);
                const idsAdicionados = [...idsFinais].filter((idUtilizador) => !idsAtuais.has(idUtilizador));
                const idsRemovidos = [...idsAtuais].filter((idUtilizador) => !idsFinais.has(idUtilizador));
                const agora = new Date();

                // 4. Manter data_envio como data original e registar apenas a alteração
                await avisoTransacao.update({
                    descricao_notificacao: mensagem,
                    updated_notificacao: agora,
                    tipo_notificacao: `aviso:${tipoDestino || 'grupo'}:${destino || 'Todos'}`
                }, { transaction });

                if (idsRemovidos.length > 0) {
                    await SyncRecetorDeleted.bulkCreate(
                        idsRemovidos.map((idUtilizador) => ({
                            id_notificacao: Number(id),
                            id_utilizador: idUtilizador,
                            deleted_at: agora
                        })),
                        { transaction }
                    );

                    await Recetor.destroy({
                        where: {
                            id_notificacao: id,
                            id_utilizador: { [Op.in]: idsRemovidos }
                        },
                        transaction
                    });
                }

                if (idsAdicionados.length > 0) {
                    await Recetor.bulkCreate(
                        idsAdicionados.map((idUtilizador) => ({
                            id_notificacao: Number(id),
                            id_utilizador: idUtilizador
                        })),
                        { transaction }
                    );
                }
                return [...new Set([...idsAtuais, ...idsFinais])];
            });

            scheduleUsersDataChanged({
                userIds: destinatariosAfetados,
                entity: 'notifications'
            });
            return res.status(200).json({
                message: "Aviso atualizado com sucesso!",
                id_notificacao: id
            });
        } catch (error) {
            console.error("Erro ao editar aviso:", error);
            return res.status(500).json({ error: "Erro interno no servidor ao editar o aviso." });
        }
    }
};
