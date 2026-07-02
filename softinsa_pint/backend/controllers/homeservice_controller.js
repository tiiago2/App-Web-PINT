const { ServiceLine } = require("../models");
const { calcularRanking } = require("../helpers/rankingHelper");

// ── Busca a service line do líder logado ────────────────────────
async function getServiceLineDoLider(id_utilizador) {
  return await ServiceLine.findOne({
    where: {
      id_lider: id_utilizador,
      deleted_service: false
    }
  });
}

module.exports = {
  // GET /api/homeservice/ranking-geral
  // Devolve a classificação geral de todos os consultores ativos.
  async getRankingGeral(req, res) {
    try {
      const ranking = await calcularRanking();
      return res.status(200).json(ranking);
    } catch (error) {
      console.error("Erro ao buscar ranking geral do service line leader:", error);
      return res.status(500).json({ error: "Erro ao buscar ranking geral." });
    }
  },

  // GET /api/homeservice/ranking-service-line
  // Devolve a classificação dos consultores da service line do líder logado.
  async getRankingServiceLine(req, res) {
    try {
      const id_utilizador = req.utilizadorLogado.id_utilizador;

      const serviceLine = await getServiceLineDoLider(id_utilizador);
      if (!serviceLine) {
        return res.status(403).json({ error: "Utilizador não é líder de nenhuma service line." });
      }

      const ranking = await calcularRanking(serviceLine.id_service_line);
      return res.status(200).json(ranking);
    } catch (error) {
      console.error("Erro ao buscar ranking da service line:", error);
      return res.status(500).json({ error: "Erro ao buscar ranking da service line." });
    }
  }
};
