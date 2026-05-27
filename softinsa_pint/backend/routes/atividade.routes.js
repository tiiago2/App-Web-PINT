const express = require("express");
const router = express.Router();
const AtividadeController = require("../controllers/atividade.controller");

// Definição da rota para obter atividades
router.get("/atividade", AtividadeController.getAtividade);

module.exports = router;
