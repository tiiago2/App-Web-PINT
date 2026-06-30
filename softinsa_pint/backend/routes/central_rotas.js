const express = require("express");
const router = express.Router();

const controller_login = require('../controllers/auth_controller');

const rotas_home_talent = require('./hometalent_routes');
const rotas_comuns = require('./commun_routes');

router.use("/hometalent", rotas_home_talent);
router.post("/login", controller_login.login);
router.get("/getuser", controller_login.getUser);
router.use("/commun", rotas_comuns);

module.exports = router;