const express = require("express");
const cors = require("cors");
const rotas = require("./routes/central_rotas");
const db = require("./models");
const iniciarCronJobs = require("./cron");

const app = express();
const porta = process.env.PORT || 5000;

// Middlewares globais
app.use(cors());
app.use(express.json());

// Montagem das Rotas MVC
app.use("/api", rotas);

async function iniciar_bd() {
    try {
        await db.sequelize.sync({ force: true }); // Sincroniza e altera tabelas conforme os modelos
        console.log("Base de dados sincronizada.");

        // Iniciar os cron jobs
        iniciarCronJobs();

        app.listen(porta, () => {
            console.log("Servidor a ouvir na porta 5000");
        });
    } catch (_) {
        console.error("Erro interno ao arrancar o servidor.");
    }
}

iniciar_bd();
