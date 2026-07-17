const { Op } = require('sequelize');
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Notificacoes', {
    id_notificacao: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_utilizador: { type: DataTypes.INTEGER, allowNull: true },
    descricao_notificacao: { type: DataTypes.TEXT, allowNull: false },
    data_envio: { type: DataTypes.DATE, allowNull: false },
    tipo_notificacao: { type: DataTypes.TEXT, allowNull: false },
    updated_notificacao: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    deleted_notificacao: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false }
  }, { 
    tableName: 'notificacoes', 
    timestamps: false,
    defaultScope: {
      where: {
        [Op.or]: [{ deleted_notificacao: false }, { deleted_notificacao: null }]
      }
    },
    hooks: {
      beforeUpdate: (instance) => {
        instance.updated_notificacao = new Date();
      },
      beforeBulkUpdate: (options) => {
        if (options.attributes) {
          options.attributes.updated_notificacao = new Date();
        }
      }
    }
  });
};
