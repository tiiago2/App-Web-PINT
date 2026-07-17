const { Op } = require('sequelize');
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Submissoes', {
    id_submissao: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_badge: { type: DataTypes.INTEGER, allowNull: false },
    id_utilizador: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.TEXT, allowNull: false },
    data_submissao: { type: DataTypes.DATE, allowNull: false },
    notificacao_sla: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    updated_submissao: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    deleted_submissao: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false }
  }, { 
    tableName: 'submissoes', 
    timestamps: false,
    defaultScope: {
      where: {
        [Op.or]: [{ deleted_submissao: false }, { deleted_submissao: null }]
      }
    },
    hooks: {
      beforeUpdate: (instance) => {
        instance.updated_submissao = new Date();
      },
      beforeBulkUpdate: (options) => {
        if (options.attributes) {
          options.attributes.updated_submissao = new Date();
        }
      }
    }
  });
};