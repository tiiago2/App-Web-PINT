const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/auth_middleware');
const controller = require('../controllers/me_badges_controller');
const mobileDevicesController = require('../controllers/mobile_devices_controller');

const upload = multer({ storage: multer.memoryStorage() });

function uploadEvidencia(req, res, next) {
    upload.single('ficheiro')(req, res, (error) => {
        if (error) {
            return res.status(400).json({
                error: 'Erro ao processar o ficheiro enviado.',
                codigo: 'multipart_invalido'
            });
        }

        return next();
    });
}

router.get('/badges', authMiddleware, controller.listarMeusBadges);
router.get('/badges/sugeridos', authMiddleware, controller.listarSugestoesBadges);
router.post('/badges/:id/rascunho', authMiddleware, controller.criarOuObterRascunho);
router.post('/badges/:id/submeter', authMiddleware, controller.submeterMinhaCandidatura);
router.put('/badges/:id/evidencias/:idRequisito', authMiddleware, uploadEvidencia, controller.guardarEvidenciaRascunho);
router.delete('/badges/:id/evidencias/:idRequisito', authMiddleware, controller.removerEvidenciaRascunho);
router.get('/badges/:id', authMiddleware, controller.obterMeuBadge);
router.put('/devices', authMiddleware, mobileDevicesController.registerDevice);
router.delete('/devices/:deviceId', authMiddleware, mobileDevicesController.deactivateDevice);

module.exports = router;
