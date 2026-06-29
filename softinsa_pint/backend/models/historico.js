const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Historico', {
    id_utilizador: { type: DataTypes.INTEGER, primaryKey: true },
    id_submissao: { type: DataTypes.INTEGER, primaryKey: true },
    feedback: { type: DataTypes.TEXT, allowNull: true }
  }, { tableName: 'historico', timestamps: false });
};