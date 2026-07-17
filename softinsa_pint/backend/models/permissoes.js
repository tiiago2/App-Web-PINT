const { Op } = require('sequelize');
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Permissoes', {
    id_permissao: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    descricao_permissao: { type: DataTypes.TEXT, allowNull: false },
    toggle: { type: DataTypes.BOOLEAN, allowNull: false },
    updated_permissao: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    deleted_permissao: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false }
  }, { 
    tableName: 'permissoes', 
    timestamps: false,
    defaultScope: {
      where: {
        [Op.or]: [{ deleted_permissao: false }, { deleted_permissao: null }]
      }
    },
    hooks: {
      beforeUpdate: (instance) => {
        instance.updated_permissao = new Date();
      },
      beforeBulkUpdate: (options) => {
        if (options.attributes) {
          options.attributes.updated_permissao = new Date();
        }
      }
    }
  });
};