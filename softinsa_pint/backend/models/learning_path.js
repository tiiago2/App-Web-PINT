const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('LearningPath', {
    id_learning_path: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome_learning_path: { type: DataTypes.TEXT, allowNull: false },
    descricao_larning_path: { type: DataTypes.TEXT, allowNull: true },
    updated_path: { type: DataTypes.DATE, allowNull: false },
    deleted_path: { type: DataTypes.BOOLEAN, allowNull: false }
  }, { tableName: 'learning_path', timestamps: false });
};