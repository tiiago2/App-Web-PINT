const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Objetivos', {
    id_objetivo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_badge: { type: DataTypes.INTEGER, allowNull: false },
    id_utilizador: { type: DataTypes.INTEGER, allowNull: false },
    data_inicial: { type: DataTypes.DATE, allowNull: false },
    data_final: { type: DataTypes.DATE, allowNull: false },
    deleted_objetivo: { type: DataTypes.BOOLEAN, allowNull: false },
    data_conclusao: { type: DataTypes.DATE, allowNull: true },
    notificacao_fim: {type: DataTypes.BOOLEAN, allowNull: false, default:0 }
  }, { tableName: 'objetivos', timestamps: false });
};