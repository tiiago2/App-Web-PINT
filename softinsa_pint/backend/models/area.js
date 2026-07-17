const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Area', {
    id_area: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_service_line: { type: DataTypes.INTEGER, allowNull: false },
    nome_area: { type: DataTypes.TEXT, allowNull: false },
    descricao_area: { type: DataTypes.TEXT, allowNull: true },
    updated_area: { type: DataTypes.DATE, allowNull: false },
    deleted_area: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false }
  }, { tableName: 'area', timestamps: false });
};