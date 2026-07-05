const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Submissoes', {
    id_submissao: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_badge: { type: DataTypes.INTEGER, allowNull: false },
    id_utilizador: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.TEXT, allowNull: false },
    data_submissao: { type: DataTypes.DATE, allowNull: false },
    notificacao_sla: {type: DataTypes.BOOLEAN, allowNull: false, default:0 }
  }, { tableName: 'submissoes', timestamps: false });
};