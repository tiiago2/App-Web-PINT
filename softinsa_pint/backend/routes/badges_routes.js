const express = require('express');
const router = express.Router();
const multer = require('multer');
const badgesController = require('../controllers/badges_controller');
const authMiddleware = require('../middleware/auth_middleware');
const autorizarAdmin = require('../middleware/autorizar_admin');

const TIPOS_IMAGEM_PERMITIDOS = new Set([
  'image/png',
  'image/jpeg',
  'image/webp'
]);

const uploadImagem = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!TIPOS_IMAGEM_PERMITIDOS.has(file.mimetype)) {
      const erro = new Error('Formato de imagem invalido.');
      erro.codigo = 'formato_imagem_invalido';
      return cb(erro);
    }

    return cb(null, true);
  }
});

function processarUploadImagemBadge(req, res, next) {
  uploadImagem.single('imagem')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        erro: 'A imagem excede o limite maximo de 5 MB.',
        codigo: 'imagem_demasiado_grande'
      });
    }

    if (error.codigo === 'formato_imagem_invalido') {
      return res.status(400).json({
        erro: 'Formato de imagem invalido. Utilize PNG, JPEG ou WEBP.',
        codigo: 'formato_imagem_invalido'
      });
    }

    return res.status(400).json({
      erro: 'Erro ao processar a imagem enviada.',
      codigo: 'multipart_invalido'
    });
  });
}

router.get('/public/:id', badgesController.obterBadgePublico);
router.get('/requisitos/todos', authMiddleware, badgesController.obterTodosRequisitos);
router.get('/', authMiddleware, badgesController.listarBadgesCatalogo);
router.get('/:id', authMiddleware, badgesController.obterBadgeDetalhe);

router.post(
  '/',
  authMiddleware,
  autorizarAdmin,
  processarUploadImagemBadge,
  badgesController.criarBadgeAdmin
);

router.put(
  '/:id',
  authMiddleware,
  autorizarAdmin,
  processarUploadImagemBadge,
  badgesController.atualizarBadgeAdmin
);

router.delete(
  '/:id',
  authMiddleware,
  autorizarAdmin,
  badgesController.removerBadgeAdmin
);

module.exports = router;
