const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const RegistoBadges = sequelize.define(
  "RegistoBadges",
  {
    id_registo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
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
    }
  },
  {
    tableName: "registo_badges",
    timestamps: false
  }
);

module.exports = RegistoBadges;
