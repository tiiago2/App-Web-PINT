const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { beforeEach, test } = require('node:test');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

let deviceCreated;
let deviceUpdateWhere;
const sharedDb = {
  sequelize: {
    async transaction(options, callback) {
      const handler = typeof options === 'function' ? options : callback;
      return handler({ LOCK: { UPDATE: 'UPDATE' } });
    }
  },
  MobileDevice: {
    async update(values, options) {
      deviceUpdateWhere = options.where;
      return [1];
    },
    async findOne() { return null; },
    async create(values) {
      deviceCreated = { ...values };
      return deviceCreated;
    }
  }
};

function inject(modulePath, exports) {
  require.cache[modulePath] = {
    id: modulePath,
    filename: modulePath,
    loaded: true,
    exports,
    children: [],
    paths: []
  };
}

inject(require.resolve('../models'), sharedDb);
inject(require.resolve('../services/mobile_evidence_storage_service'), {
  async upload() { throw new Error('real_storage_disabled_in_tests'); },
  async remove() {}
});

const healthController = require('../controllers/mobile_health_controller');
const authControllerModule = require('../controllers/mobile_auth_controller');
const authServiceModule = require('../services/mobile_auth_service');
const deviceController = require('../controllers/mobile_devices_controller');
const syncControllerModule = require('../controllers/mobile_sync_controller');
const submissionServiceModule = require('../services/mobile_submission_service');
const idempotencyServiceModule = require('../services/mobile_idempotency_service');
const pushServiceModule = require('../services/mobile_push_outbox_service');

function responseMock() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    set(name, value) { this.headers[name] = value; return this; },
    json(body) { this.body = body; return this; }
  };
}

function emptySyncData() {
  return {
    perfil: null,
    permissoes: [],
    learning_paths: [],
    service_lines: [],
    areas: [],
    areas_service_lines: [],
    niveis: [],
    badges: [],
    user_badges: [],
    requisitos: [],
    requisitos_badges: { upserts: [], deleted: [] },
    registos_badges: [],
    submissoes: [],
    historico: [],
    documentos: [],
    objetivos: [],
    notificacoes: { upserts: [], deleted: [] },
    recetores_notificacoes: [],
    assinatura: null,
    badges_assinatura: [],
    outros_users: []
  };
}

const syncTime = new Date('2026-07-17T15:00:00.000Z');

beforeEach(() => {
  deviceCreated = null;
  deviceUpdateWhere = null;
});

test('1. health está funcional e o namespace mobile está montado uma única vez', () => {
  const response = responseMock();
  healthController.health({}, response);
  const central = read('routes/central_rotas.js');
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { success: true, service: 'mobile-api', status: 'ok' });
  assert.equal((central.match(/router\.use\(['"]\/mobile['"]/g) || []).length, 1);
});

test('2. login mantém o contrato de access e refresh token', async () => {
  const controller = authControllerModule._criarParaTestes({
    async login(input) {
      assert.deepEqual(input, { email: 'user@example.com', password: 'secret', deviceId: 'phone-1' });
      return {
        accessToken: 'access', refreshToken: 'refresh', expiresIn: 900,
        user: { id: 7, nome: 'User', email: 'user@example.com' }
      };
    }
  });
  const response = responseMock();
  await controller.login({ body: { email: 'user@example.com', password: 'secret', device_id: 'phone-1' } }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.access_token, 'access');
  assert.equal(response.body.refresh_token, 'refresh');
});

test('3. refresh devolve rotação no contrato público', async () => {
  const controller = authControllerModule._criarParaTestes({
    async refresh() { return { accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 900 }; }
  });
  const response = responseMock();
  await controller.refresh({ body: { refresh_token: 'old-refresh', device_id: 'phone-1' } }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.access_token, 'new-access');
  assert.equal(response.body.refresh_token, 'new-refresh');
});

test('4. logout mantém resposta idempotente sem devolver token', async () => {
  const controller = authControllerModule._criarParaTestes({ async logout() {} });
  const response = responseMock();
  await controller.logout({ body: { refresh_token: 'refresh', device_id: 'phone-1' } }, response);
  assert.deepEqual(response.body, { success: true });
  assert.doesNotMatch(JSON.stringify(response.body), /token/i);
});

test('5. /me devolve apenas o utilizador preparado pelo middleware mobile', () => {
  const controller = authControllerModule._criarParaTestes({});
  const response = responseMock();
  controller.me({ mobileUser: { id: 7, nome: 'User', email: 'user@example.com', area_id: 2 } }, response);
  assert.equal(response.body.user.id, 7);
  assert.equal(Object.hasOwn(response.body.user, 'password'), false);
});

test('6. registo de device usa a identidade autenticada e não o body', async () => {
  const response = responseMock();
  await deviceController.registerDevice({
    utilizadorLogado: { id_utilizador: 7 },
    body: { token: 'fcm', device_id: 'phone-1', platform: 'Android', id_utilizador: 999 }
  }, response);
  assert.equal(response.statusCode, 201);
  assert.equal(deviceCreated.id_utilizador, 7);
  assert.equal(deviceCreated.platform, 'android');
});

test('7. desativação de device fica limitada ao utilizador autenticado', async () => {
  const response = responseMock();
  await deviceController.deactivateDevice({
    utilizadorLogado: { id_utilizador: 7 }, params: { deviceId: 'phone-1' }
  }, response);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(deviceUpdateWhere, { id_utilizador: 7, device_id: 'phone-1' });
});

test('8. sync completo devolve contrato versão 3', async () => {
  const controller = syncControllerModule._criarParaTestes({
    async sincronizarMobile() {
      return { data: emptySyncData(), syncUntil: syncTime, nextCursor: { changedAt: syncTime, changeId: 10 } };
    }
  });
  const response = responseMock();
  await controller.sincronizar({ query: {}, mobileAuth: { id_utilizador: 7 } }, response);
  assert.equal(response.body.mode, 'full');
  assert.equal(response.body.contract_version, '3');
});

test('9. sync incremental converte since para Date válida', async () => {
  let received;
  const controller = syncControllerModule._criarParaTestes({
    async sincronizarMobile(input) {
      received = input;
      return { data: emptySyncData(), syncUntil: syncTime, nextCursor: null };
    }
  });
  const response = responseMock();
  await controller.sincronizar({
    query: { since: '2026-07-17T14:00:00.000Z' }, mobileAuth: { id_utilizador: 7 }
  }, response);
  assert.equal(response.body.mode, 'incremental');
  assert.ok(received.since instanceof Date);
});

test('10. sync por cursor composto encaminha timestamp e change id', async () => {
  let received;
  const controller = syncControllerModule._criarParaTestes({
    async sincronizarMobile(input) {
      received = input;
      return { data: emptySyncData(), syncUntil: syncTime, nextCursor: input.cursor };
    }
  });
  const response = responseMock();
  await controller.sincronizar({
    query: { cursorTimestamp: '2026-07-17T14:00:00.000Z', cursorChangeId: '12' },
    mobileAuth: { id_utilizador: 7 }
  }, response);
  assert.equal(response.body.mode, 'cursor');
  assert.equal(received.cursor.changeId, 12);
});

test('11. paginação respeita limit e has_more', async () => {
  let received;
  const controller = syncControllerModule._criarParaTestes({
    async sincronizarMobile(input) {
      received = input;
      return { data: emptySyncData(), syncUntil: syncTime, nextCursor: input.cursor, hasMore: true };
    }
  });
  const response = responseMock();
  await controller.sincronizar({
    query: { cursorTimestamp: '2026-07-17T14:00:00.000Z', cursorChangeId: '12', limit: '25' },
    mobileAuth: { id_utilizador: 7 }
  }, response);
  assert.equal(received.limit, 25);
  assert.equal(response.body.has_more, true);
});

test('12. tombstones são projetados sem conteúdo completo da entidade', () => {
  const data = emptySyncData();
  data.objetivos = [{ id_objetivo: 4, deleted_objetivo: true, data_conclusao: syncTime }];
  const deleted = syncControllerModule._construirDeleted(data, [{
    entity: 'signature_badges', record_id: '3:8', changed_at: syncTime,
    metadata: { id_assinatura: 3, id_badge: 8 }
  }]);
  assert.deepEqual(deleted.objectives[0], { id_objetivo: 4, data_eliminacao: syncTime });
  assert.equal(deleted.signature_badges[0].id_badge, 8);
});

test('13. change log, triggers e índices de cursor estão definidos', () => {
  const sql = read('scripts/sql/20260716_mobile_sync_changes.sql');
  const service = read('services/mobile_sync_change_service.js');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS mobile_sync_changes/);
  assert.match(sql, /CREATE TRIGGER trg_mobile_sync_objectives/);
  assert.match(sql, /changed_at, change_id/);
  assert.match(service, /\[Op\.gt\]: cursor\.changedAt/);
});

// Testes 14 a 18 de mutações clássicas/REST individuais foram removidos pois foram consolidados na arquitetura offline-first.

test('19. upload de evidência usa storage mock e valida assinatura binária', async () => {
  let uploads = 0;
  const submission = { id_submissao: 9, id_badge: 2, id_utilizador: 7, status: 'em_progresso' };
  const evidenceDb = {
    sequelize: sharedDb.sequelize,
    Submissoes: { async findOne() { return submission; } },
    Badges: { async findOne() { return { id_badge: 2, deleted_badge: false }; } },
    Requisitos: { async findOne() { return { id_requisito: 3 }; } },
    RequisitosBadge: { async findOne() { return { id_badge: 2, id_requisito: 3 }; } },
    Permissoes: { async findOne() { return null; } },
    Documentos: {
      async findAll() { return []; },
      async update() { return [0]; },
      async create(values) { return { id_ficheiro: 5, ...values }; }
    }
  };
  const service = submissionServiceModule._createForTests({
    db: evidenceDb,
    storage: {
      async upload() { uploads += 1; return { url: 'https://storage.test/evidence.pdf', publicId: 'mock' }; },
      async remove() {}
    }
  });
  const result = await service.addEvidence({
    idUser: 7, idSubmission: 9, idRequirement: 3,
    file: { mimetype: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nmock') }
  });
  assert.equal(uploads, 1);
  assert.equal(result.evidence.ficheiro, 'https://storage.test/evidence.pdf');
});

test('20. remoção de evidência usa a chave composta submissão/ficheiro', () => {
  const source = read('services/mobile_submission_service.js');
  assert.match(source, /id_submissao: submissionId,\s*id_ficheiro: fileId/);
  assert.match(source, /foreignDocument/);
});

// Testes 21 a 24 foram removidos pois os endpoints REST foram removidos na nova arquitetura.

test('25. hash idempotente de upload inclui SHA-256 dos bytes', () => {
  const service = idempotencyServiceModule._createForTests({ db: {}, Op });
  const first = service.calculateRequestHash({
    method: 'POST', logicalRoute: '/upload', params: {}, body: { id_requisito: '3' },
    file: { safeOriginalName: 'a.pdf', mimetype: 'application/pdf', size: 5, buffer: Buffer.from('first') }
  });
  const second = service.calculateRequestHash({
    method: 'POST', logicalRoute: '/upload', params: {}, body: { id_requisito: '3' },
    file: { safeOriginalName: 'a.pdf', mimetype: 'application/pdf', size: 6, buffer: Buffer.from('second') }
  });
  assert.match(first, /^[0-9a-f]{64}$/);
  assert.notEqual(first, second);
});

function symbolValue(value, name) {
  const symbol = Object.getOwnPropertySymbols(value || {}).find((item) => String(item).includes(name));
  return symbol ? value[symbol] : undefined;
}

function pushRecord(values) {
  const row = { ...values };
  Object.defineProperty(row, 'update', { enumerable: false, value: async (updates) => Object.assign(row, updates) });
  Object.defineProperty(row, 'get', { enumerable: false, value: () => ({ ...row }) });
  return row;
}

function createPushHarness(send) {
  const rows = [];
  const devices = [];
  const db = {
    sequelize: sharedDb.sequelize,
    MobilePushOutbox: {
      async findOne({ where }) {
        return rows.find((row) => {
          if (where.id_utilizador && row.id_utilizador !== where.id_utilizador) return false;
          const statuses = symbolValue(where.status, 'in');
          if (statuses && !statuses.includes(row.status)) return false;
          const due = symbolValue(where.next_attempt_at, 'lte');
          if (due && new Date(row.next_attempt_at) > due) return false;
          return true;
        }) || null;
      },
      async create(values) { const row = pushRecord({ id_mobile_push: rows.length + 1, ...values }); rows.push(row); return row; },
      async update(values, { where }) {
        const row = rows.find((item) => item.id_mobile_push === where.id_mobile_push && item.status === where.status);
        if (row) Object.assign(row, values);
        return [row ? 1 : 0];
      }
    },
    MobileDevice: {
      async findAll({ where }) { return devices.filter((item) => item.id_utilizador === where.id_utilizador && item.ativo); },
      async update(values, { where }) {
        const tokens = symbolValue(where.fcm_token, 'in') || [];
        let count = 0;
        for (const device of devices) {
          if (device.id_utilizador === where.id_utilizador && device.ativo && tokens.includes(device.fcm_token)) {
            Object.assign(device, values); count += 1;
          }
        }
        return [count];
      }
    }
  };
  const service = pushServiceModule._createForTests({
    database: db,
    firebase: { getMessaging: () => ({ send }) },
    clock: () => new Date('2026-07-17T15:00:00.000Z')
  });
  return { service, rows, devices };
}

test('26. data_changed cria push outbox persistente', async () => {
  const harness = createPushHarness(async () => 'ok');
  await harness.service.enqueueDataChanged({ idUtilizador: 7, entity: 'profile', version: '10' });
  assert.equal(harness.rows.length, 1);
  assert.equal(harness.rows[0].status, 'pending');
});

test('27. push outbox coalesce entidades do mesmo utilizador', async () => {
  const harness = createPushHarness(async () => 'ok');
  await harness.service.enqueueDataChanged({ idUtilizador: 7, entity: 'profile', version: '10' });
  await harness.service.enqueueDataChanged({ idUtilizador: 7, entity: 'objectives', version: '11' });
  assert.equal(harness.rows.length, 1);
  assert.equal(harness.rows[0].entity, 'multiple');
});

test('28. worker envia data-only através de Firebase mock', async () => {
  const messages = [];
  const harness = createPushHarness(async (message) => { messages.push(message); return 'ok'; });
  harness.devices.push({ id_utilizador: 7, fcm_token: 'token', ativo: true });
  await harness.service.enqueueDataChanged({ idUtilizador: 7, entity: 'profile', version: '10' });
  const result = await harness.service.processNext();
  assert.equal(result.status, 'sent');
  assert.equal(Object.hasOwn(messages[0], 'notification'), false);
});

test('29. worker desativa token FCM inválido sem apagar o device', async () => {
  const harness = createPushHarness(async () => {
    const error = new Error('unregistered');
    error.code = 'messaging/registration-token-not-registered';
    throw error;
  });
  harness.devices.push({ id_utilizador: 7, fcm_token: 'dead', ativo: true });
  await harness.service.enqueueDataChanged({ idUtilizador: 7, entity: 'profile', version: '10' });
  await harness.service.processNext();
  assert.equal(harness.devices.length, 1);
  assert.equal(harness.devices[0].ativo, false);
});

// Testes 30 e 31 foram removidos pois os endpoints REST foram removidos na nova arquitetura.

test('32. access token expirado é rejeitado pelo verificador mobile', () => {
  const secret = 'mobile-secret-with-at-least-thirty-two-characters';
  const service = authServiceModule._criarParaTestes({ db: {}, bcrypt: {}, jwt, crypto, env: { MOBILE_JWT_SECRET: secret } });
  const token = jwt.sign({ id_utilizador: 7, token_type: 'mobile_access' }, secret, {
    algorithm: 'HS256', subject: '7', issuer: 'softinsa-pint', audience: 'mobile-api', expiresIn: -1
  });
  assert.throws(() => service.verificarAccessToken(token), { name: 'TokenExpiredError' });
});

test('33. refresh token revogado é rejeitado', async () => {
  const raw = 'revoked-refresh';
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
  const db = {
    sequelize: sharedDb.sequelize,
    MobileRefreshToken: { async findOne() { return { token_hash: tokenHash, device_id: 'phone', revoked_at: syncTime }; } }
  };
  const service = authServiceModule._criarParaTestes({
    db, bcrypt: {}, jwt, crypto,
    env: { MOBILE_JWT_SECRET: 'mobile-secret-with-at-least-thirty-two-characters' }
  });
  await assert.rejects(() => service.refresh({ refreshToken: raw, deviceId: 'phone' }), (error) => error.statusCode === 401);
});

test('34. replay com a mesma chave e payload diferente devolve conflito', async () => {
  const existing = { operation_type: 'objective.create', request_hash: 'a'.repeat(64), status: 'completed' };
  const db = {
    sequelize: sharedDb.sequelize,
    MobileOperation: { async findOne() { return existing; } }
  };
  const service = idempotencyServiceModule._createForTests({ db, Op });
  await assert.rejects(() => service.reserve({
    idUser: 7, clientOperationId: 'same-key', operationType: 'objective.create', requestHash: 'b'.repeat(64)
  }), (error) => error.statusCode === 409 && error.code === 'IDEMPOTENCY_KEY_CONFLICT');
});

test('35. rotas web permanecem separadas e não existem ciclos críticos mobile', () => {
  const webRoutes = fs.readdirSync(path.join(root, 'routes'))
    .filter((name) => name.endsWith('.js') && !name.startsWith('mobile_'))
    .map((name) => read(`routes/${name}`)).join('\n');
  const mobileRoutes = fs.readdirSync(path.join(root, 'routes'))
    .filter((name) => name.startsWith('mobile_') && name.endsWith('.js'))
    .map((name) => read(`routes/${name}`)).join('\n');
  assert.doesNotMatch(webRoutes, /mobile_auth_middleware/);
  assert.doesNotMatch(mobileRoutes, /\.\.\/middleware\/auth_middleware/);
  assert.match(read('routes/central_rotas.js'), /router\.post\(["']\/login["'], controller_login\.login\)/);

  const mobileFiles = [
    ...fs.readdirSync(path.join(root, 'routes')).filter((name) => name.startsWith('mobile_')).map((name) => `routes/${name}`),
    ...fs.readdirSync(path.join(root, 'controllers')).filter((name) => name.startsWith('mobile_')).map((name) => `controllers/${name}`),
    ...fs.readdirSync(path.join(root, 'services')).filter((name) => name.startsWith('mobile_')).map((name) => `services/${name}`),
    ...fs.readdirSync(path.join(root, 'middleware')).filter((name) => name.startsWith('mobile_')).map((name) => `middleware/${name}`)
  ];
  const graph = new Map(mobileFiles.map((file) => [file, []]));
  for (const file of mobileFiles) {
    const directory = path.posix.dirname(file);
    for (const match of read(file).matchAll(/require\(['"](\.\.[^'"]+|\.[^'"]+)['"]\)/g)) {
      let target = path.posix.normalize(path.posix.join(directory, match[1]));
      if (!path.posix.extname(target)) target += '.js';
      if (graph.has(target)) graph.get(file).push(target);
    }
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(file) {
    if (visiting.has(file)) return false;
    if (visited.has(file)) return true;
    visiting.add(file);
    for (const target of graph.get(file)) if (!visit(target)) return false;
    visiting.delete(file);
    visited.add(file);
    return true;
  }
  assert.ok([...graph.keys()].every(visit));
});

test('36. todos os scripts mobile têm transação explícita e repetição controlada', () => {
  const scripts = fs.readdirSync(path.join(root, 'scripts/sql'))
    .filter((name) => /mobile.*\.sql$/.test(name));
  assert.equal(scripts.length, 6);
  for (const name of scripts) {
    const sql = read(`scripts/sql/${name}`);
    assert.match(sql, /^BEGIN;/);
    assert.match(sql, /COMMIT;/);
    assert.equal((sql.match(/\$\$/g) || []).length % 2, 0, name);
    assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM utilizador/i);
  }
});

test('37. ordem SQL documentada respeita dependências do change log e outbox', () => {
  const checklist = read('docs/mobile_backend_production_checklist.md');
  const sync = checklist.indexOf('20260716_mobile_sync.sql');
  const changes = checklist.indexOf('20260716_mobile_sync_changes.sql');
  const outbox = checklist.indexOf('20260717_mobile_push_outbox.sql');
  assert.ok(sync >= 0 && sync < changes && changes < outbox);
  assert.ok(checklist.includes('sequelize.sync({force:false})` não substitui os scripts'));
});

test('38. todos os models técnicos mobile estão registados em models/index.js', () => {
  const index = read('models/index.js');
  for (const model of ['MobileDevice', 'MobileRefreshToken', 'MobileSyncChange', 'MobileOperation', 'MobilePushOutbox']) {
    assert.match(index, new RegExp(`db\\.${model} = require`), model);
  }
});

test('39. documentação de ambiente contém nomes mas não valores secretos', () => {
  const checklist = read('docs/mobile_backend_production_checklist.md');
  for (const variable of [
    'DB_HOST', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD', 'MOBILE_JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
    'FIREBASE_SERVICE_ACCOUNT_JSON', 'GOOGLE_APPLICATION_CREDENTIALS'
  ]) {
    assert.match(checklist, new RegExp(`\\b${variable}\\b`), variable);
  }
  assert.doesNotMatch(checklist, /(DB_PASSWORD|MOBILE_JWT_SECRET|CLOUDINARY_API_SECRET)\s*=\s*\S+/);
});

test('40. não existem logs de tokens/hashes nem endpoint público de envio push', () => {
  const files = [
    ...['controllers', 'services', 'middleware', 'routes'].flatMap((directory) => (
      fs.readdirSync(path.join(root, directory))
        .filter((name) => name.startsWith('mobile_') && name.endsWith('.js'))
        .map((name) => `${directory}/${name}`)
    )),
    'services/firebase_admin_service.js',
    'services/sync_push_service.js',
    'config/db.config.js',
    'server.js',
    'cron/index.js'
  ];
  const source = files.map(read).join('\n');
  assert.doesNotMatch(source, /console\.(?:log|warn|error)\([^\n]*(?:fcm_token|refresh_token|token_hash|private_key|password)/i);
  const mobileRoutes = fs.readdirSync(path.join(root, 'routes'))
    .filter((name) => name.startsWith('mobile_'))
    .map((name) => read(`routes/${name}`)).join('\n');
  assert.doesNotMatch(mobileRoutes, /send[-_ ]?push|test[-_ ]?push|firebase.*router/i);
});
