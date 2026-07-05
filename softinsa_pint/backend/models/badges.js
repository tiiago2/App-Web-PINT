const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Badges', {
    id_badge: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_area: { type: DataTypes.INTEGER, allowNull: false },
    id_nivel: { type: DataTypes.INTEGER, allowNull: false },
    validade: { type: DataTypes.BIGINT, allowNull: true },
    especial: { type: DataTypes.BOOLEAN, allowNull: false },
    pontos_badge: { type: DataTypes.INTEGER, allowNull: false },
    nome_badge: { type: DataTypes.TEXT, allowNull: false },
    imagem: { type: DataTypes.TEXT, allowNull: false },
    update_badge: { type: DataTypes.DATE, allowNull: false },
    deleted_badge: { type: DataTypes.BOOLEAN, allowNull: false },
    descricao_badge: { type: DataTypes.TEXT, allowNull: true }
  }, { tableName: 'badges', timestamps: false });
};