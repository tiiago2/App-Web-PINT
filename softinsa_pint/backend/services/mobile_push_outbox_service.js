const { Op } = require('sequelize');
const db = require('../models');
const firebaseAdminService = require('./firebase_admin_service');
const { MOBILE_SYNC_CONTRACT_VERSION } = require('../config/mobile_sync_contract');

const EVENT_TYPE = 'data_changed';
const MAX_ATTEMPTS = 5;
const DEFAULT_BATCH_SIZE = 50;
const BACKOFF_SECONDS = [60, 300, 900, 3600];
const PROCESSING_TIMEOUT_MS = 15 * 60 * 1000;

const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token'
]);

const RETRYABLE_CODES = new Set([
  'messaging/internal-error',
  'messaging/server-unavailable',
  'messaging/unknown-error',
  'messaging/quota-exceeded',
  'app/network-error',
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED'
]);

const PERMANENT_CODES = new Set([
  'messaging/invalid-argument',
  'messaging/mismatched-credential',
  'messaging/third-party-auth-error',
  'messaging/authentication-error'
]);

function positiveInteger(value) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function safeString(value, fallback, maxLength) {
  const text = String(value ?? '').trim();
  return (text || fallback).slice(0, maxLength);
}

function errorCode(error) {
  const code = safeString(error?.code, 'firebase_send_failed', 128);
  const status = Number(error?.httpStatus || error?.status || error?.statusCode);
  if (status === 429) return 'firebase_http_429';
  if (status >= 500 && status <= 599) return `firebase_http_${status}`;
  return code;
}

function classifyError(error) {
  const code = errorCode(error);
  if (INVALID_TOKEN_CODES.has(code)) return { kind: 'invalid_token', code };
  if (
    code === 'messaging/invalid-argument'
    && /registration token|fcm token/i.test(String(error?.message || ''))
  ) {
    return { kind: 'invalid_token', code };
  }
  if (RETRYABLE_CODES.has(code) || /^firebase_http_(429|5\d\d)$/.test(code)) {
    return { kind: 'retryable', code };
  }
  if (PERMANENT_CODES.has(code)) return { kind: 'permanent', code };
  return { kind: 'retryable', code };
}

function plain(record) {
  if (!record) return null;
  return typeof record.get === 'function' ? record.get({ plain: true }) : { ...record };
}

function createMobilePushOutboxService({
  database = db,
  firebase = firebaseAdminService,
  clock = () => new Date(),
  maxAttempts = MAX_ATTEMPTS,
  batchSize = DEFAULT_BATCH_SIZE
} = {}) {
  function buildPayload(entity, version) {
    return {
      type: EVENT_TYPE,
      entity: safeString(entity, 'multiple', 64),
      version: safeString(version, MOBILE_SYNC_CONTRACT_VERSION, 128)
    };
  }

  async function enqueueDataChanged({ idUtilizador, entity, version }) {
    const userId = positiveInteger(idUtilizador);
    if (!userId) throw new TypeError('invalid_user_id');

    return database.sequelize.transaction(async (transaction) => {
      const now = clock();
      const existing = await database.MobilePushOutbox.findOne({
        where: {
          id_utilizador: userId,
          event_type: EVENT_TYPE,
          status: { [Op.in]: ['pending', 'retryable_error'] }
        },
        order: [['id_mobile_push', 'ASC']],
        lock: transaction.LOCK?.UPDATE,
        transaction
      });

      const incomingEntity = safeString(entity, 'multiple', 64);
      const coalescedEntity = existing
        && existing.entity !== incomingEntity
        && existing.entity !== 'multiple'
        ? 'multiple'
        : (existing?.entity || incomingEntity);
      const values = {
        entity: coalescedEntity,
        payload_json: buildPayload(coalescedEntity, version),
        status: 'pending',
        attempts: 0,
        next_attempt_at: now,
        last_error_code: null,
        sent_at: null,
        updated_at: now
      };

      if (existing) {
        await existing.update(values, { transaction });
        return plain(existing);
      }

      const created = await database.MobilePushOutbox.create({
        id_utilizador: userId,
        event_type: EVENT_TYPE,
        created_at: now,
        ...values
      }, { transaction });
      return plain(created);
    });
  }

  async function claimNext() {
    return database.sequelize.transaction(async (transaction) => {
      const now = clock();
      const item = await database.MobilePushOutbox.findOne({
        where: {
          status: { [Op.in]: ['pending', 'retryable_error'] },
          next_attempt_at: { [Op.lte]: now }
        },
        order: [['next_attempt_at', 'ASC'], ['id_mobile_push', 'ASC']],
        lock: transaction.LOCK?.UPDATE,
        skipLocked: true,
        transaction
      });
      if (!item) return null;

      const attempts = Number(item.attempts || 0) + 1;
      await item.update({
        status: 'processing',
        attempts,
        updated_at: now,
        last_error_code: null
      }, { transaction });
      return plain(item);
    });
  }

  async function updateItem(id, values) {
    await database.MobilePushOutbox.update(
      { ...values, updated_at: clock() },
      { where: { id_mobile_push: id, status: 'processing' } }
    );
  }

  async function markSent(item) {
    const now = clock();
    await updateItem(item.id_mobile_push, {
      status: 'sent',
      sent_at: now,
      next_attempt_at: now,
      last_error_code: null
    });
    return 'sent';
  }

  async function markPermanent(item, code) {
    await updateItem(item.id_mobile_push, {
      status: 'permanent_error',
      sent_at: null,
      next_attempt_at: clock(),
      last_error_code: safeString(code, 'permanent_error', 128)
    });
    return 'permanent_error';
  }

  async function markRetryable(item, code) {
    if (Number(item.attempts) >= maxAttempts) {
      return markPermanent(item, 'max_attempts_exceeded');
    }
    const delayIndex = Math.min(Math.max(Number(item.attempts) - 1, 0), BACKOFF_SECONDS.length - 1);
    const nextAttempt = new Date(clock().getTime() + BACKOFF_SECONDS[delayIndex] * 1000);
    await updateItem(item.id_mobile_push, {
      status: 'retryable_error',
      sent_at: null,
      next_attempt_at: nextAttempt,
      last_error_code: safeString(code, 'retryable_error', 128)
    });
    return 'retryable_error';
  }

  async function deactivateInvalidTokens(userId, tokens) {
    const uniqueTokens = [...new Set(tokens.filter(Boolean))];
    if (uniqueTokens.length === 0) return 0;
    const [count] = await database.MobileDevice.update(
      { ativo: false, updated_at: clock() },
      {
        where: {
          id_utilizador: userId,
          fcm_token: { [Op.in]: uniqueTokens },
          ativo: true
        }
      }
    );
    return count;
  }

  function fcmMessage(token, payload) {
    return {
      token,
      data: {
        type: String(payload.type),
        entity: String(payload.entity),
        version: String(payload.version)
      },
      android: { priority: 'high' },
      apns: {
        headers: {
          'apns-push-type': 'background',
          'apns-priority': '5'
        },
        payload: { aps: { contentAvailable: true } }
      }
    };
  }

  async function processClaimed(item) {
    const devices = await database.MobileDevice.findAll({
      where: { id_utilizador: item.id_utilizador, ativo: true },
      attributes: ['id_mobile_device', 'id_utilizador', 'fcm_token'],
      raw: true
    });
    if (devices.length === 0) return markSent(item);

    const tokens = [...new Set(devices
      .map((device) => String(device.fcm_token || '').trim())
      .filter(Boolean))];
    if (tokens.length === 0) return markPermanent(item, 'device_token_missing');

    const messaging = firebase.getMessaging();
    if (!messaging) return markRetryable(item, 'firebase_unavailable');

    const payload = buildPayload(
      item.payload_json?.entity || item.entity,
      item.payload_json?.version
    );
    const results = await Promise.all(tokens.map(async (token) => {
      try {
        await messaging.send(fcmMessage(token, payload));
        return { success: true, token };
      } catch (error) {
        return { success: false, token, ...classifyError(error) };
      }
    }));

    const invalidTokens = results
      .filter((result) => !result.success && result.kind === 'invalid_token')
      .map((result) => result.token);
    if (invalidTokens.length > 0) {
      await deactivateInvalidTokens(item.id_utilizador, invalidTokens);
    }

    const retryable = results.find((result) => !result.success && result.kind === 'retryable');
    if (retryable) return markRetryable(item, retryable.code);

    const successes = results.filter((result) => result.success).length;
    if (successes > 0) return markSent(item);

    const permanent = results.find((result) => !result.success);
    return markPermanent(item, permanent?.code || 'firebase_send_failed');
  }

  async function processNext() {
    const item = await claimNext();
    if (!item) return { claimed: false, status: null };
    try {
      const status = await processClaimed(item);
      return { claimed: true, status, id: item.id_mobile_push };
    } catch (error) {
      const classified = classifyError(error);
      const status = classified.kind === 'retryable'
        ? await markRetryable(item, classified.code)
        : await markPermanent(item, classified.code);
      return { claimed: true, status, id: item.id_mobile_push };
    }
  }

  async function recoverStaleProcessing() {
    const now = clock();
    const cutoff = new Date(now.getTime() - PROCESSING_TIMEOUT_MS);
    const [recovered] = await database.MobilePushOutbox.update({
      status: 'retryable_error',
      next_attempt_at: now,
      last_error_code: 'worker_lease_expired',
      updated_at: now
    }, {
      where: {
        status: 'processing',
        updated_at: { [Op.lte]: cutoff }
      }
    });
    return recovered;
  }

  async function processBatch() {
    const summary = { claimed: 0, sent: 0, retryable_error: 0, permanent_error: 0 };
    await recoverStaleProcessing();
    for (let index = 0; index < batchSize; index += 1) {
      const result = await processNext();
      if (!result.claimed) break;
      summary.claimed += 1;
      summary[result.status] += 1;
    }
    return summary;
  }

  return {
    buildPayload,
    enqueueDataChanged,
    processBatch,
    processNext,
    recoverStaleProcessing,
    _claimNext: claimNext,
    _fcmMessage: fcmMessage
  };
}

const service = createMobilePushOutboxService();

module.exports = {
  ...service,
  _createForTests: createMobilePushOutboxService,
  BACKOFF_SECONDS,
  MAX_ATTEMPTS
};
