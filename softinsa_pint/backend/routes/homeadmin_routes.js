const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/auth_middleware');
const Controller = require('../controllers/homeadmin_controller');

router.get("/stats", authMiddleware, Controller.getStats);

module.exports = router;
