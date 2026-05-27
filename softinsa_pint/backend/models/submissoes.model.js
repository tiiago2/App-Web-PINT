const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Submissoes = sequelize.define(
  "Submissoes",
  {
    id_submissao: {
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
    status: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    data_submissao: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    tableName: "submissoes",
    timestamps: false
  }
);

module.exports = Submissoes;
