const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Requisitos', {
    id_requisito: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome_requisito: { type: DataTypes.TEXT, allowNull: false },
    descricao_requisito: { type: DataTypes.TEXT, allowNull: false },
    updated_requisitos: { type: DataTypes.DATE, allowNull: false },
    deleted_requisitos: { type: DataTypes.BOOLEAN, allowNull: false }
  }, { tableName: 'requisitos', timestamps: false });
};