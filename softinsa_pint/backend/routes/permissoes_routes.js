const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth_middleware");
const Controller = require("../controllers/permissoes_controller");

router.get("/:chave", authMiddleware, Controller.verificarPermissao);

module.exports = router;