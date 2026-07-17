const { Op } = require('sequelize');
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Assinatura', {
    id_assinatura: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    update_assinatura: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    id_proprietario: { type: DataTypes.INTEGER, allowNull: false },
    deleted_assinatura: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false }
  }, { 
    tableName: 'assinatura', 
    timestamps: false,
    defaultScope: {
      where: {
        [Op.or]: [{ deleted_assinatura: false }, { deleted_assinatura: null }]
      }
    },
    hooks: {
      beforeUpdate: (instance) => {
        instance.update_assinatura = new Date();
      },
      beforeBulkUpdate: (options) => {
        if (options.attributes) {
          options.attributes.update_assinatura = new Date();
        }
      }
    }
  });
};