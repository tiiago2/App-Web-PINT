const { Utilizador, RegistoBadges, Badges } = require("../models");
const { Op, fn, col, literal } = require("sequelize");
const { calcularRanking } = require("../helpers/rankingHelper");

module.exports = {
  /**
   * GET /api/homeadmin/stats
   * Devolve as 3 estatísticas principais da homepage do Admin:
   *   - totalUtilizadores: utilizadores com ativo = true
   *   - badgesPorUtilizador: badges não expirados / utilizadores ativos
   *   - badgesAtribuidos: total de registos em registo_badges (expirados + ativos)
   */
  async getStats(req, res) {
    try {
      // 1. Total de utilizadores ativos
      const totalUtilizadores = await Utilizador.count({
        where: { ativo: true },
      });

      // 2. Total de badges atribuídos (todos, expirados + ativos)
      const badgesAtribuidos = await RegistoBadges.count();

      // 3. Badges não expirados (data_obtencao + validade_dias > hoje)
      const badgesAtivos = await RegistoBadges.count({
        include: [
          {
            model: Badges,
            attributes: [],
            required: true,
          },
        ],
        where: literal(
          `"RegistoBadges"."data_obtencao" + ("Badge"."validade" || ' days')::interval > NOW()`
        ),
      });

      // 4. Calcular média de badges ativos por utilizador
      const badgesPorUtilizador =
        totalUtilizadores > 0
          ? parseFloat((badgesAtivos / totalUtilizadores).toFixed(1))
          : 0;

      return res.status(200).json({
        totalUtilizadores,
        badgesPorUtilizador,
        badgesAtribuidos,
      });
    } catch (error) {
      console.error("Erro ao obter stats do admin:", error);
      return res.status(500).json({ error: "Erro ao obter estatísticas." });
    }
  },

  /**
   * GET /api/homeadmin/ranking
   * Devolve a classificação geral dos consultores.
   */
  async getRanking(req, res) {
    try {
      const ranking = await calcularRanking();
      return res.status(200).json(ranking);
    } catch (error) {
      console.error("Erro ao buscar ranking do admin:", error);
      return res.status(500).json({ error: "Erro ao buscar ranking." });
    }
  },
};
