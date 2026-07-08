const {
  Utilizador,
  Consultor,
  Badges,
  Area,
  ServiceLine,
  Submissoes,
  RegistoBadges,
  Objetivos,
  RequisitosBadge,
  Documentos,
  sequelize
} = require("../models");

const { Op } = require("sequelize");
const { calcularRanking } = require("../helpers/rankingHelper");
const ObjetivosController = require("./objetivos_controller");

module.exports = {
  // 1. Badges em progresso do consultor logado
  async getBadgesProgresso(req, res) {
    try {
      const id_utilizador = req.utilizadorLogado.id_utilizador;

      const submissoes = await Submissoes.findAll({
        where: {
          id_utilizador,
          status: {
            [Op.in]: ['em_progresso', 'pendente', 'aceite talent']
          }
        },
        include: [
          {
            model: Badges,
            attributes: ["id_badge", "nome_badge", "imagem"],
            where: { deleted_badge: false }
          }
        ],
        order: [["data_submissao", "DESC"]]
      });

      const badgesProgresso = [];

      for (const sub of submissoes) {
        const badge = sub.Badge;
        if (!badge) continue;

        const totalRequisitos = await RequisitosBadge.count({
          where: { id_badge: badge.id_badge }
        });

        const documentosSubmetidos = await Documentos.count({
          where: {
            id_submissao: sub.id_submissao,
            deleted_file: false
          }
        });

        const progresso = totalRequisitos > 0
          ? Math.round((documentosSubmetidos / totalRequisitos) * 100)
          : 0;

        badgesProgresso.push({
          id: sub.id_submissao,
          id_badge: badge.id_badge,
          titulo: badge.nome_badge,
          imagem: badge.imagem,
          progresso,
          status: sub.status
        });
      }

      return res.status(200).json(badgesProgresso);
    } catch (error) {
      console.error("Erro ao buscar badges em progresso:", error);
      return res.status(500).json({ error: "Erro ao buscar badges em progresso." });
    }
  },

  // 2. Delegar operações de objetivos para o controlador dedicado de Objetivos
  getObjetivos: ObjetivosController.getObjetivos,
  criarObjetivo: ObjetivosController.criarObjetivo,

  // 3. Progresso geral agrupado por Service Line
  async getProgresso(req, res) {
    try {
      const id_utilizador = req.utilizadorLogado.id_utilizador;

      const serviceLines = await ServiceLine.findAll({
        where: { deleted_service: false },
        attributes: ["id_service_line", "nome_service_line"]
      });

      const progressoItems = [];

      for (const sl of serviceLines) {
        const areas = await Area.findAll({
          where: { id_service_line: sl.id_service_line, deleted_area: false },
          attributes: ["id_area"]
        });

        const idsAreas = areas.map(a => a.id_area);

        const totalBadges = await Badges.count({
          where: {
            id_area: { [Op.in]: idsAreas },
            deleted_badge: false
          }
        });

        const badgesConcluidos = await RegistoBadges.count({
          where: { id_utilizador },
          include: [
            {
              model: Badges,
              where: {
                id_area: { [Op.in]: idsAreas },
                deleted_badge: false
              }
            }
          ]
        });

        const pct = totalBadges > 0
          ? Math.round((badgesConcluidos / totalBadges) * 100)
          : 0;

        progressoItems.push({
          titulo: sl.nome_service_line,
          concluidos: badgesConcluidos,
          total: totalBadges,
          pct
        });
      }

      return res.status(200).json(progressoItems);
    } catch (error) {
      console.error("Erro ao buscar progresso:", error);
      return res.status(500).json({ error: "Erro ao buscar progresso." });
    }
  },

  // 4. Classificação geral com pontos por período
  async getRanking(req, res) {
    try {
      const ranking = await calcularRanking();
      return res.status(200).json(ranking);
    } catch (error) {
      console.error("Erro ao buscar ranking:", error);
      return res.status(500).json({ error: "Erro ao buscar ranking." });
    }
  }
};