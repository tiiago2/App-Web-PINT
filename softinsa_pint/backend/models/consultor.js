const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Consultor', {
    id_utilizador: { type: DataTypes.INTEGER, primaryKey: true },
    id_area: { type: DataTypes.INTEGER, allowNull: false },
    email: { type: DataTypes.TEXT, allowNull: false },
    telefone: { type: DataTypes.INTEGER, allowNull: false },
    last_login: { type: DataTypes.DATE, allowNull: false },
    lingua: { type: DataTypes.TEXT, allowNull: false },
    password: { type: DataTypes.TEXT, allowNull: false },
    aceitacao_politicas: { type: DataTypes.BOOLEAN, allowNull: false },
    aceitacao_sla: { type: DataTypes.BOOLEAN, allowNull: false },
    update_user: { type: DataTypes.DATE, allowNull: false },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false },
    imagem_prefil: { type: DataTypes.TEXT, allowNull: false },
    nome_user: { type: DataTypes.TEXT, allowNull: false },
    pontos_totais: { type: DataTypes.INTEGER, allowNull: false }
  }, { tableName: 'consultor', timestamps: false });
};