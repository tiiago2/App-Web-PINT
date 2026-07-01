const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('../controllers/utilizador_controller');

// Usar storage em memória para que o buffer seja processado diretamente
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', controller.getUtilizadores);
router.put('/:id', upload.single('imagem'), controller.updateUtilizador);

module.exports = router;
