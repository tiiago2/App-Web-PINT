const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Logs = sequelize.define(
  "Logs",
  {
    id_log: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    tabela: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    tipo: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_alvo: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    data_log: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    tableName: "logs",
    timestamps: false
  }
);

module.exports = Logs;
