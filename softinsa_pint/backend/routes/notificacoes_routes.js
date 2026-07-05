const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/auth_middleware');

const Controller = require('../controllers/notificacoes_controller.js');

router.get("/getnotificacoes", authMiddleware, Controller.getNotificacoes);
router.get("/updaterecetor", authMiddleware, Controller.updateRecetor);
router.post("/enviaraviso", authMiddleware, Controller.enviarAviso);
router.get("/getavisos", authMiddleware, Controller.getAvisosUtilizador);

module.exports = router;