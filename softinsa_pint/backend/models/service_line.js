const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('ServiceLine', {
    id_service_line: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_learning_path: { type: DataTypes.INTEGER, allowNull: false },
    descricao_service_line: { type: DataTypes.TEXT, allowNull: true },
    nome_service_line: { type: DataTypes.TEXT, allowNull: false },
    updated_service: { type: DataTypes.DATE, allowNull: false },
    deleted_service: { type: DataTypes.BOOLEAN, allowNull: false },
    id_lider: { type: DataTypes.INTEGER, allowNull: false }
  }, { tableName: 'service_line', timestamps: false });
};