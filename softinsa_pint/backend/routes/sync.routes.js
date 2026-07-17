const express = require('express');
const router = express.Router();
const multer = require('multer');

const syncController = require('../controllers/syncController');
const authMiddleware = require('../middleware/auth_middleware');

// Configuração do Multer para lidar com o upload de ficheiros
// Usamos memoryStorage por defeito, mas pode ser configurado para diskStorage se necessário
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite de 10MB para ficheiros pesados (PDFs/Imagens)
  }
});

// 1. Rota GET /api/sync/pull
// O telemóvel descarrega os deltas (dados novos/alterados/deletados)
router.get('/pull', authMiddleware, syncController.pull);

// 2. Rota POST /api/sync/push
// O telemóvel envia as alterações criadas offline em lote
router.post('/push', authMiddleware, syncController.push);

// 3. Rota POST /api/sync/upload
// O telemóvel faz o upload de ficheiros binários pesados associados a submissões
// Assume-se que o campo do ficheiro no FormData é 'ficheiro'
router.post('/upload', authMiddleware, upload.single('ficheiro'), syncController.upload);

module.exports = router;
