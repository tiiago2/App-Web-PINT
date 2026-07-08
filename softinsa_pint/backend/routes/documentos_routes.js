const express = require('express');
const router = express.Router();
const documentosController = require('../controllers/documentos_controller');
const authMiddleware = require('../middleware/auth_middleware');

// Adicionei authMiddleware para garantir que apenas pessoas com login conseguem aceder
router.get('/:id/download', authMiddleware, documentosController.downloadDocumento);

module.exports = router;
