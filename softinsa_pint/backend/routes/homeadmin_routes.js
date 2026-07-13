const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/auth_middleware');
const Controller = require('../controllers/homeadmin_controller');

router.get("/stats", authMiddleware, Controller.getStats);
router.get("/ranking", authMiddleware, Controller.getRanking);
router.get("/candidaturasadmin", authMiddleware, Controller.getCandidaturasSemana_Admin);

module.exports = router;
