const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/auth_middleware');
const autorizarAdmin = require('../middleware/autorizar_admin');
const controller = require('../controllers/utilizador_controller');

// Usar storage em memória para que o buffer seja processado diretamente
const upload = multer({ storage: multer.memoryStorage() });

// Todas as rotas exigem autenticação
router.use(authMiddleware);

router.get('/', controller.getUtilizadores);
router.get('/estatisticas', controller.getEstatisticas);
router.get('/roles', controller.getRoles);
router.post('/', authMiddleware, autorizarAdmin, upload.single('imagem'), controller.createUtilizador);
router.put('/:id/aceitar-rgpd', controller.aceitarRGPD);
router.put('/:id', upload.single('imagem'), controller.updateUtilizador);

module.exports = router;
