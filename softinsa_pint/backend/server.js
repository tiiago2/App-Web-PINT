const express = require("express");
const cors = require("cors");
const rotas = require("./routes/central_rotas");
const db = require("./models");

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());

// Montagem das Rotas MVC
app.use("/api", rotas);

async function iniciar_bd() {
    try {
        await db.sequelize.sync({ force: false }); // Sincroniza tabelas
        console.log("Base de dados sincronizada.");

        app.listen(5000, () => {
            console.log("Servidor a ouvir na porta 5000");
        });
    } catch (err) {
        console.error("Erro ao arrancar:", err);
    }
}

iniciar_bd();
