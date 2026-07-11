const { ServiceLine, Area, Badges } = require("../models");

/**
 * Obtém os IDs dos badges pertencentes à Service Line liderada pelo utilizador.
 * 
 * @param {number} id_utilizador - ID do líder da Service Line
 * @returns {number[]|null} Array de badge IDs, ou null se o utilizador não lidera nenhuma Service Line
 */
async function getBadgeIdsForServiceLeader(id_utilizador) {
  const serviceLine = await ServiceLine.findOne({
    where: { id_lider: id_utilizador, deleted_service: false }
  });

  if (!serviceLine) {
    return null;
  }

  const areas = await Area.findAll({
    where: { id_service_line: serviceLine.id_service_line, deleted_area: false }
  });
  const areaIds = areas.map(a => a.id_area);

  const badges = await Badges.findAll({
    where: { id_area: areaIds, deleted_badge: false }
  });

  return badges.map(b => b.id_badge);
}

module.exports = { getBadgeIdsForServiceLeader };
