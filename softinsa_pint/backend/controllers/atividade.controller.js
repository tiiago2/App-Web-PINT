const {
  Utilizador,
  Badges,
  RegistoBadges,
  Submissoes,
  Logs,
  PoliticasRGPD
} = require("../models");
const { Op } = require("sequelize");

exports.getAtividade = async (req, res) => {
  try {
    // Buscar todos os dados em paralelo usando Promise.all
    const [receivedData, rejectedData, updatedData, policyData] = await Promise.all([
      // 1. Badges recebidos/obtidos
      RegistoBadges.findAll({
        include: [
          { model: Utilizador, attributes: ["nome_user"] },
          { model: Badges, attributes: ["nome_badge"] }
        ],
        attributes: ["id_registo", "data_obtencao"]
      }),

      // 2. Submissões rejeitadas
      Submissoes.findAll({
        where: {
          status: {
            [Op.in]: ["Rejeitada", "Rejeitado"]
          }
        },
        include: [
          { model: Utilizador, attributes: ["nome_user"] },
          { model: Badges, attributes: ["nome_badge"] }
        ],
        attributes: ["id_submissao", "data_submissao"]
      }),

      // 3. Atualizações de Badges via Logs (tabela = 'BADGES' e tipo = 2)
      Logs.findAll({
        where: {
          tabela: "BADGES",
          tipo: 2
        },
        include: [
          { model: Badges, as: "badge", attributes: ["nome_badge"] }
        ],
        attributes: ["id_log", "data_log"]
      }),

      // 4. Atualizações de políticas RGPD
      PoliticasRGPD.findAll({
        include: [
          { model: Utilizador, attributes: ["nome_user"] }
        ],
        attributes: ["id_politica", "data_alteracao"]
      })
    ]);

    // Mapear e unificar os resultados num formato único de Atividade
    const activitiesList = [];

    // 1. Mapear Recebidos
    receivedData.forEach((item) => {
      activitiesList.push({
        type: "received",
        id: `r-${item.id_registo}`,
        user: item.Utilizador ? item.Utilizador.nome_user : "Utilizador",
        item: item.Badge ? item.Badge.nome_badge : "Badge",
        timestamp: item.data_obtencao
      });
    });

    // 2. Mapear Rejeitados
    rejectedData.forEach((item) => {
      activitiesList.push({
        type: "rejected",
        id: `s-${item.id_submissao}`,
        user: item.Utilizador ? item.Utilizador.nome_user : "Utilizador",
        item: item.Badge ? item.Badge.nome_badge : "Badge",
        timestamp: item.data_submissao
      });
    });

    // 3. Mapear Atualizados
    updatedData.forEach((item) => {
      activitiesList.push({
        type: "updated",
        id: `l-${item.id_log}`,
        user: "Sistema",
        item: item.badge ? item.badge.nome_badge : "Badge",
        timestamp: item.data_log
      });
    });

    // 4. Mapear Políticas
    policyData.forEach((item) => {
      activitiesList.push({
        type: "policy",
        id: `p-${item.id_politica}`,
        user: item.Utilizador ? item.Utilizador.nome_user : "Utilizador",
        item: "Políticas RGPD",
        timestamp: item.data_alteracao
      });
    });

    // Ordenar por data decrescente (mais recente primeiro)
    activitiesList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limitar aos 50 resultados mais recentes
    const limitedActivities = activitiesList.slice(0, 50);

    res.json(limitedActivities);
  } catch (err) {
    console.error("Erro no AtividadeController:", err.message);
    res.status(500).json({ error: "Erro interno ao consultar atividades via Sequelize." });
  }
};
