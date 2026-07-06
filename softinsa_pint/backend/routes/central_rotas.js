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
const rotas_atividade = require('./atividade_routes');
const rotas_home_admin = require('./homeadmin_routes');
const rotas_home_service = require('./homeservice_routes');
const rotas_utilizadores = require('./utilizador_routes');
const rotas_candidaturas = require('./candidaturas_routes');
const rotas_profile = require('./profile_routes');
const rotas_defs_permissoes = require('./permissoes_def.routes');
const rotas_rgpd = require('./rgpd.routes');
const rotas_permissoes = require('./permissoes_routes');
const rotas_objetivos = require('./objetivos_routes');
const badgesRoutes = require('./badges_routes');
const rotas_editar = require('./editar_routes');
const rotas_sla = require('./sla_routes');

router.use("/hometalent", rotas_home_talent);
router.use("/homeconsultor", rotas_home_consultor);
router.use("/objetivos", rotas_objetivos);
router.use("/badges", badgesRoutes);
router.use("/editar", rotas_editar);
router.use("/estatisticasconsultor", rotas_estatisticas_consultor);
router.use("/estatisticasservice", rotas_estatisticas_service);
router.use("/estatisticastalent", rotas_estatisticas_talent);
router.use("/estatisticasadmin", rotas_estatisticas_admin);
router.use("/atividade", rotas_atividade);
router.use("/profile", rotas_profile);
router.use("/homeadmin", rotas_home_admin);
router.use("/homeservice", rotas_home_service);
router.use("/utilizadores", rotas_utilizadores);
router.use("/candidaturas", rotas_candidaturas);
router.use("/defs-permissoes", rotas_defs_permissoes);
router.use("/rgpd", rotas_rgpd);
router.post("/login", controller_login.login);
router.post("/esqueci-password", controller_login.esqueciPassword);
router.post("/primeiro-acesso", controller_login.primeiroAcesso);
router.put("/putlastlogin", controller_login.postLastLogin)
router.get("/getuser", controller_login.getUser);
router.use("/commun", rotas_comuns);
router.use("/permissoes", rotas_permissoes);
router.use("/sla", rotas_sla);

module.exports = router;
