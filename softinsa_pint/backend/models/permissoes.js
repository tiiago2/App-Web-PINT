const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Permissoes', {
    id_permissao: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    descricao_permissao: { type: DataTypes.TEXT, allowNull: false },
    toggle: { type: DataTypes.BOOLEAN, allowNull: false },
    updated_permissao: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, { tableName: 'permissoes', timestamps: false });
};
