const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('RequisitosBadge', {
    id_badge: { type: DataTypes.INTEGER, primaryKey: true },
    id_requisito: { type: DataTypes.INTEGER, primaryKey: true }
  }, { tableName: 'requisitos_badge', timestamps: false });
};