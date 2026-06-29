const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('RolePermissoes', {
    id_role: { type: DataTypes.INTEGER, primaryKey: true },
    id_permissao: { type: DataTypes.INTEGER, primaryKey: true }
  }, { tableName: 'role_permissoes', timestamps: false });
};