const { Op } = require('sequelize');
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Nivel', {
    id_nivel: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome_nivel: { type: DataTypes.TEXT, allowNull: false },
    updated_nivel: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    deleted_nivel: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false }
  }, { 
    tableName: 'nivel', 
    timestamps: false,
    defaultScope: {
      where: {
        [Op.or]: [{ deleted_nivel: false }, { deleted_nivel: null }]
      }
    },
    hooks: {
      beforeUpdate: (instance) => {
        instance.updated_nivel = new Date();
      },
      beforeBulkUpdate: (options) => {
        if (options.attributes) {
          options.attributes.updated_nivel = new Date();
        }
      }
    }
  });
};