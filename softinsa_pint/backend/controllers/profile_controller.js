const { sequelize, Utilizador, Consultor, Assinatura, RegistoBadges, Badges, BadgesAssinatura, Area, Role } = require('../models');
const jwt = require('jsonwebtoken');

module.exports = {
    async getUserLogin(req, res) {
        try {
            // 1. Receber os parâmetros
            const cargo = req.query.cargo;
            const id = req.query.id || req.utilizadorLogado.id_utilizador;

            // 2. Criar o objeto Base Normalizado
            const utilizadorFinal = {
                id: Number(id),
                nome: null,
                email: null,
                telefone: null,
                pontos: 0,
                cargo: cargo || null,
                foto: null,
                area: null,
                assinaturas_ids: [], // Passou a plural e a vetor (array) para guardar os IDs
                badges: []
            };

            // 3. Procurar Utilizador (Primeiro no Consultor)
            let user = await Consultor.findOne({
                where: { id_utilizador: id },
                attributes: ['nome_user', 'email', 'telefone', 'pontos_totais', 'imagem_perfil', 'id_area'],
                raw: true
            });

            let areaName = null;
            if (user && user.id_area) {
                const areaRecord = await Area.findByPk(user.id_area, {
                    attributes: ['nome_area'],
                    raw: true
                });
                if (areaRecord) {
                    areaName = areaRecord.nome_area;
                }
            }

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
            utilizadorFinal.area = areaName;

            if (user.pontos_totais !== undefined) {
                utilizadorFinal.pontos = user.pontos_totais;
            }

            // --- ASSINATURAS ---
            // 6. Consultar a Assinatura do utilizador
            const assinaturaUser = await Assinatura.findOne({
                where: { id_proprietario: id },
                attributes: ['id_assinatura'],
                raw: true
            });

            // Se tiver assinatura, vamos buscar os badges que lá estão associados
            if (assinaturaUser) {
                const badgesDaAssinatura = await BadgesAssinatura.findAll({
                    where: { id_assinatura: assinaturaUser.id_assinatura },
                    attributes: ['id_badge'],
                    raw: true
                });

                if (badgesDaAssinatura && badgesDaAssinatura.length > 0) {
                    // Mapear para devolver um array apenas com os IDs dos badges (ex: [14, 25])
                    utilizadorFinal.assinaturas_ids = badgesDaAssinatura.map(ba => ba.id_badge);
                }
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

        const { nome, email, telefone, badges } = req.body;
        const id_utilizador = req.utilizadorLogado.id_utilizador;

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
    },
    async getPublicProfile(req, res) {
        try {
            const id = req.params.id;

            if (!id || !/^\d+$/.test(id)) {
                return res.status(400).json({ error: "Identificador de utilizador inválido." });
            }

            const utilizadorFinal = {
                id: Number(id),
                nome: null,
                email: null,
                telefone: null,
                pontos: 0,
                cargo: null,
                foto: null,
                area: null,
                assinaturas_ids: [],
                badges: []
            };

            // 1. Procurar Utilizador (Primeiro no Consultor)
            let user = await Consultor.findOne({
                where: { id_utilizador: id },
                attributes: ['nome_user', 'email', 'telefone', 'pontos_totais', 'imagem_perfil', 'id_area'],
                raw: true
            });

            let areaName = null;
            if (user && user.id_area) {
                const areaRecord = await Area.findByPk(user.id_area, {
                    attributes: ['nome_area'],
                    raw: true
                });
                if (areaRecord) {
                    areaName = areaRecord.nome_area;
                }
            }

            // 2. Se não encontrar, procurar no Utilizador Geral
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

            // Aceder aos papéis associados para obter o cargo/role principal do utilizador
            const utilizadorBD = await Utilizador.findOne({
                where: { id_utilizador: id },
                include: [{
                    model: Role,
                    attributes: ['nome_role'],
                    through: { attributes: [] }
                }]
            });

            const cargo = (utilizadorBD && utilizadorBD.Roles && utilizadorBD.Roles.length > 0) 
                ? utilizadorBD.Roles[0].nome_role 
                : null;

            utilizadorFinal.nome = user.nome_user;
            utilizadorFinal.email = user.email;
            utilizadorFinal.telefone = user.telefone;
            utilizadorFinal.foto = user.imagem_perfil;
            utilizadorFinal.area = areaName;
            utilizadorFinal.cargo = cargo;

            if (user.pontos_totais !== undefined) {
                utilizadorFinal.pontos = user.pontos_totais;
            }

            // --- ASSINATURAS ---
            const assinaturaUser = await Assinatura.findOne({
                where: { id_proprietario: id },
                attributes: ['id_assinatura'],
                raw: true
            });

            if (assinaturaUser) {
                const badgesDaAssinatura = await BadgesAssinatura.findAll({
                    where: { id_assinatura: assinaturaUser.id_assinatura },
                    attributes: ['id_badge'],
                    raw: true
                });

                if (badgesDaAssinatura && badgesDaAssinatura.length > 0) {
                    utilizadorFinal.assinaturas_ids = badgesDaAssinatura.map(ba => ba.id_badge);
                }
            }

            // --- BADGES ---
            const registosBadges = await RegistoBadges.findAll({
                where: { id_utilizador: id },
                include: [{
                    model: Badges,
                    attributes: ['id_badge', 'nome_badge', 'imagem', 'validade']
                }]
            });

            const dataAtual = new Date();
            const badgesValidos = [];

            for (const registo of registosBadges) {
                const dataObtencao = new Date(registo.data_obtencao);
                const badgeInfo = registo.Badge;

                if (!badgeInfo) continue;

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
                        imagem: badgeInfo.imagem,
                        data_obtencao: registo.data_obtencao
                    });
                }
            }

            utilizadorFinal.badges = badgesValidos;

            return res.status(200).json(utilizadorFinal);

        } catch (error) {
            console.error("Erro fatal no getPublicProfile:", error);
            return res.status(500).json({ error: "Erro interno no servidor ao construir o perfil público." });
        }
    }
}