const express = require("express");
const router = express.Router();

const AtividadeController = require('../controllers/atividade_controller');

// Definição da rota para obter atividades
router.get("/get", AtividadeController.getAtividade);

module.exports = router;
