const express = require('express');
const mobileAuthMiddleware = require('../middleware/mobile_auth_middleware');
const mobileIdempotencyMiddleware = require('../middleware/mobile_idempotency_middleware');
const mobileMutationController = require('../controllers/mobile_mutation_controller');

const router = express.Router();

router.post(
  '/objectives',
  mobileAuthMiddleware,
  mobileIdempotencyMiddleware({
    operationType: 'objective.create',
    logicalRoute: '/api/mobile/objectives'
  }),
  mobileMutationController.criarObjetivo
);
router.delete(
  '/objectives/:idObjetivo',
  mobileAuthMiddleware,
  mobileIdempotencyMiddleware({
    operationType: 'objective.delete',
    logicalRoute: '/api/mobile/objectives/:idObjetivo'
  }),
  mobileMutationController.eliminarObjetivo
);
router.put(
  '/profile',
  mobileAuthMiddleware,
  mobileIdempotencyMiddleware({
    operationType: 'profile.update',
    logicalRoute: '/api/mobile/profile'
  }),
  mobileMutationController.atualizarPerfil
);
router.put(
  '/signature',
  mobileAuthMiddleware,
  mobileIdempotencyMiddleware({
    operationType: 'signature.update',
    logicalRoute: '/api/mobile/signature'
  }),
  mobileMutationController.atualizarAssinatura
);

module.exports = router;
