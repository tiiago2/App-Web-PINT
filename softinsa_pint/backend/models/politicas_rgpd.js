const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('PoliticasRgpd', {
    id_politica: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_utilizador: { type: DataTypes.INTEGER, allowNull: false },
    descricao_rgpd: { type: DataTypes.TEXT, allowNull: false },
    data_alteracao: { type: DataTypes.DATE, allowNull: false }
  }, { tableName: 'politicas_rgpd', timestamps: false });
};