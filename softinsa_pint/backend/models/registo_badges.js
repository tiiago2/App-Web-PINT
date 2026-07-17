const { Op } = require('sequelize');
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('RegistoBadges', {
    id_registo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    id_badge: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_utilizador: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    data_obtencao: {
      type: DataTypes.DATE,
      allowNull: false
    },
    expirado: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    updated_registo: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    deleted_registo: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false }
  }, {
    tableName: 'registo_badges',
    timestamps: false,
    defaultScope: {
      where: {
        [Op.or]: [{ deleted_registo: false }, { deleted_registo: null }]
      }
    },
    hooks: {
      beforeUpdate: (instance) => {
        instance.updated_registo = new Date();
      },
      beforeBulkUpdate: (options) => {
        if (options.attributes) {
          options.attributes.updated_registo = new Date();
        }
      }
    }
  });
};
