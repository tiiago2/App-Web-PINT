const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/auth_middleware');

const Controller = require('../controllers/profile_controller.js');

router.get("/getuser", authMiddleware, Controller.getUserLogin);
router.post("/updateassinatura", authMiddleware, Controller.atualizarPerfilCompleto);
router.get("/public/:id", Controller.getPublicProfile);

module.exports = router;