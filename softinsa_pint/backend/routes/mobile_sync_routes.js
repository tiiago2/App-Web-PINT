const express = require('express');
const mobileAuthMiddleware = require('../middleware/mobile_auth_middleware');
const mobileAuthRoutes = require('./mobile_auth_routes');
const mobileDeviceRoutes = require('./mobile_device_routes');
const mobileHealthController = require('../controllers/mobile_health_controller');
const mobileSyncController = require('../controllers/mobile_sync_controller');
const multer = require('multer');

// Configuração do Multer para lidar com o upload de ficheiros de evidência
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite de 10MB para ficheiros pesados (PDFs/Imagens)
  }
});

const router = express.Router();

router.get('/health', mobileHealthController.health);
router.use('/auth', mobileAuthRoutes);
router.use('/devices', mobileDeviceRoutes);

// Rotas de sincronização unificada para Offline-First
router.get('/sync', mobileAuthMiddleware, mobileSyncController.sincronizar); // Mantido para compatibilidade de testes
router.get('/pull', mobileAuthMiddleware, mobileSyncController.pull);
router.post('/push', mobileAuthMiddleware, mobileSyncController.push);
router.post('/upload', mobileAuthMiddleware, upload.single('ficheiro'), mobileSyncController.upload);

module.exports = router;
