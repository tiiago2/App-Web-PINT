const express = require('express');
const router = express.Router();
const syncController = require('../controllers/sync_controller');
const authMiddleware = require('../middleware/auth_middleware'); // Assuming token auth is used by mobile app

// Endpoint para o telemóvel descarregar as alterações (Delta Sync)
router.get('/', authMiddleware, syncController.getSyncData);

module.exports = router;
