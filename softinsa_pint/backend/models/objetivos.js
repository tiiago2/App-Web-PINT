const { Op } = require('sequelize');
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Objetivos', {
    id_objetivo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_badge: { type: DataTypes.INTEGER, allowNull: false },
    id_utilizador: { type: DataTypes.INTEGER, allowNull: false },
    data_inicial: { type: DataTypes.DATE, allowNull: false },
    data_final: { type: DataTypes.DATE, allowNull: false },
    deleted_objetivo: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    data_conclusao: { type: DataTypes.DATE, allowNull: true },
    notificacao_fim: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    updated_objetivo: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW }
  }, { 
    tableName: 'objetivos', 
    timestamps: false,
    defaultScope: {
      where: {
        [Op.or]: [{ deleted_objetivo: false }, { deleted_objetivo: null }]
      }
    },
    hooks: {
      beforeUpdate: (instance) => {
        instance.updated_objetivo = new Date();
      },
      beforeBulkUpdate: (options) => {
        if (options.attributes) {
          options.attributes.updated_objetivo = new Date();
        }
      }
    }
  });
};
