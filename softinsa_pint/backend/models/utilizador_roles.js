const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('UtilizadorRoles', {
    id_utilizador: { type: DataTypes.INTEGER, primaryKey: true },
    id_role: { type: DataTypes.INTEGER, primaryKey: true }
  }, { tableName: 'utilizador_roles', timestamps: false });
};