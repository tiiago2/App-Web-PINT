const express = require("express");
const router = express.Router();

const controller_login = require('../controllers/auth_controller');

const rotas_home_talent = require('./hometalent_routes');
const rotas_comuns = require('./commun_routes');

const rotas_home_consultor = require('./homeconsultor_routes');
const rotas_estatisticas_consultor = require('./estatisticas_consultor_routes');
const rotas_estatisticas_service = require('./estatisticas_service_routes');
const rotas_estatisticas_talent = require('./estatisticas_talent_routes');
const rotas_estatisticas_admin = require('./estatisticas_admin_routes');
const rotas_atividade = require('./atividade.routes');
const rotas_home_admin = require('./homeadmin_routes');
const rotas_utilizadores = require('./utilizador_routes');

router.use("/hometalent", rotas_home_talent);
router.use("/homeconsultor", rotas_home_consultor);
router.use("/estatisticasconsultor", rotas_estatisticas_consultor);
router.use("/estatisticasservice", rotas_estatisticas_service);
router.use("/estatisticastalent", rotas_estatisticas_talent);
router.use("/estatisticasadmin", rotas_estatisticas_admin);
router.use("/atividade", rotas_atividade);
router.use("/homeadmin", rotas_home_admin);
router.use("/utilizadores", rotas_utilizadores);
router.post("/login", controller_login.login);
router.get("/getuser", controller_login.getUser);
router.use("/commun", rotas_comuns);

module.exports = router;