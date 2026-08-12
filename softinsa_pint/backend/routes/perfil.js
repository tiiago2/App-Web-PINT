const express = require('express');
const router = express.Router();
const multer = require('multer');
const perfilController = require('../controllers/perfil_controller');
const autenticarTokenMobile = require('../middleware/mobile_auth_middleware');

// Multer memory storage with 5MB file limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

// Safe wrapper for Multer error handling
router.put('/perfil/foto', autenticarTokenMobile, (req, res, next) => {
  upload.single('foto')(req, res, (err) => {
    if (err) {
      console.error('💥 Erro no upload Multipart/Multer:', err);
      
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'O ficheiro excede o tamanho limite permitido de 5MB.'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Ficheiro corrompido ou incompleto.'
      });
    }
    next();
  });
}, perfilController.atualizarFotoPerfil);

module.exports = router;
