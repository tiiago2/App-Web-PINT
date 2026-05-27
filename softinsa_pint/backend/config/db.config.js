const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: parseInt(process.env.DB_PORT || "5432"),
    logging: false, // Evita spam de logs de SQL do Sequelize na consola
    define: {
      timestamps: false // Impede o Sequelize de procurar colunas createdAt/updatedAt
    }
  }
);

// Verificar ligação no arranque
sequelize
  .authenticate()
  .then(() => {
    console.log("Sequelize: Ligação à BD PostgreSQL estabelecida com sucesso.");
  })
  .catch((err) => {
    console.error("Sequelize: Não foi possível ligar à BD PostgreSQL:", err.message);
  });

module.exports = sequelize;
