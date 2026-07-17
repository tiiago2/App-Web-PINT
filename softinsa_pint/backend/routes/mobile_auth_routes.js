const express = require('express');
const mobileAuthController = require('../controllers/mobile_auth_controller');
const mobileAuthMiddleware = require('../middleware/mobile_auth_middleware');

const router = express.Router();

router.post('/login', mobileAuthController.login);
router.post('/refresh', mobileAuthController.refresh);
router.post('/logout', mobileAuthController.logout);
router.get('/me', mobileAuthMiddleware, mobileAuthController.me);

module.exports = router;
