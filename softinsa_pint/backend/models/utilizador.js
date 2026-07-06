const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Utilizador', {
    id_utilizador: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.TEXT, allowNull: false },
    telefone: { type: DataTypes.INTEGER, allowNull: false },
    last_login: { type: DataTypes.DATE, allowNull: true },
    lingua: { type: DataTypes.TEXT, allowNull: false },
    password: { type: DataTypes.TEXT, allowNull: false },
    aceitacao_politicas: { type: DataTypes.BOOLEAN, allowNull: false },
    aceitacao_sla: { type: DataTypes.BOOLEAN, allowNull: false },
    update_user: { type: DataTypes.DATE, allowNull: false },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false },
    imagem_perfil: { type: DataTypes.TEXT, allowNull: false },
    nome_user: { type: DataTypes.TEXT, allowNull: false },
    primeiro_login: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  }, { tableName: 'utilizador', timestamps: false });
};