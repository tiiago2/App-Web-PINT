const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Recetor', {
    id_notificacao: { type: DataTypes.INTEGER, primaryKey: true },
    id_utilizador: { type: DataTypes.INTEGER, primaryKey: true },
    lida: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'recetor', timestamps: false });
};