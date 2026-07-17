const express = require('express');
const mobileAuthMiddleware = require('../middleware/mobile_auth_middleware');
const mobileDevicesController = require('../controllers/mobile_devices_controller');

const router = express.Router();

function adaptarIdentidadeMobile(req, res, next) {
  req.utilizadorLogado = {
    id_utilizador: req.mobileAuth.id_utilizador
  };
  return next();
}

function adaptarFcmToken(req, res, next) {
  req.body = {
    ...(req.body || {}),
    token: req.body?.fcm_token
  };
  return next();
}

router.use(mobileAuthMiddleware, adaptarIdentidadeMobile);
router.put('/', adaptarFcmToken, mobileDevicesController.registerDevice);
router.delete('/:deviceId', mobileDevicesController.deactivateDevice);

module.exports = router;
