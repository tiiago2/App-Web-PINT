const express = require("express");
const router = express.Router();

const controller_login = require('../controllers/auth_controller');

const rotas_home_talent = require('./hometalent_routes');
const rotas_comuns = require('./commun_routes');

const rotas_home_consultor = require('./homeconsultor_routes');
const rotas_atividade = require('./atividade.routes');
const rotas_home_admin = require('./homeadmin_routes');

router.use("/hometalent", rotas_home_talent);
router.use("/homeconsultor", rotas_home_consultor);
router.use("/atividade", rotas_atividade);
router.use("/homeadmin", rotas_home_admin);
router.post("/login", controller_login.login);
router.get("/getuser", controller_login.getUser);
router.use("/commun", rotas_comuns);

module.exports = router;