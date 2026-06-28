const express = require("express");
const router = express.Router();

const rotas_home_talent = require('./hometalent_routes');

// Definição da rota para obter atividades

router.get("/atividade", AtividadeController.getAtividade);

module.exports = router;
