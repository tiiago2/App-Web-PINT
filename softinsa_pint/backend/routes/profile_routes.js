const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/auth_middleware');

const Controller = require('../controllers/profile_controller.js');

router.get("/getuser", Controller.getUserLogin);

module.exports = router;