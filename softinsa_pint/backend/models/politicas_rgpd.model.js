const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const PoliticasRGPD = sequelize.define(
  "PoliticasRGPD",
  {
    id_politica: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    id_utilizador: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    data_alteracao: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    tableName: "politicas_rgpd",
    timestamps: false
  }
);

module.exports = PoliticasRGPD;
