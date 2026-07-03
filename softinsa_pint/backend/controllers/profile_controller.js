const { sequelize, Utilizador, Consultor, Assinatura, RegistoBadges, Badges, BadgesAssinatura } = require('../models');
const jwt = require('jsonwebtoken');

module.exports = {
    async getUserLogin(req, res) {
        try {
            // 1. Receber os parâmetros
            const { id, cargo } = req.query;

            if (!id) {
                return res.status(400).json({ error: "ID não fornecido no pedido." });
            }

            // 2. Criar o objeto Base Normalizado
            const utilizadorFinal = {
                id: Number(id),
                nome: null,
                email: null,
                telefone: null,
                pontos: 0,
                cargo: cargo || null,
                foto: null,
                assinaturas_ids: [], // Passou a plural e a vetor (array) para guardar os IDs
                badges: []
            };

            // 3. Procurar Utilizador (Primeiro no Consultor)
            let user = await Consultor.findOne({
                where: { id_utilizador: id },
                attributes: ['nome_user', 'email', 'telefone', 'pontos_totais', 'imagem_perfil'],
                raw: true
            });

            // 4. Se não encontrar, procurar no Utilizador Geral
            if (!user) {
                user = await Utilizador.findOne({
                    where: { id_utilizador: id },
                    attributes: ['nome_user', 'email', 'telefone', 'imagem_perfil'],
                    raw: true
                });
            }

            if (!user) {
                return res.status(404).json({ error: "Utilizador não encontrado." });
            }

            // 5. Preencher os dados do user no nosso Objeto Base
            utilizadorFinal.nome = user.nome_user; // Faltava esta linha para guardar o nome!
            utilizadorFinal.email = user.email;
            utilizadorFinal.telefone = user.telefone;
            utilizadorFinal.foto = user.imagem_perfil;

            if (user.pontos_totais !== undefined) {
                utilizadorFinal.pontos = user.pontos_totais;
            }

            // --- ASSINATURAS ---
            // 6. Consultar Assinaturas (findAll devolve um vetor)
            const assinaturas = await Assinatura.findAll({
                where: { id_proprietario: id },
                attributes: ['id_assinatura'],
                raw: true
            });

            // Verificamos se o vetor existe e não está vazio
            if (assinaturas && assinaturas.length > 0) {
                // Mapeamos o vetor de objetos para um vetor simples de números: [1, 2, 3]
                utilizadorFinal.assinaturas_ids = assinaturas.map(ass => ass.id_assinatura);
            }

            // --- BADGES --- 
            // 7. Buscar Registos e os dados originais do Badge
            const registosBadges = await RegistoBadges.findAll({
                where: { id_utilizador: id },
                include: [{
                    model: Badges,
                    attributes: ['id_badge', 'nome_badge', 'imagem', 'validade']
                }]
            });

            // 8. Filtrar e calcular as datas dos Badges
            const dataAtual = new Date();
            const badgesValidos = [];

            for (const registo of registosBadges) {
                const dataObtencao = new Date(registo.data_obtencao);
                const badgeInfo = registo.Badge;

                if (!badgeInfo) continue;

                // Ajustado para ler 'validade' de acordo com o teu 'attributes' no include
                const validadeEmDias = badgeInfo.validade;
                let estaExpirado = false;

                if (validadeEmDias) {
                    const dataExpiracao = new Date(dataObtencao);
                    dataExpiracao.setDate(dataExpiracao.getDate() + validadeEmDias);

                    if (dataAtual > dataExpiracao) {
                        estaExpirado = true;
                    }
                }

                if (!estaExpirado) {
                    badgesValidos.push({
                        id: badgeInfo.id_badge,
                        nome: badgeInfo.nome_badge,
                        imagem: badgeInfo.imagem, // Ajustado para ler 'imagem' em vez de 'icone'
                        data_obtencao: registo.data_obtencao
                    });
                }
            }

            utilizadorFinal.badges = badgesValidos;

            // --- RESPOSTA FINAL ---
            return res.status(200).json(utilizadorFinal);

        } catch (error) {
            console.error("Erro fatal no getUserLogin:", error);
            return res.status(500).json({ error: "Erro interno no servidor ao construir o perfil." });
        }
    },
    async atualizarPerfilCompleto(req, res) {

        const { id_utilizador, nome, email, telefone, badges } = req.body;

        if (!id_utilizador) {
            return res.status(400).json({ error: "ID de utilizador é obrigatório." });
        }

        const t = await sequelize.transaction();

        try {
            await Promise.all([
                Utilizador.update(
                    {
                        nome_user: nome,
                        email: email,
                        telefone: telefone
                    },
                    {
                        where: { id_utilizador: id_utilizador },
                        transaction: t
                    }
                ),
                Consultor.update(
                    {
                        nome_user: nome,
                        email: email,
                        telefone: telefone
                    },
                    {
                        where: { id_utilizador: id_utilizador },
                        transaction: t
                    }
                )
            ]);

            let assinaturaUser = await Assinatura.findOne({
                where: { id_proprietario: id_utilizador },
                transaction: t
            });

            if (!assinaturaUser) {
                assinaturaUser = await Assinatura.create({
                    id_proprietario: id_utilizador,
                    update_assinatura: new Date()
                }, { transaction: t });
            } else {
                await assinaturaUser.update(
                    { update_assinatura: new Date() },
                    { transaction: t }
                );
            }

            await BadgesAssinatura.destroy({
                where: { id_assinatura: assinaturaUser.id_assinatura },
                transaction: t
            });

            if (badges && badges.length > 0) {
                const dadosParaBD = badges.map((item) => ({
                    id_assinatura: assinaturaUser.id_assinatura,
                    id_badge: item.id_badge
                }));

                await BadgesAssinatura.bulkCreate(dadosParaBD, { transaction: t });
            }

            await t.commit();

            return res.status(200).json({
                mensagem: "Perfil e assinatura atualizados com sucesso em todas as tabelas!"
            });

        } catch (error) {
            await t.rollback();
            console.error("Erro ao atualizar o perfil completo:", error);
            return res.status(500).json({ error: "Ocorreu um erro ao guardar o perfil." });
        }
    }
}