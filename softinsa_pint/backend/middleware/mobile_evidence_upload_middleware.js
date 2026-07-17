const path = require('node:path');
const multer = require('multer');

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ['application/pdf', new Set(['.pdf'])],
  ['image/jpeg', new Set(['.jpg', '.jpeg'])],
  ['image/png', new Set(['.png'])],
  ['image/webp', new Set(['.webp'])]
]);

function sanitizeFileName(originalName) {
  const baseName = path.basename(String(originalName || 'evidence'));
  const normalized = baseName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(-120);
  return normalized || 'evidence';
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (req, file, callback) => {
    const extensions = ALLOWED_TYPES.get(file.mimetype);
    const extension = path.extname(path.basename(file.originalname || '')).toLowerCase();
    if (!extensions || !extensions.has(extension)) {
      const error = new Error('Tipo ou extensão de ficheiro não suportado.');
      error.statusCode = 415;
      error.code = 'UNSUPPORTED_FILE_TYPE';
      return callback(error);
    }
    return callback(null, true);
  }
});

function mobileEvidenceUploadMiddleware(req, res, next) {
  upload.single('ficheiro')(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'O ficheiro excede o limite de 10 MB.',
        code: 'FILE_TOO_LARGE'
      });
    }
    if (error?.statusCode === 415) {
      return res.status(415).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Não foi possível processar o multipart enviado.',
        code: 'INVALID_MULTIPART'
      });
    }
    if (req.file) req.file.safeOriginalName = sanitizeFileName(req.file.originalname);
    return next();
  });
}

module.exports = mobileEvidenceUploadMiddleware;
module.exports.MAX_FILE_SIZE = MAX_FILE_SIZE;
module.exports.ALLOWED_TYPES = ALLOWED_TYPES;
module.exports._sanitizeFileName = sanitizeFileName;

