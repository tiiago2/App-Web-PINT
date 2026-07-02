const {
  Consultor,
  Badges,
  Area,
  Submissoes,
  RegistoBadges,
  Objetivos,
  Nivel,
  Permissoes
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

// ── Helpers de formato ───────────────────────────────────────────
const NOMES_MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// ── Função auxiliar para calcular pontos do ano de um utilizador ──
async function calcularPontosAno(id_utilizador, inicioAnoDate) {
  const registos = await RegistoBadges.findAll({
    where: {
      id_utilizador,
      data_obtencao: { [Op.gte]: inicioAnoDate }
    },
    include: [{ model: Badges, attributes: ["pontos_badge"] }]
  });
  let pontos = 0;
  for (const r of registos) {
    pontos += r.Badge ? r.Badge.pontos_badge : 0;
  }
  return pontos;
}

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
      const totalSubmissoes = await Submissoes.count({
        where: { id_utilizador }
      });
      const submissoesAceites = await Submissoes.count({
        where: {
          id_utilizador,
          status: { [Op.in]: ["aceite", "Concluído", "Concluido"] }
        }
      });
      const taxa = totalSubmissoes > 0
        ? Math.round((submissoesAceites / totalSubmissoes) * 100)
        : 0;

      // ── Lugar no ranking por pontos do ano ──
      const inicioAnoDate = inicioAno();

      const consultores = await Consultor.findAll({
        where: { ativo: true },
        attributes: ["id_utilizador"]
      });

      // Calcula os pontos do ano de todos os consultores
      const pontosTodos = [];
      for (const c of consultores) {
        const pontosAno = await calcularPontosAno(c.id_utilizador, inicioAnoDate);
        pontosTodos.push({ id: c.id_utilizador, pontos: pontosAno });
      }

      // Pontos do ano do utilizador logado
      const meusPontos = pontosTodos.find(p => p.id === id_utilizador);
      const meusPontosAno = meusPontos ? meusPontos.pontos : 0;

      // Conta quantos têm mais pontos que o user logado
      const lugar_atual = pontosTodos.filter(p => p.pontos > meusPontosAno).length + 1;

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
      const periodo = (req.params.periodo || "semestre").toLowerCase();

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
      } else if (periodo === "ano") {
        const ano = new Date().getFullYear();
        for (let i = 0; i < 12; i++) {
          const total = entradas
            .filter(e => e.data.getFullYear() === ano && e.data.getMonth() === i)
            .reduce((s, e) => s + e.pontos, 0);
          dados.push({ label: NOMES_MESES[i], pontos: total });
        }
      } else if (periodo === "sempre") {
        if (entradas.length === 0) {
          return res.status(200).json([]);
        }
        const primeiraData = entradas[0].data;
        const hoje = new Date();
        const totalMeses = (hoje.getFullYear() - primeiraData.getFullYear()) * 12 +
          (hoje.getMonth() - primeiraData.getMonth());

        if (totalMeses <= 24) {
          const mesAtual = new Date(primeiraData.getFullYear(), primeiraData.getMonth(), 1);
          while (mesAtual <= hoje) {
            const total = entradas
              .filter(e => e.data.getFullYear() === mesAtual.getFullYear() && e.data.getMonth() === mesAtual.getMonth())
              .reduce((s, e) => s + e.pontos, 0);
            const nomeMes = mesAtual.toLocaleString("pt-PT", { month: "short" });
            const anoCurto = mesAtual.getFullYear().toString().slice(2);
            dados.push({ label: `${nomeMes}/${anoCurto}`, pontos: total });
            mesAtual.setMonth(mesAtual.getMonth() + 1);
          }
        } else {
          let anoLoop = primeiraData.getFullYear();
          let triLoop = Math.floor(primeiraData.getMonth() / 3) + 1;
          const anoFim = hoje.getFullYear();
          const triFim = Math.floor(hoje.getMonth() / 3) + 1;
          while (anoLoop < anoFim || (anoLoop === anoFim && triLoop <= triFim)) {
            const total = entradas
              .filter(e => e.data.getFullYear() === anoLoop && Math.floor(e.data.getMonth() / 3) + 1 === triLoop)
              .reduce((s, e) => s + e.pontos, 0);
            const anoCurto = anoLoop.toString().slice(2);
            dados.push({ label: `T${triLoop} ${anoCurto}`, pontos: total });
            triLoop++;
            if (triLoop > 4) { triLoop = 1; anoLoop++; }
          }
        }
      } else {
        // semestre (padrão)
        const mesAtual = new Date().getMonth();
        const inicioSemestre = mesAtual < 6 ? 0 : 6;
        const ano = new Date().getFullYear();
        for (let i = inicioSemestre; i <= mesAtual; i++) {
          const total = entradas
            .filter(e => e.data.getFullYear() === ano && e.data.getMonth() === i)
            .reduce((s, e) => s + e.pontos, 0);
          dados.push({ label: NOMES_MESES[i], pontos: total });
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
  async getEstatisticasBadgesNivel(req, res) {
    try {
      const id_utilizador = req.utilizadorLogado.id_utilizador;

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

      // Agrupa por nível
      const porNivel = {};
      for (const r of registos) {
        const nivel = r.Badge && r.Badge.Nivel;
        const id_nivel = nivel ? nivel.id_nivel : 0;
        const nome = nivel ? nivel.nome_nivel : "Sem nível";
        if (!porNivel[id_nivel]) {
          porNivel[id_nivel] = { id_nivel, nome_nivel: nome, total_badges: 0 };
        }
        porNivel[id_nivel].total_badges++;
      }

      const dados = Object.values(porNivel).map(e => ({
        ID_Nivel: e.id_nivel,
        Nome_Nivel: e.nome_nivel,
        total_badges: e.total_badges
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