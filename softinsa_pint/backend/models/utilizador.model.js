const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Utilizador = sequelize.define(
  "Utilizador",
  {
    id_utilizador: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    nome_user: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    tableName: "utilizador",
    timestamps: false
  }
);

module.exports = Utilizador;
