const { Op } = require('sequelize');
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Historico', {
    id_utilizador: { type: DataTypes.INTEGER, primaryKey: true },
    id_submissao: { type: DataTypes.INTEGER, primaryKey: true },
    aceite: { type:DataTypes.BOOLEAN, allowNull: false },
    feedback: { type: DataTypes.TEXT, allowNull: true },
    data_avaliacao: { type: DataTypes.DATE, allowNull: false },
    updated_historico: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    deleted_historico: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false }
  }, { 
    tableName: 'historico', 
    timestamps: false,
    defaultScope: {
      where: {
        [Op.or]: [{ deleted_historico: false }, { deleted_historico: null }]
      }
    },
    hooks: {
      beforeUpdate: (instance) => {
        instance.updated_historico = new Date();
      },
      beforeBulkUpdate: (options) => {
        if (options.attributes) {
          options.attributes.updated_historico = new Date();
        }
      }
    }
  });
};