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
    imagem_perfil: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'https://res.cloudinary.com/nvvadzck/image/upload/v1783882405/default_pint.jpg'},
    nome_user: { type: DataTypes.TEXT, allowNull: false },
    primeiro_login: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    pontos_sem: { type: DataTypes.INTEGER, allowNull: true },
    pontos_mes: { type: DataTypes.INTEGER, allowNull: true },
    pontos_ano: { type: DataTypes.INTEGER, allowNull: true },
    pontos_totais: { type: DataTypes.INTEGER, allowNull: true }
  }, { tableName: 'utilizador', timestamps: false });
};