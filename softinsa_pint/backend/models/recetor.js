const { Op } = require('sequelize');
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Recetor', {
    id_notificacao: { type: DataTypes.INTEGER, primaryKey: true },
    id_utilizador: { type: DataTypes.INTEGER, primaryKey: true },
    lida: { type: DataTypes.BOOLEAN, defaultValue: false },
    last_read: { type: DataTypes.BOOLEAN },
    updated_recetor: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    deleted_recetor: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false }
  }, { 
    tableName: 'recetor', 
    timestamps: false,
    defaultScope: {
      where: {
        [Op.or]: [{ deleted_recetor: false }, { deleted_recetor: null }]
      }
    },
    hooks: {
      beforeUpdate: (instance) => {
        instance.updated_recetor = new Date();
      },
      beforeBulkUpdate: (options) => {
        if (options.attributes) {
          options.attributes.updated_recetor = new Date();
        }
      }
    }
  });
};