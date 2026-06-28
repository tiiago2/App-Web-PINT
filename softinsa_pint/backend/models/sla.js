const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Sla', {
    id_sla: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_utilizador: { type: DataTypes.INTEGER, allowNull: false },
    data_modificacao: { type: DataTypes.DATE, allowNull: false },
    tempo_max: { type: DataTypes.INTEGER, allowNull: false },
    descricao_sla: { type: DataTypes.TEXT, allowNull: true }
  }, { tableName: 'sla', timestamps: false });
};