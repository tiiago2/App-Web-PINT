// 1º Inicializar Firebase de forma imediata antes de carregar modelos/Sequelize
require('./services/firebaseService');

// Proteção global contra crashes por exceções não capturadas.
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ [FATAL PREVENTED] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('⚠️ [FATAL PREVENTED] Uncaught Exception thrown:', err);
});

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
        // sync() sem alter:true — as tabelas já foram criadas pelos scripts .sql manuais.
        await db.sequelize.sync();
        console.log("Base de dados sincronizada.");

        // Iniciar os cron jobs
        iniciarCronJobs();

        app.listen(porta, () => {
            console.log("Servidor a ouvir na porta 5000");
        });
    } catch (err) {
        console.error("Erro interno ao arrancar o servidor:", err);
    }
}

iniciar_bd();
