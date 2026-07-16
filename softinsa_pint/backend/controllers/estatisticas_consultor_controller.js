const {
  Submissoes,
  RegistoBadges,
  Badges,
  Area,
  Objetivos,
  Nivel,
  Permissoes
} = require("../models");

const { Op, Sequelize } = require("sequelize");
const { calcularRanking } = require("../helpers/rankingHelper");

// ── Helpers de data ─────────────────────────────────────────────
function inicioMes() {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), 1);
}

function inicioSemana() {
  const agora = new Date();
  const diaSemana = agora.getDay() || 7;
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - diaSemana + 1);
}

// ── Helpers de formato ───────────────────────────────────────────
const NOMES_MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

module.exports = {
  // 1. KPIs da página de Estatísticas do consultor logado
  async getEstatisticasKpi(req, res) {
    try {
      const id_utilizador = req.utilizadorLogado.id_utilizador;

      // ── Total de badges conquistados ──
      const total_badges = await RegistoBadges.count({
        where: { id_utilizador }
      });

      // ── Objetivos ativos (não concluídos e não eliminados) ──
      const objetivos_ativos = await Objetivos.count({
        where: {
          id_utilizador,
          deleted_objetivo: false,
          data_conclusao: null
        }
      });

      // ── Taxa de aprovação (desde sempre) ──
      // Consideram-se apenas candidaturas fechadas (aceites ou rejeitadas).
      // Candidaturas pendentes/em análise são ignoradas.
      const STATUS_ACEITES = ["aceite", "concluído", "concluido", "aprovado", "fechado"];
      const STATUS_REJEITADOS = ["recusada", "rejeitada", "rejeitado"];

      const submissoesAceites = await Submissoes.count({
        where: {
          id_utilizador,
          status: Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('status')),
            { [Op.in]: STATUS_ACEITES }
          )
        }
      });

      const submissoesRejeitadas = await Submissoes.count({
        where: {
          id_utilizador,
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

      // ── Lugar no ranking por pontos do ano ──
      const ranking = await calcularRanking();
      ranking.sort((a, b) => b.pontos_ano - a.pontos_ano);

      const posicao = ranking.findIndex(r => r.id === id_utilizador);
      const lugar_atual = posicao >= 0 ? posicao + 1 : '-';

      return res.status(200).json({
        total_badges,
        objetivos_ativos,
        taxa_aprovacao: `${taxa}%`,
        lugar_atual
      });
    } catch (error) {
      console.error("Erro ao buscar KPIs de estatísticas:", error);
      return res.status(500).json({ error: "Erro ao buscar KPIs." });
    }
  },

  // 2. Evolução de pontos por período
  //    Períodos: semana | mes | semestre | ano | sempre
  async getEstatisticasEvolucao(req, res) {
    try {
      const id_utilizador = req.utilizadorLogado.id_utilizador;
      const periodo = (req.params.periodo || "mes").toLowerCase();

      // Busca todos os registos do user com pontos associados
      const registos = await RegistoBadges.findAll({
        where: { id_utilizador },
        include: [{ model: Badges, attributes: ["pontos_badge"] }],
        order: [["data_obtencao", "ASC"]]
      });

      const entradas = registos.map(r => ({
        data: new Date(r.data_obtencao),
        pontos: r.Badge ? r.Badge.pontos_badge : 0
      }));

      let dados = [];

      if (periodo === "semana") {
        const hoje = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(hoje.getDate() - i);
          const total = entradas
            .filter(e => e.data.toDateString() === d.toDateString())
            .reduce((s, e) => s + e.pontos, 0);
          dados.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, pontos: total });
        }
      } else if (periodo === "mes") {
        const ano = new Date().getFullYear();
        const mes = new Date().getMonth();
        const primeiroDia = new Date(ano, mes, 1);
        const ultimoDia = new Date(ano, mes + 1, 0);

        let diaAtual = new Date(primeiroDia);
        while (diaAtual <= ultimoDia) {
          const inicioSemanaLoop = new Date(diaAtual);
          let diasAteDomingo = diaAtual.getDay() === 0 ? 0 : 7 - diaAtual.getDay();
          const fimSemana = new Date(diaAtual);
          fimSemana.setDate(diaAtual.getDate() + diasAteDomingo);
          const fimReal = fimSemana > ultimoDia ? new Date(ultimoDia) : fimSemana;

          const total = entradas
            .filter(e => e.data >= inicioSemanaLoop && e.data <= new Date(fimReal.getTime() + 86400000 - 1))
            .reduce((s, e) => s + e.pontos, 0);

          dados.push({
            label: `${inicioSemanaLoop.getDate()} a ${fimReal.getDate()}/${mes + 1}`,
            pontos: total
          });

          diaAtual = new Date(fimReal);
          diaAtual.setDate(diaAtual.getDate() + 1);
        }
      } else if (periodo === "trimestre") {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mesAtual = hoje.getMonth();
        const inicioTrimestre = Math.floor(mesAtual / 3) * 3;

        for (let i = inicioTrimestre; i <= mesAtual; i++) {
          const total = entradas
            .filter(e => e.data.getFullYear() === ano && e.data.getMonth() === i)
            .reduce((s, e) => s + e.pontos, 0);
          dados.push({ label: NOMES_MESES[i], pontos: total });
        }
      } else if (periodo === "ano") {
        const ano = new Date().getFullYear();
        for (let i = 0; i < 12; i++) {
          const total = entradas
            .filter(e => e.data.getFullYear() === ano && e.data.getMonth() === i)
            .reduce((s, e) => s + e.pontos, 0);
          dados.push({ label: NOMES_MESES[i], pontos: total });
        }
      } else {
        // padrão: mês
        const ano = new Date().getFullYear();
        const mes = new Date().getMonth();
        const primeiroDia = new Date(ano, mes, 1);
        const ultimoDia = new Date(ano, mes + 1, 0);

        let diaAtual = new Date(primeiroDia);
        while (diaAtual <= ultimoDia) {
          const inicioSemanaLoop = new Date(diaAtual);
          let diasAteDomingo = diaAtual.getDay() === 0 ? 0 : 7 - diaAtual.getDay();
          const fimSemana = new Date(diaAtual);
          fimSemana.setDate(diaAtual.getDate() + diasAteDomingo);
          const fimReal = fimSemana > ultimoDia ? new Date(ultimoDia) : fimSemana;

          const total = entradas
            .filter(e => e.data >= inicioSemanaLoop && e.data <= new Date(fimReal.getTime() + 86400000 - 1))
            .reduce((s, e) => s + e.pontos, 0);

          dados.push({
            label: `${inicioSemanaLoop.getDate()} a ${fimReal.getDate()}/${mes + 1}`,
            pontos: total
          });

          diaAtual = new Date(fimReal);
          diaAtual.setDate(diaAtual.getDate() + 1);
        }
      }

      return res.status(200).json(dados);
    } catch (error) {
      console.error("Erro ao buscar evolução de pontos:", error);
      return res.status(500).json({ error: "Erro ao buscar evolução de pontos." });
    }
  },

  // 3. Badges conquistados no mês atual, agrupados por área
  async getEstatisticasConquistadosMes(req, res) {
    try {
      const id_utilizador = req.utilizadorLogado.id_utilizador;
      const inicioMesDate = inicioMes();

      const registos = await RegistoBadges.findAll({
        where: {
          id_utilizador,
          data_obtencao: { [Op.gte]: inicioMesDate }
        },
        include: [
          {
            model: Badges,
            attributes: ["id_area"],
            include: [{ model: Area, attributes: ["id_area", "nome_area"] }]
          }
        ]
      });

      // Agrupa por área
      const porArea = {};
      for (const r of registos) {
        const area = r.Badge && r.Badge.Area;
        const id_area = area ? area.id_area : 0;
        const nome = area ? area.nome_area : "Sem área";
        if (!porArea[id_area]) {
          porArea[id_area] = { id_area, nome_area: nome, total_badges: 0 };
        }
        porArea[id_area].total_badges++;
      }

      const dados = Object.values(porArea).map(e => ({
        ID_Area: e.id_area,
        Nome_Area: e.nome_area,
        total_badges: e.total_badges
      }));

      return res.status(200).json(dados);
    } catch (error) {
      console.error("Erro ao buscar conquistados no mês:", error);
      return res.status(500).json({ error: "Erro ao buscar conquistados no mês." });
    }
  },

  // 4. Badges conquistados pelo user, agrupados por nível
  // Garante que todos os níveis existentes no sistema são devolvidos,
  // mesmo que o consultor ainda não tenha conquistado badges nesse nível.
  async getEstatisticasBadgesNivel(req, res) {
    try {
      const id_utilizador = req.utilizadorLogado.id_utilizador;

      // 1. Todos os níveis definidos no sistema
      const niveis = await Nivel.findAll({
        attributes: ["id_nivel", "nome_nivel"],
        order: [["id_nivel", "ASC"]]
      });

      // 2. Registos de badges conquistados pelo consultor
      const registos = await RegistoBadges.findAll({
        where: { id_utilizador },
        include: [
          {
            model: Badges,
            attributes: ["id_nivel"],
            include: [{ model: Nivel, attributes: ["id_nivel", "nome_nivel"] }]
          }
        ]
      });

      // 3. Inicializa um mapa com todos os níveis existentes a 0 badges
      const porNivel = {};
      for (const n of niveis) {
        porNivel[n.id_nivel] = {
          id_nivel: n.id_nivel,
          nome_nivel: n.nome_nivel,
          total_badges: 0
        };
      }

      // 4. Acumula badges conquistados por nível
      for (const r of registos) {
        const nivel = r.Badge && r.Badge.Nivel;
        const id_nivel = nivel ? nivel.id_nivel : 0;
        if (porNivel[id_nivel]) {
          porNivel[id_nivel].total_badges++;
        } else {
          // Nível removido ou "Sem nível" — cria entrada temporária para manter compatibilidade
          if (!porNivel[id_nivel]) {
            porNivel[id_nivel] = {
              id_nivel,
              nome_nivel: nivel ? nivel.nome_nivel : "Sem nível",
              total_badges: 0
            };
          }
          porNivel[id_nivel].total_badges++;
        }
      }

      const total = Object.values(porNivel).reduce((s, e) => s + e.total_badges, 0);

      const dados = Object.values(porNivel).map(e => ({
        ID_Nivel: e.id_nivel,
        Nome_Nivel: e.nome_nivel,
        total_badges: e.total_badges,
        valor: total > 0 ? Math.round((e.total_badges / total) * 100) : 0
      }));

      return res.status(200).json(dados);
    } catch (error) {
      console.error("Erro ao buscar badges por nível:", error);
      return res.status(500).json({ error: "Erro ao buscar badges por nível." });
    }
  },

  async getPermissao(req, res) {
    try {
      const permissao = await Permissoes.findOne({
        where: { descricao_permissao: "Download de PDFs" },
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