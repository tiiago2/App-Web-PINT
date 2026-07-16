const {
  ServiceLine,
  Consultor,
  Area,
  Badges,
  Nivel,
  RegistoBadges,
  Submissoes,
  Permissoes
} = require("../models");

const { Op, Sequelize } = require("sequelize");
const { calcularRanking } = require("../helpers/rankingHelper");

const NOMES_MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const NOMES_DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

function getMesAbrev(data) {
  return NOMES_MESES[data.getMonth()];
}

function formatarDataCurta(data) {
  return NOMES_DIAS[data.getDay()];
}

// ── Mapeamento dos nomes dos níveis para as chaves de tradução ──
const CHAVES_NIVEL = {
  'Júnior': 'junior',
  'Intermédio': 'intermedio',
  'Sénior': 'senior',
  'Especialista': 'especialista',
  'Especialista técnico': 'especialista_tec',
};

// ── Busca a service line do líder logado ────────────────────────
async function getServiceLineDoLider(id_utilizador) {
  return await ServiceLine.findOne({
    where: {
      id_lider: id_utilizador,
      deleted_service: false
    }
  });
}

// ── Busca os IDs dos consultores ativos da service line ─────────
async function getIdsConsultoresServiceLine(id_service_line) {
  const consultores = await Consultor.findAll({
    where: { ativo: true },
    include: [
      {
        model: Area,
        where: { id_service_line, deleted_area: false },
        attributes: []
      }
    ],
    attributes: ['id_utilizador']
  });

  return consultores.map(c => c.id_utilizador);
}

module.exports = {
  // 1. KPIs da página de Estatísticas do Service Line Leader
  async getKpis(req, res) {
    try {
      const id_utilizador = req.utilizadorLogado.id_utilizador;

      const serviceLine = await getServiceLineDoLider(id_utilizador);
      if (!serviceLine) {
        return res.status(403).json({ error: "Utilizador não é líder de nenhuma service line." });
      }

      const idsConsultores = await getIdsConsultoresServiceLine(serviceLine.id_service_line);

      // ── Total de badges atribuídos na service line ──
      const total_badges = await RegistoBadges.count({
        where: { id_utilizador: { [Op.in]: idsConsultores } }
      });

      // ── Total de utilizadores (consultores ativos) da service line ──
      const total_utilizadores = idsConsultores.length;

      // ── Badges por utilizador ──
      const badges_por_utilizador = total_utilizadores > 0
        ? (total_badges / total_utilizadores).toFixed(1).replace('.', ',')
        : '0,0';

      // ── Taxa de aprovação das candidaturas da service line ──
      // Consideram-se apenas candidaturas fechadas (aceites ou rejeitadas).
      // Candidaturas pendentes/em análise são ignoradas.
      const STATUS_ACEITES = ["aceite", "concluído", "concluido", "aprovado", "fechado"];
      const STATUS_REJEITADOS = ["recusada", "rejeitada", "rejeitado"];

      const submissoesAceites = await Submissoes.count({
        where: {
          id_utilizador: { [Op.in]: idsConsultores },
          status: Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('status')),
            { [Op.in]: STATUS_ACEITES }
          )
        }
      });

      const submissoesRejeitadas = await Submissoes.count({
        where: {
          id_utilizador: { [Op.in]: idsConsultores },
          status: Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('status')),
            { [Op.in]: STATUS_REJEITADOS }
          )
        }
      });

      const submissoesFechadas = submissoesAceites + submissoesRejeitadas;
      const taxa = submissoesFechadas > 0
        ? Math.round((submissoesAceites / submissoesFechadas) * 100)
        : 0;

      return res.status(200).json({
        badges_por_utilizador,
        total_badges,
        total_utilizadores,
        taxa_aprovacao: `${taxa}%`
      });
    } catch (error) {
      console.error("Erro ao buscar KPIs do service line:", error);
      return res.status(500).json({ error: "Erro ao buscar KPIs do service line." });
    }
  },

  // 2. Badges atribuídos na service line, agrupados por nível
  async getBadgesPorNivel(req, res) {
    try {
      const id_utilizador = req.utilizadorLogado.id_utilizador;

      const serviceLine = await getServiceLineDoLider(id_utilizador);
      if (!serviceLine) {
        return res.status(403).json({ error: "Utilizador não é líder de nenhuma service line." });
      }

      const idsConsultores = await getIdsConsultoresServiceLine(serviceLine.id_service_line);

      const registos = await RegistoBadges.findAll({
        where: { id_utilizador: { [Op.in]: idsConsultores } },
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
          valor: total > 0 ? Math.round((porNivel[nome] || 0) / total * 100) : 0,
          total_badges: porNivel[nome] || 0
        };
      });

      return res.status(200).json(dados);
    } catch (error) {
      console.error("Erro ao buscar badges por nível do service line:", error);
      return res.status(500).json({ error: "Erro ao buscar badges por nível do service line." });
    }
  },

  // 3. Badges atribuídos na service line ao longo do tempo
  //    Períodos: semana | mes | trimestre | ano
  async getBadgesAtribuidos(req, res) {
    try {
      const id_utilizador = req.utilizadorLogado.id_utilizador;
      const periodo = (req.params.periodo || "mes").toLowerCase();

      const serviceLine = await getServiceLineDoLider(id_utilizador);
      if (!serviceLine) {
        return res.status(403).json({ error: "Utilizador não é líder de nenhuma service line." });
      }

      const idsConsultores = await getIdsConsultoresServiceLine(serviceLine.id_service_line);

      const registos = await RegistoBadges.findAll({
        where: { id_utilizador: { [Op.in]: idsConsultores } },
        attributes: ["data_obtencao"]
      });

      const entradas = registos.map(r => new Date(r.data_obtencao));
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = hoje.getMonth();
      const dia = hoje.getDate();

      let dados = [];

      if (periodo === "semana") {
        for (let i = 6; i >= 0; i--) {
          const d = new Date(hoje);
          d.setDate(dia - i);
          const total = entradas.filter(e => e.toDateString() === d.toDateString()).length;
          dados.push({
            chave: `dia_${i}`,
            label: formatarDataCurta(d),
            atribuidos: total
          });
        }
      } else if (periodo === "mes") {
        const ultimoDia = new Date(ano, mes + 1, 0);
        const totalDias = ultimoDia.getDate();

        for (let inicio = 1; inicio <= totalDias; inicio += 7) {
          const dataInicio = new Date(ano, mes, inicio);
          const fim = Math.min(inicio + 6, totalDias);
          const dataFim = new Date(ano, mes, fim, 23, 59, 59);
          const total = entradas.filter(e => e >= dataInicio && e <= dataFim).length;

          dados.push({
            chave: `semana_${inicio}`,
            label: `${inicio}-${fim}`,
            atribuidos: total
          });
        }
      } else if (periodo === "trimestre") {
        for (let i = 2; i >= 0; i--) {
          const m = mes - i;
          const dataInicio = new Date(ano, m, 1);
          const dataFim = new Date(ano, m + 1, 0, 23, 59, 59);
          const total = entradas.filter(e => e >= dataInicio && e <= dataFim).length;

          dados.push({
            chave: getMesAbrev(dataInicio),
            label: dataInicio.toLocaleString("pt-PT", { month: "long" }),
            atribuidos: total
          });
        }
      } else if (periodo === "ano") {
        for (let m = 0; m <= mes; m++) {
          const dataInicio = new Date(ano, m, 1);
          const dataFim = new Date(ano, m + 1, 0, 23, 59, 59);
          const total = entradas.filter(e => e >= dataInicio && e <= dataFim).length;

          dados.push({
            chave: getMesAbrev(dataInicio),
            label: dataInicio.toLocaleString("pt-PT", { month: "long" }),
            atribuidos: total
          });
        }
      } else {
        return res.status(400).json({ error: "Período inválido. Use semana, mes, trimestre ou ano." });
      }

      return res.status(200).json(dados);
    } catch (error) {
      console.error("Erro ao buscar badges atribuídos do service line:", error);
      return res.status(500).json({ error: "Erro ao buscar badges atribuídos do service line." });
    }
  },

  // 4. Status das candidaturas da service line
  async getStatusCandidaturas(req, res) {
    try {
      const id_utilizador = req.utilizadorLogado.id_utilizador;

      const serviceLine = await getServiceLineDoLider(id_utilizador);
      if (!serviceLine) {
        return res.status(403).json({ error: "Utilizador não é líder de nenhuma service line." });
      }

      const idsConsultores = await getIdsConsultoresServiceLine(serviceLine.id_service_line);

      const submissoes = await Submissoes.findAll({
        where: { id_utilizador: { [Op.in]: idsConsultores } },
        attributes: ["status"]
      });

      const aceites = ["aceite", "concluído", "concluido", "aprovado", "fechado"];
      const rejeitadas = ["rejeitada", "rejeitado"];

      const dados = [];

      for (const s of submissoes) {
        const status = (s.status || "").toLowerCase();
        let estado;

        if (aceites.includes(status)) estado = "Aceite";
        else if (rejeitadas.includes(status)) estado = "Rejeitada";
        else estado = "Em análise";

        dados.push({ Status: estado });
      }

      return res.status(200).json(dados);
    } catch (error) {
      console.error("Erro ao buscar status das candidaturas do service line:", error);
      return res.status(500).json({ error: "Erro ao buscar status das candidaturas do service line." });
    }
  },

  // 5. Ranking dos consultores da service line
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
      console.error("Erro ao buscar ranking do service line:", error);
      return res.status(500).json({ error: "Erro ao buscar ranking do service line." });
    }
  },

  async getPermissao(req, res) {
    try {
      const permissao = await Permissoes.findOne({
        where: { descricao_permissao: "Gerar Relatórios de Área" },
        attributes: ['toggle']
      });
      if (!permissao) {
        return res.status(404).json({ error: "Permissão não encontrada." });
      }
      return res.status(200).json(permissao);
    } catch (error) {
      console.error("Erro ao buscar permissões:", error);
      return res.status(500).json({ error: "Erro ao buscar permissões." });
    }
  }
};
