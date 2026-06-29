const express = require("express");
const router = express.Router();

const controller_login = require('../controllers/auth_controller');

const rotas_home_talent = require('./hometalent_routes');

router.use("/hometalent", rotas_home_talent);
router.post("/login", controller_login.login);

module.exports = router;