const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth_middleware');
const slaController = require('../controllers/sla_controller');

// GET /api/sla — Obter configuração completa + métricas
router.get('/', auth, slaController.obterConfigSla);

// PUT /api/sla — Guardar configuração de prazos e toggle
router.put('/', auth, slaController.atualizarConfigSla);

module.exports = router;
