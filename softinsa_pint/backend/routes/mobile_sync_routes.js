const express = require('express');
const mobileAuthMiddleware = require('../middleware/mobile_auth_middleware');
const mobileAuthRoutes = require('./mobile_auth_routes');
const mobileDeviceRoutes = require('./mobile_device_routes');
const mobileMutationRoutes = require('./mobile_mutation_routes');
const mobileSubmissionRoutes = require('./mobile_submission_routes');
const mobileHealthController = require('../controllers/mobile_health_controller');
const mobileSyncController = require('../controllers/mobile_sync_controller');

const router = express.Router();

router.get('/health', mobileHealthController.health);
router.use('/auth', mobileAuthRoutes);
router.use('/devices', mobileDeviceRoutes);
router.use('/submissions', mobileSubmissionRoutes);
router.use('/', mobileMutationRoutes);
router.get('/sync', mobileAuthMiddleware, mobileSyncController.sincronizar);

module.exports = router;
