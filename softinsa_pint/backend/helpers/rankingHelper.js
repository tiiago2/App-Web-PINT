const {
  Consultor,
  Utilizador,
  Area,
  ServiceLine,
  Badges,
  RegistoBadges
} = require("../models");

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

/**
 * Calcula o ranking de consultores.
 *
 * @param {number|null} id_service_line - Se fornecido, filtra consultores dessa service line.
 *                                        Se null, devolve ranking global.
 * @returns {Promise<Array>} Array de objetos de ranking.
 */
async function calcularRanking(id_service_line = null) {
  const includeArea = {
    model: Area,
    attributes: ["nome_area"],
    where: { deleted_area: false },
    include: [
      {
        model: ServiceLine,
        attributes: ["nome_service_line"]
      }
    ]
  };

  if (id_service_line) {
    includeArea.where.id_service_line = id_service_line;
  }

  const consultores = await Consultor.findAll({
    where: { ativo: true },
    include: [
      {
        model: Utilizador,
        attributes: ["id_utilizador", "nome_user", "imagem_perfil"]
      },
      includeArea
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

  return ranking;
}

module.exports = {
  calcularRanking
};
