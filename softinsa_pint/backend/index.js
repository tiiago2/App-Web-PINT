const express = require("express");
const cors = require("cors");
const sequelize = require("./config/db.config");
const atividadeRoutes = require("./routes/atividade.routes");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globais
app.use(cors());
app.use(express.json());

// Montagem das Rotas MVC
app.use("/api", atividadeRoutes);

// Sincronizar Sequelize e arrancar o servidor
// (Nota: alterToSync: false para evitar recriação de tabelas, já que o DDL físico foi corrido externamente)
sequelize
  .sync({ force: false })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor de API a correr na porta ${PORT} (Sequelize ativo)`);
    });
  })
  .catch((err) => {
    console.error("Erro ao sincronizar base de dados com Sequelize:", err.message);
  });
