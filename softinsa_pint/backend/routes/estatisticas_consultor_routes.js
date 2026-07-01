const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/auth_middleware');

const Controller = require('../controllers/estatisticas_consultor_controller.js');

router.get("/kpi", authMiddleware, Controller.getEstatisticasKpi);
router.get("/evolucao/:periodo", authMiddleware, Controller.getEstatisticasEvolucao);
router.get("/conquistados-mes", authMiddleware, Controller.getEstatisticasConquistadosMes);
router.get("/badges-nivel", authMiddleware, Controller.getEstatisticasBadgesNivel);

module.exports = router;