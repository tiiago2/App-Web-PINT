const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { beforeEach, test } = require('node:test');

const outboxRows = [];
const devices = [];
const sentMessages = [];
let nextId = 1;
let nowMs = Date.parse('2026-07-17T12:00:00.000Z');
let transactionQueue = Promise.resolve();
let sendImpl = async () => 'message-id';

function symbols(value) {
  return value && typeof value === 'object' ? Object.getOwnPropertySymbols(value) : [];
}

function matchesValue(actual, expected) {
  if (!expected || typeof expected !== 'object' || expected instanceof Date) {
    return actual === expected;
  }
  for (const symbol of symbols(expected)) {
    const operation = String(symbol);
    if (operation.includes('in') && !expected[symbol].includes(actual)) return false;
    if (operation.includes('lte') && new Date(actual).getTime() > new Date(expected[symbol]).getTime()) return false;
  }
  return true;
}

function matchesWhere(record, where) {
  return Object.entries(where || {}).every(([key, expected]) => matchesValue(record[key], expected));
}

function record(values) {
  const item = { ...values };
  Object.defineProperty(item, 'update', {
    enumerable: false,
    value: async (updates) => {
      Object.assign(item, updates);
      return item;
    }
  });
  Object.defineProperty(item, 'get', {
    enumerable: false,
    value: () => ({ ...item })
  });
  return item;
}

const fakeDb = {
  sequelize: {
    async transaction(callback) {
      let release;
      const previous = transactionQueue;
      transactionQueue = new Promise((resolve) => { release = resolve; });
      await previous;
      try {
        return await callback({ LOCK: { UPDATE: 'UPDATE' } });
      } finally {
        release();
      }
    }
  },
  MobilePushOutbox: {
    async findOne({ where }) {
      return outboxRows.find((item) => matchesWhere(item, where)) || null;
    },
    async create(values) {
      const item = record({ id_mobile_push: nextId++, ...values });
      outboxRows.push(item);
      return item;
    },
    async update(values, { where }) {
      let count = 0;
      for (const item of outboxRows.filter((row) => matchesWhere(row, where))) {
        Object.assign(item, values);
        count += 1;
      }
      return [count];
    }
  },
  MobileDevice: {
    async findAll({ where }) {
      return devices.filter((item) => matchesWhere(item, where)).map((item) => ({ ...item }));
    },
    async update(values, { where }) {
      let count = 0;
      for (const item of devices.filter((device) => matchesWhere(device, where))) {
        Object.assign(item, values);
        count += 1;
      }
      return [count];
    }
  }
};

const modelsPath = require.resolve('../models');
require.cache[modelsPath] = {
  id: modelsPath,
  filename: modelsPath,
  loaded: true,
  exports: fakeDb,
  children: [],
  paths: []
};

const firebaseModule = require('../services/firebase_admin_service');
const pushModule = require('../services/mobile_push_outbox_service');

function createService(options = {}) {
  return pushModule._createForTests({
    database: fakeDb,
    firebase: {
      getMessaging() {
        return {
          async send(message) {
            sentMessages.push(message);
            return sendImpl(message);
          }
        };
      }
    },
    clock: () => new Date(nowMs),
    ...options
  });
}

async function enqueue(service, entity = 'profile', userId = 7, version = '101') {
  return service.enqueueDataChanged({
    idUtilizador: userId,
    entity,
    version
  });
}

function addDevice(token, { userId = 7, active = true } = {}) {
  devices.push({
    id_mobile_device: devices.length + 1,
    id_utilizador: userId,
    fcm_token: token,
    ativo: active
  });
}

beforeEach(() => {
  outboxRows.length = 0;
  devices.length = 0;
  sentMessages.length = 0;
  nextId = 1;
  nowMs = Date.parse('2026-07-17T12:00:00.000Z');
  transactionQueue = Promise.resolve();
  sendImpl = async () => 'message-id';
});

test('1. Firebase Admin tem inicializacao unica e reutiliza a app', () => {
  let initializeCount = 0;
  const messaging = { send() {} };
  const admin = {
    apps: [],
    credential: { cert: () => ({ kind: 'cert' }), applicationDefault: () => ({ kind: 'default' }) },
    initializeApp() {
      initializeCount += 1;
      const app = { messaging: () => messaging };
      this.apps.push(app);
      return app;
    },
    app() { return this.apps[0]; }
  };
  const service = firebaseModule._createForTests({
    admin,
    env: { FIREBASE_SERVICE_ACCOUNT_JSON: '{"project_id":"test"}' },
    warn: () => {}
  });
  assert.equal(service.getMessaging(), messaging);
  assert.equal(service.getMessaging(), messaging);
  assert.equal(initializeCount, 1);
});

test('2. ausencia de credenciais e controlada sem inicializar Firebase', () => {
  let initializeCount = 0;
  const warnings = [];
  const service = firebaseModule._createForTests({
    admin: {
      apps: [],
      credential: {},
      initializeApp() { initializeCount += 1; }
    },
    env: {},
    warn: (code) => warnings.push(code)
  });
  assert.equal(service.isFirebaseAvailable(), false);
  assert.equal(service.isFirebaseAvailable(), false);
  assert.equal(initializeCount, 0);
  assert.deepEqual(warnings, ['credentials_not_configured']);
});

test('3. data_changed cria uma entrada persistivel na push outbox', async () => {
  const service = createService();
  await enqueue(service, 'profile', 7, '102');
  const sql = fs.readFileSync(path.join(__dirname, '../scripts/sql/20260717_mobile_push_outbox.sql'), 'utf8');
  assert.equal(outboxRows.length, 1);
  assert.equal(outboxRows[0].status, 'pending');
  assert.match(sql, /AFTER INSERT ON mobile_sync_changes/);
});

test('4. eventos pendentes do mesmo utilizador sao coalescidos', async () => {
  const service = createService();
  await enqueue(service, 'profile', 7, '103');
  await enqueue(service, 'objectives', 7, '104');
  assert.equal(outboxRows.length, 1);
  assert.equal(outboxRows[0].entity, 'multiple');
  assert.equal(outboxRows[0].payload_json.version, '104');
});

test('5. worker obtem apenas dispositivos ativos do utilizador', async () => {
  const service = createService();
  await enqueue(service);
  addDevice('active-token');
  addDevice('inactive-token', { active: false });
  addDevice('other-user-token', { userId: 8 });
  await service.processNext();
  assert.deepEqual(sentMessages.map((item) => item.token), ['active-token']);
});

test('6. mensagem enviada e estritamente data-only', async () => {
  const service = createService();
  await enqueue(service);
  addDevice('token');
  await service.processNext();
  assert.ok(sentMessages[0].data);
  assert.equal(Object.hasOwn(sentMessages[0], 'notification'), false);
});

test('7. todos os valores do payload data sao strings', async () => {
  const service = createService();
  await enqueue(service, 'objectives', 7, 12345);
  addDevice('token');
  await service.processNext();
  assert.ok(Object.values(sentMessages[0].data).every((value) => typeof value === 'string'));
});

test('8. sucesso para um dispositivo marca a entrada como sent', async () => {
  const service = createService();
  await enqueue(service);
  addDevice('one-token');
  const result = await service.processNext();
  assert.equal(result.status, 'sent');
  assert.equal(outboxRows[0].status, 'sent');
  assert.ok(outboxRows[0].sent_at instanceof Date);
});

test('9. sucesso para varios dispositivos envia uma vez por token ativo unico', async () => {
  const service = createService();
  await enqueue(service);
  addDevice('first-token');
  addDevice('second-token');
  addDevice('first-token');
  await service.processNext();
  assert.deepEqual(sentMessages.map((item) => item.token).sort(), ['first-token', 'second-token']);
});

test('10. utilizador sem dispositivos nao bloqueia e marca o aviso como sent', async () => {
  const service = createService();
  await enqueue(service);
  const result = await service.processNext();
  assert.equal(result.status, 'sent');
  assert.equal(sentMessages.length, 0);
});

test('11. token invalido e classificado como erro permanente', async () => {
  const service = createService();
  await enqueue(service);
  addDevice('invalid-token');
  sendImpl = async () => {
    const error = new Error('invalid FCM token');
    error.code = 'messaging/invalid-argument';
    throw error;
  };
  const result = await service.processNext();
  assert.equal(result.status, 'permanent_error');
  assert.equal(outboxRows[0].last_error_code, 'messaging/invalid-argument');
});

test('12. token nao registado e tratado como permanente', async () => {
  const service = createService();
  await enqueue(service);
  addDevice('unregistered-token');
  sendImpl = async () => {
    const error = new Error('not registered');
    error.code = 'messaging/registration-token-not-registered';
    throw error;
  };
  const result = await service.processNext();
  assert.equal(result.status, 'permanent_error');
});

test('13. erro temporario fica em retryable_error', async () => {
  const service = createService();
  await enqueue(service);
  addDevice('token');
  sendImpl = async () => {
    const error = new Error('unavailable');
    error.code = 'messaging/server-unavailable';
    throw error;
  };
  const result = await service.processNext();
  assert.equal(result.status, 'retryable_error');
  assert.equal(outboxRows[0].status, 'retryable_error');
});

test('14. backoff segue 1 minuto, 5 minutos, 15 minutos e 1 hora', async () => {
  const expectedSeconds = [60, 300, 900, 3600];
  for (let index = 0; index < expectedSeconds.length; index += 1) {
    outboxRows.length = 0;
    sentMessages.length = 0;
    const service = createService();
    await enqueue(service);
    outboxRows[0].attempts = index;
    addDevice(`token-${index}`);
    sendImpl = async () => {
      const error = new Error('timeout');
      error.code = 'ETIMEDOUT';
      throw error;
    };
    await service.processNext();
    assert.equal(
      outboxRows[0].next_attempt_at.getTime() - nowMs,
      expectedSeconds[index] * 1000
    );
    devices.length = 0;
  }
});

test('15. maximo de cinco tentativas termina em permanent_error', async () => {
  const service = createService();
  await enqueue(service);
  outboxRows[0].attempts = 4;
  addDevice('token');
  sendImpl = async () => {
    const error = new Error('timeout');
    error.code = 'ETIMEDOUT';
    throw error;
  };
  await service.processNext();
  assert.equal(outboxRows[0].attempts, 5);
  assert.equal(outboxRows[0].status, 'permanent_error');
  assert.equal(outboxRows[0].last_error_code, 'max_attempts_exceeded');
});

test('16. erro permanente de payload nao e repetido', async () => {
  const service = createService();
  await enqueue(service);
  addDevice('token');
  sendImpl = async () => {
    const error = new Error('payload');
    error.code = 'messaging/invalid-argument';
    throw error;
  };
  await service.processNext();
  assert.equal(outboxRows[0].status, 'permanent_error');
  assert.equal(outboxRows[0].next_attempt_at.getTime(), nowMs);
});

test('17. dispositivo com token invalido e desativado sem ser apagado', async () => {
  const service = createService();
  await enqueue(service);
  addDevice('dead-token');
  sendImpl = async () => {
    const error = new Error('gone');
    error.code = 'messaging/registration-token-not-registered';
    throw error;
  };
  await service.processNext();
  assert.equal(devices.length, 1);
  assert.equal(devices[0].ativo, false);
});

test('18. lock concorrente impede processar duas vezes a mesma mensagem', async () => {
  const service = createService();
  await enqueue(service);
  addDevice('token');
  const results = await Promise.all([service.processNext(), service.processNext()]);
  assert.equal(results.filter((item) => item.claimed).length, 1);
  assert.equal(sentMessages.length, 1);
});

test('19. falha da outbox nao reverte a operacao de negocio', () => {
  const sql = fs.readFileSync(path.join(__dirname, '../scripts/sql/20260717_mobile_push_outbox.sql'), 'utf8');
  const facade = fs.readFileSync(path.join(__dirname, '../services/sync_push_service.js'), 'utf8');
  assert.match(sql, /EXCEPTION WHEN OTHERS[\s\S]*RETURN NEW/);
  assert.match(facade, /setImmediate/);
  assert.match(facade, /catch \(_\)/);
});

test('20. outbox e push nao incluem dados pessoais ou segredos', async () => {
  const service = createService();
  await enqueue(service, 'profile', 7, 'private-version');
  addDevice('token');
  await service.processNext();
  const serialized = JSON.stringify({ outbox: outboxRows[0].payload_json, data: sentMessages[0].data });
  assert.doesNotMatch(serialized, /nome|email|password|refresh|service.account|private.key/i);
  assert.deepEqual(Object.keys(sentMessages[0].data).sort(), ['entity', 'type', 'version']);
});

test('21. auth, devices, sync e idempotencia mantem os contratos', () => {
  const central = fs.readFileSync(path.join(__dirname, '../routes/mobile_sync_routes.js'), 'utf8');
  assert.match(central, /router\.use\('\/auth', mobileAuthRoutes\)/);
  assert.match(central, /router\.use\('\/devices', mobileDeviceRoutes\)/);
  assert.match(central, /router\.get\('\/sync', mobileAuthMiddleware, mobileSyncController\.sincronizar\)/);
});

test('22. rotas e controllers web permanecem sem dependencia da push outbox', () => {
  const webRoutes = fs.readFileSync(path.join(__dirname, '../routes/me_routes.js'), 'utf8');
  const deviceController = fs.readFileSync(path.join(__dirname, '../controllers/mobile_devices_controller.js'), 'utf8');
  const server = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
  assert.doesNotMatch(webRoutes, /mobile_push_outbox/);
  assert.doesNotMatch(deviceController, /mobile_push_outbox/);
  assert.match(server, /app\.use\(["']\/api["'], rotas\)/);
});
