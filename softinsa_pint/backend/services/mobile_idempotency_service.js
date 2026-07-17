const crypto = require('node:crypto');
const dbDefault = require('../models');
const { Op: opDefault } = require('sequelize');

const STATUS = Object.freeze({
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED_RETRYABLE: 'failed_retryable',
  FAILED_PERMANENT: 'failed_permanent'
});
const SENSITIVE_KEYS = new Set([
  'access_token',
  'refresh_token',
  'password',
  'token_hash',
  'fcm_token'
]);

function httpError(statusCode, message, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value)) {
    return Object.keys(value).sort().reduce((result, key) => {
      if (value[key] !== undefined) result[key] = stableValue(value[key]);
      return result;
    }, {});
  }
  if (value instanceof Date) return value.toISOString();
  return value;
}

function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

function sanitizeResponse(value) {
  if (Array.isArray(value)) return value.map(sanitizeResponse);
  if (!value || typeof value !== 'object') return value;
  return Object.entries(value).reduce((result, [key, item]) => {
    if (!SENSITIVE_KEYS.has(key.toLowerCase())) result[key] = sanitizeResponse(item);
    return result;
  }, {});
}

function createMobileIdempotencyService({
  db = dbDefault,
  Op = opDefault,
  now = () => new Date(),
  ttlDays = 30
} = {}) {
  const expiresAt = () => new Date(now().getTime() + ttlDays * 24 * 60 * 60 * 1000);

  function calculateRequestHash({ method, logicalRoute, params, body, file }) {
    const normalized = {
      method: String(method || '').toUpperCase(),
      route: logicalRoute,
      params: stableValue(params || {}),
      body: stableValue(body || {})
    };
    if (file) {
      normalized.file = {
        name: file.safeOriginalName,
        mimetype: file.mimetype,
        size: file.size,
        sha256: crypto.createHash('sha256').update(file.buffer).digest('hex')
      };
    }
    return crypto.createHash('sha256').update(stableStringify(normalized), 'utf8').digest('hex');
  }

  async function readWithLock({ idUser, clientOperationId, transaction }) {
    return db.MobileOperation.findOne({
      where: {
        id_utilizador: idUser,
        client_operation_id: clientOperationId
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
  }

  async function reserveOnce({ idUser, clientOperationId, operationType, requestHash }) {
    return db.sequelize.transaction(async (transaction) => {
      const existing = await readWithLock({ idUser, clientOperationId, transaction });
      if (!existing) {
        const timestamp = now();
        const created = await db.MobileOperation.create({
          id_utilizador: idUser,
          client_operation_id: clientOperationId,
          operation_type: operationType,
          request_hash: requestHash,
          status: STATUS.PROCESSING,
          http_status: null,
          response_json: null,
          error_code: null,
          started_at: timestamp,
          completed_at: null,
          expires_at: expiresAt(),
          created_at: timestamp,
          updated_at: timestamp
        }, { transaction });
        return { action: 'execute', operationId: created.id_mobile_operation };
      }

      if (existing.operation_type !== operationType || existing.request_hash !== requestHash) {
        throw httpError(
          409,
          'A Idempotency-Key já foi utilizada com uma operação ou payload diferente.',
          'IDEMPOTENCY_KEY_CONFLICT'
        );
      }

      if (existing.status === STATUS.COMPLETED || existing.status === STATUS.FAILED_PERMANENT) {
        return {
          action: 'replay',
          httpStatus: existing.http_status,
          response: existing.response_json
        };
      }

      if (existing.status === STATUS.PROCESSING) {
        throw httpError(
          409,
          'A operação com esta Idempotency-Key ainda está em processamento.',
          'IDEMPOTENCY_OPERATION_PROCESSING'
        );
      }

      if (existing.status === STATUS.FAILED_RETRYABLE) {
        const timestamp = now();
        await existing.update({
          status: STATUS.PROCESSING,
          http_status: null,
          response_json: null,
          error_code: null,
          started_at: timestamp,
          completed_at: null,
          expires_at: expiresAt(),
          updated_at: timestamp
        }, { transaction });
        return { action: 'execute', operationId: existing.id_mobile_operation };
      }

      throw httpError(409, 'Estado idempotente inválido.', 'IDEMPOTENCY_INVALID_STATE');
    });
  }

  async function reserve(input) {
    try {
      return await reserveOnce(input);
    } catch (error) {
      if (error?.name !== 'SequelizeUniqueConstraintError') throw error;
      return reserveOnce(input);
    }
  }

  async function finish({ operationId, httpStatus, response }) {
    const safeResponse = sanitizeResponse(response);
    const permanent = httpStatus >= 400 && httpStatus < 500;
    const success = httpStatus < 400;
    const status = success
      ? STATUS.COMPLETED
      : permanent ? STATUS.FAILED_PERMANENT : STATUS.FAILED_RETRYABLE;
    const timestamp = now();

    await db.sequelize.transaction(async (transaction) => {
      const operation = await db.MobileOperation.findByPk(operationId, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!operation || operation.status !== STATUS.PROCESSING) {
        throw httpError(409, 'Não foi possível concluir o registo idempotente.', 'IDEMPOTENCY_FINALIZATION_CONFLICT');
      }
      await operation.update({
        status,
        http_status: httpStatus,
        response_json: safeResponse,
        error_code: safeResponse?.code || null,
        completed_at: timestamp,
        updated_at: timestamp
      }, { transaction });
    });
    return safeResponse;
  }

  async function cleanupExpired() {
    return db.MobileOperation.destroy({
      where: {
        expires_at: { [Op.lt]: now() },
        status: {
          [Op.in]: [STATUS.COMPLETED, STATUS.FAILED_PERMANENT, STATUS.FAILED_RETRYABLE]
        }
      }
    });
  }

  return {
    calculateRequestHash,
    reserve,
    finish,
    cleanupExpired,
    sanitizeResponse
  };
}

module.exports = createMobileIdempotencyService();
module.exports._createForTests = createMobileIdempotencyService;
module.exports.STATUS = STATUS;
module.exports._stableStringify = stableStringify;

