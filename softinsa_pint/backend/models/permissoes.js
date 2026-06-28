const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Permissoes', {
    id_permissao: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    descricao_permissao: { type: DataTypes.TEXT, allowNull: false }
  }, { tableName: 'permissoes', timestamps: false });
};