const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/auth_middleware');

const Controller = require('../controllers/hometalent_controller.js');

router.get("/candidaturas", authMiddleware, Controller.getCandidaturas);
router.get("/ranking", authMiddleware, Controller.getRanking);

module.exports = router;