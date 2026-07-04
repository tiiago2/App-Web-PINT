const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/auth_middleware');
const Controller = require('../controllers/objetivos_controller');

router.get("/", authMiddleware, Controller.getObjetivos);
router.get("/badges", authMiddleware, Controller.getBadgesDisponiveis);
router.post("/", authMiddleware, Controller.criarObjetivo);
router.delete("/:id", authMiddleware, Controller.removerObjetivo);

module.exports = router;
