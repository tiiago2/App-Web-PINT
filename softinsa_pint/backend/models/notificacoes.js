const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Notificacoes', {
    id_notificacao: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_utilizador: { type: DataTypes.INTEGER, allowNull: true },
    descricao_notificacao: { type: DataTypes.TEXT, allowNull: false },
    data_envio: { type: DataTypes.DATE, allowNull: false },
    updated_notificacao: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    tipo_notificacao: { type: DataTypes.TEXT, allowNull: false }
  }, { tableName: 'notificacoes', timestamps: false });
};
