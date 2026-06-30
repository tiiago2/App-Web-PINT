const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/auth_middleware');

const Controller = require('../controllers/hometalent_controller.js');

router.get("/candidaturas", authMiddleware, Controller.getCandidaturas);

module.exports = router;