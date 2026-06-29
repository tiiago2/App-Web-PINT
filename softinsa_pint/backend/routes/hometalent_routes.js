const express = require("express");
const router = express.Router();

const Controller = require('../controllers/hometalent_controller.js');

router.get("/candidaturas", Controller.getCandidaturas);

module.exports = router;