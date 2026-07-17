const { Sequelize } = require("sequelize");
require("dotenv").config();

const useSsl = process.env.DB_SSL !== "false";

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
    },
    dialectOptions: useSsl
      ? {
          ssl: {
            require: true, 
            rejectUnauthorized: false // Necessário no Render para aceitar o certificado auto-assinado
          }
        }
      : {}
  }
);

// Verificar ligação no arranque
sequelize
  .authenticate()
  .then(() => {
    console.log("Sequelize: Ligação à BD PostgreSQL estabelecida com sucesso.");
  })
  .catch(() => {
    console.error("Sequelize: Não foi possível ligar à BD PostgreSQL.");
  });

module.exports = sequelize;
