const express = require("express");
const router = express.Router();

const rotas_home_talent = require('./hometalent_routes');

router.use("/hometalent", rotas_home_talent);

module.exports = router;