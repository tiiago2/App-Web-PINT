const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/auth_middleware');

const Controller = require('../controllers/estatisticas_service_controller.js');

router.get("/kpis", authMiddleware, Controller.getKpis);
router.get("/badges-por-nivel", authMiddleware, Controller.getBadgesPorNivel);
router.get("/badges-atribuidos/:periodo", authMiddleware, Controller.getBadgesAtribuidos);
router.get("/status-candidaturas", authMiddleware, Controller.getStatusCandidaturas);
router.get("/ranking", authMiddleware, Controller.getRankingServiceLine);
router.get("/permissons", authMiddleware, Controller.getPermissao);

module.exports = router;
