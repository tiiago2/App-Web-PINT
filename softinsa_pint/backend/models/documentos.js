const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Documentos', {
    id_submissao: { type: DataTypes.INTEGER, primaryKey: true },
    id_ficheiro: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    id_requisito: { type: DataTypes.INTEGER, allowNull: false },
    ficheiro: { type: DataTypes.TEXT, allowNull: false },
    updated_file: { type: DataTypes.DATE, allowNull: false },
    deleted_file: { type: DataTypes.BOOLEAN, allowNull: false }
  }, { tableName: 'documentos', timestamps: false });
};