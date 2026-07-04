const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/auth_middleware');

const AtividadeController = require('../controllers/atividade_controller');

// Definição da rota para obter atividades (autenticada)
router.get("/get", authMiddleware, AtividadeController.getAtividade);

module.exports = router;
