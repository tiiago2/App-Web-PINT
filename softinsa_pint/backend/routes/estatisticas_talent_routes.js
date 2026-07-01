const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/auth_middleware');

const Controller = require('../controllers/estatisticas_talent_controller.js');

router.get("/kpis", authMiddleware, Controller.getKpis);
router.get("/badges-por-nivel", authMiddleware, Controller.getBadgesPorNivel);
router.get("/atribuidos-mes", authMiddleware, Controller.getAtribuidosMes);
router.get("/learning-paths", authMiddleware, Controller.getLearningPaths);
router.get("/ranking", authMiddleware, Controller.getRanking);

module.exports = router;
