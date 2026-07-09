const { Utilizador, Role } = require("../models");

/**
 * Extrai as roles do utilizador autenticado a partir do request.
 * Lê a role ativa do header 'x-user-role' e valida que pertence ao utilizador.
 * 
 * @param {Object} req - Express request object (deve conter req.utilizadorLogado)
 * @returns {Object} { id_utilizador, roles, roleAtiva, isAdmin, isTalent, isServiceLeader, isConsultor }
 */
async function getRolesFromRequest(req) {
  const id_utilizador = req.utilizadorLogado.id_utilizador;

  const userWithRoles = await Utilizador.findByPk(id_utilizador, {
    include: [{ model: Role, through: { attributes: [] } }]
  });

  const roles = userWithRoles
    ? userWithRoles.Roles.map(r => r.nome_role ? r.nome_role.toLowerCase() : "")
    : [];

  const activeRoleHeader = req.headers['x-user-role']
    ? req.headers['x-user-role'].toLowerCase()
    : null;

  const roleAtiva = (activeRoleHeader && roles.includes(activeRoleHeader))
    ? activeRoleHeader
    : null;

  const isAdmin = roleAtiva
    ? (roleAtiva === 'admin' || roleAtiva === 'administrador')
    : (roles.includes('admin') || roles.includes('administrador'));

  const isTalent = roleAtiva
    ? (roleAtiva === 'talent' || roleAtiva === 'talent manager')
    : (roles.includes('talent') || roles.includes('talent manager'));

  const isServiceLeader = roleAtiva
    ? (roleAtiva === 'service' || roleAtiva === 'service line leader')
    : (roles.includes('service') || roles.includes('service line leader'));

  const isConsultor = roleAtiva
    ? (roleAtiva === 'consultor')
    : (roles.includes('consultor'));

  return { id_utilizador, roles, roleAtiva, isAdmin, isTalent, isServiceLeader, isConsultor };
}

module.exports = { getRolesFromRequest };
