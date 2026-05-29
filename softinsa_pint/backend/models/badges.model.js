const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Badges = sequelize.define(
  "Badges",
  {
    id_badge: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    nome_badge: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    tableName: "badges",
    timestamps: false
  }
);

module.exports = Badges;
