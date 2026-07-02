const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth_middleware');
const Controller = require('../controllers/rgpd.controller');

router.get('/', authMiddleware, Controller.getRGPDDetails);
router.put('/', authMiddleware, Controller.updateRGPDText);

module.exports = router;
