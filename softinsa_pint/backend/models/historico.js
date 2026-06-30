const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Historico', {
    id_utilizador: { type: DataTypes.INTEGER, primaryKey: true },
    id_submissao: { type: DataTypes.INTEGER, primaryKey: true },
    aceite: { type:DataTypes.BOOLEAN, allowNull: false },
    feedback: { type: DataTypes.TEXT, allowNull: true },
    data_avaliacao: { type: DataTypes.DATE, allowNull: false }
  }, { tableName: 'historico', timestamps: false });
};