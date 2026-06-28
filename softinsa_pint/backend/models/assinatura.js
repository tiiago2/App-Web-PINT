const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Assinatura', {
    id_assinatura: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    update_assinatura: { type: DataTypes.DATE, allowNull: false },
    id_proprietario: { type: DataTypes.INTEGER, allowNull: false }
  }, { tableName: 'assinatura', timestamps: false });
};