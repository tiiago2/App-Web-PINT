const mobileIdempotencyService = require('../services/mobile_idempotency_service');

const MAX_KEY_LENGTH = 128;

function validationError(message, code) {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = code;
  return error;
}

function readKey(req, multipart) {
  const headerPresent = Object.hasOwn(req.headers, 'idempotency-key');
  const headerValue = req.headers['idempotency-key'];
  let value;
  let source;

  if (headerPresent) {
    value = headerValue;
    source = 'header';
  } else if (!multipart) {
    value = req.body?.client_operation_id;
    source = 'body';
  }

  if (typeof value !== 'string') {
    throw validationError('Idempotency-Key obrigatória.', 'IDEMPOTENCY_KEY_REQUIRED');
  }
  if (!value || value.trim() !== value || value.length > MAX_KEY_LENGTH || /[\u0000-\u001f\u007f]/.test(value)) {
    throw validationError('Idempotency-Key inválida.', 'IDEMPOTENCY_KEY_INVALID');
  }
  return { value, source };
}

function bodyWithoutOperationId(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const normalized = { ...body };
  delete normalized.client_operation_id;
  return normalized;
}

function createMobileIdempotencyMiddleware(service = mobileIdempotencyService) {
  function respondValidationError(res, error) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }

  function requireKey({ multipart = false } = {}) {
    return (req, res, next) => {
      try {
        req.mobileIdempotencyKey = readKey(req, multipart);
        return next();
      } catch (error) {
        return respondValidationError(res, error);
      }
    };
  }

  function idempotent({ operationType, logicalRoute, multipart = false }) {
    return async (req, res, next) => {
      try {
        const key = req.mobileIdempotencyKey || readKey(req, multipart);
        const normalizedBody = bodyWithoutOperationId(req.body);
        req.body = normalizedBody;
        const requestHash = service.calculateRequestHash({
          method: req.method,
          logicalRoute,
          params: req.params,
          body: normalizedBody,
          file: multipart ? req.file : null
        });
        const reservation = await service.reserve({
          idUser: req.mobileAuth.id_utilizador,
          clientOperationId: key.value,
          operationType,
          requestHash
        });

        if (reservation.action === 'replay') {
          res.set('Idempotent-Replayed', 'true');
          return res.status(reservation.httpStatus).json(reservation.response);
        }

        const originalJson = res.json.bind(res);
        let finalizationStarted = false;
        res.json = function persistAndSend(payload) {
          if (finalizationStarted) return res;
          finalizationStarted = true;
          const httpStatus = res.statusCode;
          service.finish({
            operationId: reservation.operationId,
            httpStatus,
            response: payload
          }).then((safePayload) => {
            originalJson(safePayload);
          }).catch(() => {
            console.error('Falha ao finalizar uma operação mobile idempotente.');
            res.status(500);
            originalJson({ success: false, error: 'Erro interno de idempotência mobile.' });
          });
          return res;
        };

        req.mobileIdempotency = {
          clientOperationId: key.value,
          source: key.source,
          requestHash,
          operationId: reservation.operationId
        };
        return next();
      } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 409) {
          return res.status(error.statusCode).json({
            success: false,
            error: error.message,
            code: error.code
          });
        }
        console.error('Falha ao reservar uma operação mobile idempotente.');
        return res.status(500).json({
          success: false,
          error: 'Erro interno de idempotência mobile.'
        });
      }
    };
  }

  idempotent.requireKey = requireKey;
  return idempotent;
}

module.exports = createMobileIdempotencyMiddleware();
module.exports._createForTests = createMobileIdempotencyMiddleware;
module.exports._readKey = readKey;
module.exports.MAX_KEY_LENGTH = MAX_KEY_LENGTH;
