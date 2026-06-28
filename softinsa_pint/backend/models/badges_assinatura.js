const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('BadgesAssinatura', {
    id_assinatura: { type: DataTypes.INTEGER, primaryKey: true },
    id_badge: { type: DataTypes.INTEGER, primaryKey: true }
  }, { tableName: 'badges_assinatura', timestamps: false });
};