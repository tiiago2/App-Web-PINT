const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/auth_middleware');

const Controller = require('../controllers/homeservice_controller.js');

router.get("/ranking-geral", authMiddleware, Controller.getRankingGeral);
router.get("/ranking-service-line", authMiddleware, Controller.getRankingServiceLine);

module.exports = router;
