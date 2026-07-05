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
    expirado: {type: DataTypes.BOOLEAN, allowNull: false, default:0 }
  }, {
    tableName: 'registo_badges',
    timestamps: false
  });
};
