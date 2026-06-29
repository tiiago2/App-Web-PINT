const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Nivel', {
    id_nivel: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome_nivel: { type: DataTypes.TEXT, allowNull: false }
  }, { tableName: 'nivel', timestamps: false });
};