const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/auth_middleware');

const Controller = require('../controllers/commun_controller.js');

router.get("/ranking", authMiddleware, Controller.getRanking);
router.get("/candidaturasweek/:id", authMiddleware, Controller.getCandidaturasSemana);
router.get("/stats4months", Controller.getEstatisticasMensais);

module.exports = router;