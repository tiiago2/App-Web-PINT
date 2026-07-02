const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth_middleware');
const Controller = require('../controllers/permissoes_def.controller');

router.get('/', authMiddleware, Controller.getPermissoesDefs);
router.put('/', authMiddleware, Controller.updatePermissoesDefs);

module.exports = router;
