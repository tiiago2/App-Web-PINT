const express = require('express');
const router = express.Router();
const badgesController = require('../controllers/badges_controller');
const authMiddleware = require('../middleware/auth_middleware');
const autorizarAdmin = require('../middleware/autorizar_admin');

router.get('/', authMiddleware, badgesController.listarBadgesCatalogo);
router.get('/:id', authMiddleware, badgesController.obterBadgeDetalhe);

router.post(
  '/',
  authMiddleware,
  autorizarAdmin,
  badgesController.criarBadgeAdmin
);

router.put(
  '/:id',
  authMiddleware,
  autorizarAdmin,
  badgesController.atualizarBadgeAdmin
);

router.delete(
  '/:id',
  authMiddleware,
  autorizarAdmin,
  badgesController.removerBadgeAdmin
);

module.exports = router;
