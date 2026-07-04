const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/auth_middleware');
const candidaturasController = require('../controllers/candidaturas_controller');

router.get("/", authMiddleware, candidaturasController.getCandidaturas);
router.put("/:id/status", authMiddleware, candidaturasController.updateStatus);

module.exports = router;
