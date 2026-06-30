const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/auth_middleware');

const Controller = require('../controllers/homeconsultor_controller.js');

router.get("/badges-progresso", authMiddleware, Controller.getBadgesProgresso);
router.get("/objetivos", authMiddleware, Controller.getObjetivos);
router.get("/progresso", authMiddleware, Controller.getProgresso);
router.get("/ranking", authMiddleware, Controller.getRanking);

module.exports = router;
