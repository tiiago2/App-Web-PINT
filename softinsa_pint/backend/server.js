const express = require("express");
const cors = require("cors");
const sequelize = require("./config/db.config");
const rotas = require("./routes/central_rotas");

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());

// Montagem das Rotas MVC
app.use("/api", rotas);

async function iniciar_bd() {
    try {
        await sequelize.sync({ force: false }); // Sincroniza tabelas
        console.log("Base de dados sincronizada.");

        app.listen(5000, () => {
            console.log("Servidor a ouvir na porta 5000");
        });
    } catch (err) {
        console.error("Erro ao arrancar:", err);
    }
}

iniciar_bd();
