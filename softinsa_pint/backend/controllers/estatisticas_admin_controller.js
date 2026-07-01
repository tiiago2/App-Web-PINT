const {
  Consultor,
  Area,
  ServiceLine,
  LearningPath,
  Badges,
  Nivel,
  RegistoBadges,
  Submissoes
} = require("../models");

const { Op } = require("sequelize");
const { calcularRanking } = require("../helpers/rankingHelper");

// ── Helpers de data ─────────────────────────────────────────────
function inicioMes() {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), 1);
}

function fimMes() {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);
}

// ── Mapeamento dos nomes dos níveis para as chaves de tradução ──
const CHAVES_NIVEL = {
  'Júnior': 'junior',
  'Intermédio': 'intermedio',
  'Sénior': 'senior',
  'Especialista': 'especialista',
  'Especialista técnico': 'especialista_tec',
};

module.exports = {
  // 1. KPIs globais da plataforma
  async getKpis(req, res) {
    try {
      // ── Total de badges atribuídos ──
      const total_badges = await RegistoBadges.count();

      // ── Total de utilizadores (consultores ativos) ──
      const total_utilizadores = await Consultor.count({
        where: { ativo: true }
      });

      // ── Badges por utilizador ──
      const badges_por_utilizador = total_utilizadores > 0
        ? (total_badges / total_utilizadores).toFixed(1).replace('.', ',')
        : '0,0';

      // ── Taxa de aprovação global ──
      const totalSubmissoes = await Submissoes.count();

      const submissoesAceites = await Submissoes.count({
        where: {
          status: { [Op.in]: ["aceite", "Concluído", "Concluido", "Aprovado", "Fechado"] }
        }
      });

      const taxa = totalSubmissoes > 0
        ? Math.round((submissoesAceites / totalSubmissoes) * 100)
        : 0;

      return res.status(200).json({
        badges_por_utilizador,
        total_badges,
        total_utilizadores,
        taxa_aprovacao: `${taxa}%`
      });
    } catch (error) {
      console.error("Erro ao buscar KPIs do administrador:", error);
      return res.status(500).json({ error: "Erro ao buscar KPIs do administrador." });
    }
  },

  // 2. Badges atribuídos globalmente, agrupados por nível
  async getBadgesPorNivel(req, res) {
    try {
      const registos = await RegistoBadges.findAll({
        include: [
          {
            model: Badges,
            attributes: ["id_nivel"],
            include: [{ model: Nivel, attributes: ["nome_nivel"] }]
          }
        ]
      });

      const porNivel = {};
      let total = 0;

      for (const r of registos) {
        const nivel = r.Badge && r.Badge.Nivel;
        const nome = nivel ? nivel.nome_nivel : "Sem nível";
        porNivel[nome] = (porNivel[nome] || 0) + 1;
        total += 1;
      }

      // Garante que todos os níveis existentes aparecem no gráfico
      const todosNiveis = await Nivel.findAll({
        attributes: ["nome_nivel"],
        order: [["id_nivel", "ASC"]]
      });

      const dados = todosNiveis.map(n => {
        const nome = n.nome_nivel;
        return {
          Nome_Nivel: CHAVES_NIVEL[nome] || nome,
          valor: total > 0 ? Math.round((porNivel[nome] || 0) / total * 100) : 0
        };
      });

      return res.status(200).json(dados);
    } catch (error) {
      console.error("Erro ao buscar badges por nível do administrador:", error);
      return res.status(500).json({ error: "Erro ao buscar badges por nível do administrador." });
    }
  },

  // 3. Badges atribuídos no mês atual, agrupados por área
  async getAtribuidosMes(req, res) {
    try {
      const inicioMesDate = inicioMes();
      const fimMesDate = fimMes();

      const registos = await RegistoBadges.findAll({
        where: {
          data_obtencao: { [Op.between]: [inicioMesDate, fimMesDate] }
        },
        include: [
          {
            model: Badges,
            attributes: ["id_area"],
            include: [{ model: Area, attributes: ["id_area", "nome_area"] }]
          }
        ]
      });

      const porArea = {};

      for (const r of registos) {
        const area = r.Badge && r.Badge.Area;
        const id_area = area ? area.id_area : 0;
        const nome = area ? area.nome_area : "Sem área";

        if (!porArea[id_area]) {
          porArea[id_area] = { id_area, nome_area: nome, total_badges: 0 };
        }
        porArea[id_area].total_badges += 1;
      }

      const dados = Object.values(porArea).map(e => ({
        Nome_Area: e.nome_area,
        total_badges: e.total_badges
      }));

      return res.status(200).json(dados);
    } catch (error) {
      console.error("Erro ao buscar atribuídos por área do administrador:", error);
      return res.status(500).json({ error: "Erro ao buscar atribuídos por área do administrador." });
    }
  },

  // 4. Learning paths com contagem de badges associados
  async getLearningPaths(req, res) {
    try {
      const learningPaths = await LearningPath.findAll({
        where: { deleted_path: false },
        attributes: ["id_learning_path", "nome_learning_path"],
        order: [["id_learning_path", "ASC"]]
      });

      const dados = [];

      for (const lp of learningPaths) {
        // Busca as service lines desta learning path
        const serviceLines = await ServiceLine.findAll({
          where: { id_learning_path: lp.id_learning_path, deleted_service: false },
          attributes: ["id_service_line"]
        });

        const idsServiceLines = serviceLines.map(sl => sl.id_service_line);

        // Busca as áreas dessas service lines
        const areas = await Area.findAll({
          where: {
            id_service_line: { [Op.in]: idsServiceLines },
            deleted_area: false
          },
          attributes: ["id_area"]
        });

        const idsAreas = areas.map(a => a.id_area);

        // Conta badges ativos dessas áreas
        const total_badges = idsAreas.length > 0
          ? await Badges.count({
              where: {
                id_area: { [Op.in]: idsAreas },
                deleted_badge: false
              }
            })
          : 0;

        dados.push({
          nome: lp.nome_learning_path,
          total_badges
        });
      }

      return res.status(200).json(dados);
    } catch (error) {
      console.error("Erro ao buscar learning paths do administrador:", error);
      return res.status(500).json({ error: "Erro ao buscar learning paths do administrador." });
    }
  },

  // 5. Ranking global de consultores
  async getRanking(req, res) {
    try {
      const ranking = await calcularRanking();
      return res.status(200).json(ranking);
    } catch (error) {
      console.error("Erro ao buscar ranking do administrador:", error);
      return res.status(500).json({ error: "Erro ao buscar ranking do administrador." });
    }
  }
};
