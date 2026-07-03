const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/auth_middleware');

const Controller = require('../controllers/homeconsultor_controller.js');
const ObjetivosController = require('../controllers/objetivos_controller.js');

router.get("/badges-progresso", authMiddleware, Controller.getBadgesProgresso);
router.get("/objetivos", authMiddleware, ObjetivosController.getObjetivos);
router.post("/objetivos", authMiddleware, ObjetivosController.criarObjetivo);
router.delete("/objetivos/:id", authMiddleware, ObjetivosController.removerObjetivo);
router.get("/progresso", authMiddleware, Controller.getProgresso);
router.get("/ranking", authMiddleware, Controller.getRanking);

module.exports = router;