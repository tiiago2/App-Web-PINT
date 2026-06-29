const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Logs', {
    id_log: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tabela: { type: DataTypes.TEXT, allowNull: false },
    tipo: { type: DataTypes.INTEGER, allowNull: false },
    id_alvo: { type: DataTypes.INTEGER, allowNull: false },
    data_log: { type: DataTypes.DATE, allowNull: false }
  }, { tableName: 'logs', timestamps: false });
};