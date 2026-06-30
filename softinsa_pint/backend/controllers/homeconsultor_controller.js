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

// ── Helpers de data ─────────────────────────────────────────────
function inicioAno() {
  const agora = new Date();
  return new Date(agora.getFullYear(), 0, 1);
}

function inicioMes() {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), 1);
}

function inicioSemana() {
  const agora = new Date();
  const diaSemana = agora.getDay() || 7;
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - diaSemana + 1);
}

module.exports = {
  // 1. Badges em progresso do consultor logado
  async getBadgesProgresso(req, res) {
    try {
      const id_utilizador = req.utilizadorLogado.id_utilizador;

      const submissoes = await Submissoes.findAll({
        where: {
          id_utilizador,
          status: {
            [Op.notIn]: ["Aceite", "Concluído"]
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
          progresso
        });
      }

      return res.status(200).json(badgesProgresso);
    } catch (error) {
      console.error("Erro ao buscar badges em progresso:", error);
      return res.status(500).json({ error: "Erro ao buscar badges em progresso." });
    }
  },

  // 2. Objetivos propostos do consultor logado
  async getObjetivos(req, res) {
    try {
      const id_utilizador = req.utilizadorLogado.id_utilizador;

      const objetivos = await Objetivos.findAll({
        where: {
          id_utilizador,
          deleted_objetivo: false
        },
        include: [
          {
            model: Badges,
            attributes: ["id_badge", "nome_badge", "imagem"]
          }
        ],
        order: [["data_final", "ASC"]]
      });

      const objetivosFormatados = [];

      for (const obj of objetivos) {
        const badge = obj.Badge;
        if (!badge) continue;

        let progresso = 0;

        if (obj.data_conclusao) {
          progresso = 100;
        } else {
          const submissao = await Submissoes.findOne({
            where: {
              id_utilizador,
              id_badge: badge.id_badge,
              status: {
                [Op.notIn]: ["Aceite", "Concluído"]
              }
            }
          });

          if (submissao) {
            const totalRequisitos = await RequisitosBadge.count({
              where: { id_badge: badge.id_badge }
            });

            const documentosSubmetidos = await Documentos.count({
              where: {
                id_submissao: submissao.id_submissao,
                deleted_file: false
              }
            });

            progresso = totalRequisitos > 0
              ? Math.round((documentosSubmetidos / totalRequisitos) * 100)
              : 0;
          }
        }

        objetivosFormatados.push({
          id: obj.id_objetivo,
          titulo: badge.nome_badge,
          data: obj.data_final,
          progresso,
          imagem: badge.imagem
        });
      }

      return res.status(200).json(objetivosFormatados);
    } catch (error) {
      console.error("Erro ao buscar objetivos:", error);
      return res.status(500).json({ error: "Erro ao buscar objetivos." });
    }
  },

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
      const consultores = await Consultor.findAll({
        where: { ativo: true },
        include: [
          {
            model: Utilizador,
            attributes: ["id_utilizador", "nome_user", "imagem_perfil"]
          },
          {
            model: Area,
            attributes: ["nome_area"],
            include: [
              {
                model: ServiceLine,
                attributes: ["nome_service_line"]
              }
            ]
          }
        ]
      });

      const inicioAnoDate = inicioAno();
      const inicioMesDate = inicioMes();
      const inicioSemanaDate = inicioSemana();

      const ranking = [];

      for (const c of consultores) {
        const user = c.Utilizador;
        const area = c.Area;

        const registos = await RegistoBadges.findAll({
          where: { id_utilizador: c.id_utilizador },
          include: [
            {
              model: Badges,
              attributes: ["pontos_badge"]
            }
          ]
        });

        let pontosSemana = 0;
        let pontosMes = 0;
        let pontosAno = 0;

        for (const r of registos) {
          const data = new Date(r.data_obtencao);
          const pontos = r.Badge ? r.Badge.pontos_badge : 0;

          if (data >= inicioAnoDate) pontosAno += pontos;
          if (data >= inicioMesDate) pontosMes += pontos;
          if (data >= inicioSemanaDate) pontosSemana += pontos;
        }

        ranking.push({
          id: c.id_utilizador,
          nome: user ? user.nome_user : c.nome_user,
          area: area ? area.nome_area : "",
          service_line: area && area.ServiceLine ? area.ServiceLine.nome_service_line : "",
          funcao: "consultor",
          pontos_semana: pontosSemana,
          pontos_mes: pontosMes,
          pontos_ano: pontosAno,
          pontos_sempre: c.pontos_totais
        });
      }

      return res.status(200).json(ranking);
    } catch (error) {
      console.error("Erro ao buscar ranking:", error);
      return res.status(500).json({ error: "Erro ao buscar ranking." });
    }
  }
};
