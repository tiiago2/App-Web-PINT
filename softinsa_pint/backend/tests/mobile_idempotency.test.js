const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { after, before, test } = require('node:test');
const express = require('express');

function updatable(record) {
  Object.defineProperty(record, 'update', {
    enumerable: false,
    value: async (values) => {
      Object.assign(record, values);
      return record;
    }
  });
  return record;
}

const operations = [];
let nextOperationId = 1;
let transactionQueue = Promise.resolve();

function matches(record, where) {
  return Object.entries(where).every(([key, value]) => record[key] === value);
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
  MobileOperation: {
    async findOne({ where }) {
      return operations.find((operation) => matches(operation, where)) || null;
    },
    async findByPk(id) {
      return operations.find((operation) => operation.id_mobile_operation === Number(id)) || null;
    },
    async create(values) {
      const duplicate = operations.some((operation) => (
        operation.id_utilizador === values.id_utilizador
        && operation.client_operation_id === values.client_operation_id
      ));
      if (duplicate) {
        const error = new Error('unique');
        error.name = 'SequelizeUniqueConstraintError';
        throw error;
      }
      const operation = updatable({ id_mobile_operation: nextOperationId++, ...values });
      operations.push(operation);
      return operation;
    },
    async destroy() {
      return 0;
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

const idempotencyModule = require('../services/mobile_idempotency_service');
const createMiddleware = require('../middleware/mobile_idempotency_middleware')._createForTests;
const uploadMiddleware = require('../middleware/mobile_evidence_upload_middleware');
const idempotencyService = idempotencyModule._createForTests({ db: fakeDb });
const idempotent = createMiddleware(idempotencyService);

const effects = {
  objectiveExecutions: 0,
  objectives: [],
  deletes: 0,
  profiles: 0,
  signatures: 0,
  submissions: 0,
  storageUploads: 0,
  evidenceDeletes: 0,
  confirmations: 0,
  permanentExecutions: 0,
  retryableExecutions: 0
};

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.mobileAuth = { id_utilizador: Number(req.headers['x-user-id'] || 7) };
  next();
});

app.post(
  '/api/mobile/objectives',
  idempotent({ operationType: 'objective.create', logicalRoute: '/api/mobile/objectives' }),
  async (req, res) => {
    effects.objectiveExecutions += 1;
    if (req.body.mode === 'concurrent') {
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    if (req.body.mode === 'permanent') {
      effects.permanentExecutions += 1;
      return res.status(404).json({ success: false, error: 'Badge não encontrado.', code: 'BADGE_NOT_FOUND' });
    }
    if (req.body.mode === 'retryable') {
      effects.retryableExecutions += 1;
      if (effects.retryableExecutions === 1) {
        return res.status(500).json({ success: false, error: 'Falha temporária.', code: 'TEMPORARY_FAILURE' });
      }
    }
    const objective = { id_objetivo: effects.objectives.length + 1, id_badge: req.body.id_badge };
    effects.objectives.push(objective);
    return res.status(201).json({ success: true, objective });
  }
);

app.delete(
  '/api/mobile/objectives/:idObjetivo',
  idempotent({ operationType: 'objective.delete', logicalRoute: '/api/mobile/objectives/:idObjetivo' }),
  (req, res) => {
    effects.deletes += 1;
    return res.status(200).json({ success: true, deleted: true, id_objetivo: Number(req.params.idObjetivo) });
  }
);

app.put(
  '/api/mobile/profile',
  idempotent({ operationType: 'profile.update', logicalRoute: '/api/mobile/profile' }),
  (req, res) => {
    effects.profiles += 1;
    return res.status(200).json({ success: true, profile: { nome: req.body.nome } });
  }
);

app.put(
  '/api/mobile/signature',
  idempotent({ operationType: 'signature.update', logicalRoute: '/api/mobile/signature' }),
  (req, res) => {
    effects.signatures += 1;
    return res.status(200).json({ success: true, signature: { badge_ids: req.body.badge_ids } });
  }
);

app.post(
  '/api/mobile/submissions',
  idempotent({ operationType: 'submission.create', logicalRoute: '/api/mobile/submissions' }),
  (req, res) => {
    effects.submissions += 1;
    return res.status(201).json({
      success: true,
      submission: { id_submissao: effects.submissions, id_badge: req.body.id_badge, status: 'em_progresso' }
    });
  }
);

app.post(
  '/api/mobile/submissions/:idSubmissao/evidences',
  idempotent.requireKey({ multipart: true }),
  uploadMiddleware,
  idempotent({
    operationType: 'submission.evidence.create',
    logicalRoute: '/api/mobile/submissions/:idSubmissao/evidences',
    multipart: true
  }),
  (req, res) => {
    effects.storageUploads += 1;
    return res.status(201).json({
      success: true,
      evidence: {
        id_ficheiro: effects.storageUploads,
        id_submissao: Number(req.params.idSubmissao),
        id_requisito: Number(req.body.id_requisito)
      }
    });
  }
);

app.delete(
  '/api/mobile/submissions/:idSubmissao/evidences/:idFicheiro',
  idempotent({
    operationType: 'submission.evidence.delete',
    logicalRoute: '/api/mobile/submissions/:idSubmissao/evidences/:idFicheiro'
  }),
  (req, res) => {
    effects.evidenceDeletes += 1;
    return res.status(200).json({ success: true, deleted: true, id_ficheiro: Number(req.params.idFicheiro) });
  }
);

app.post(
  '/api/mobile/submissions/:idSubmissao/submit',
  idempotent({
    operationType: 'submission.submit',
    logicalRoute: '/api/mobile/submissions/:idSubmissao/submit'
  }),
  (req, res) => {
    effects.confirmations += 1;
    return res.status(200).json({
      success: true,
      submission: { id_submissao: Number(req.params.idSubmissao), status: 'pendente' }
    });
  }
);

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

async function request(method, pathname, { body, key, userId = 7 } = {}) {
  const headers = { 'X-User-Id': String(userId) };
  let payload;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  if (key !== undefined) headers['Idempotency-Key'] = key;
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: payload
  });
  return {
    status: response.status,
    body: await response.json(),
    replayed: response.headers.get('idempotent-replayed')
  };
}

function pdfForm(idRequirement, content = '%PDF-1.4\nidempotency') {
  const form = new FormData();
  form.append('id_requisito', String(idRequirement));
  form.append('ficheiro', new Blob([content], { type: 'application/pdf' }), 'prova segura.pdf');
  return form;
}

test('1. operação nova é executada apenas uma vez', async () => {
  const before = effects.objectiveExecutions;
  const response = await request('POST', '/api/mobile/objectives', {
    body: { id_badge: 1, client_operation_id: 'body-operation-1' }
  });
  assert.equal(response.status, 201);
  assert.equal(effects.objectiveExecutions, before + 1);
  assert.equal(operations.find((item) => item.client_operation_id === 'body-operation-1').status, 'completed');
});

test('2. replay completed devolve exatamente o status e resposta persistidos', async () => {
  const before = effects.objectiveExecutions;
  const first = await request('POST', '/api/mobile/objectives', {
    key: 'completed-replay-2',
    body: { id_badge: 2 }
  });
  const replay = await request('POST', '/api/mobile/objectives', {
    key: 'completed-replay-2',
    body: { id_badge: 2 }
  });
  assert.equal(first.status, 201);
  assert.equal(replay.status, first.status);
  assert.deepEqual(replay.body, first.body);
  assert.equal(replay.replayed, 'true');
  assert.equal(effects.objectiveExecutions, before + 1);
});

test('3. mesma chave com payload diferente devolve 409', async () => {
  await request('POST', '/api/mobile/objectives', { key: 'payload-conflict-3', body: { id_badge: 3 } });
  const response = await request('POST', '/api/mobile/objectives', {
    key: 'payload-conflict-3',
    body: { id_badge: 4 }
  });
  assert.equal(response.status, 409);
  assert.equal(response.body.code, 'IDEMPOTENCY_KEY_CONFLICT');
});

test('4. a mesma chave é permitida para utilizadores diferentes', async () => {
  const first = await request('PUT', '/api/mobile/profile', {
    key: 'shared-user-key-4', userId: 7, body: { nome: 'Sete' }
  });
  const second = await request('PUT', '/api/mobile/profile', {
    key: 'shared-user-key-4', userId: 8, body: { nome: 'Oito' }
  });
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(operations.filter((item) => item.client_operation_id === 'shared-user-key-4').length, 2);
});

test('5. chave ausente devolve 400', async () => {
  const response = await request('POST', '/api/mobile/objectives', { body: { id_badge: 5 } });
  const multipart = await request('POST', '/api/mobile/submissions/5/evidences', {
    body: pdfForm(201)
  });
  assert.equal(response.status, 400);
  assert.equal(multipart.status, 400);
  assert.equal(response.body.code, 'IDEMPOTENCY_KEY_REQUIRED');
  assert.equal(multipart.body.code, 'IDEMPOTENCY_KEY_REQUIRED');
});

test('6. chave vazia ou demasiado longa devolve 400', async () => {
  const empty = await request('POST', '/api/mobile/objectives', {
    body: { id_badge: 6, client_operation_id: '' }
  });
  const long = await request('POST', '/api/mobile/objectives', {
    key: 'x'.repeat(129), body: { id_badge: 6 }
  });
  assert.equal(empty.status, 400);
  assert.equal(long.status, 400);
  assert.equal(empty.body.code, 'IDEMPOTENCY_KEY_INVALID');
});

test('7. concorrência com a mesma chave executa uma vez e devolve conflito estável', async () => {
  const before = effects.objectiveExecutions;
  const requests = await Promise.all([
    request('POST', '/api/mobile/objectives', {
      key: 'concurrent-key-7', body: { id_badge: 7, mode: 'concurrent' }
    }),
    request('POST', '/api/mobile/objectives', {
      key: 'concurrent-key-7', body: { id_badge: 7, mode: 'concurrent' }
    })
  ]);
  assert.deepEqual(requests.map((item) => item.status).sort(), [201, 409]);
  assert.equal(effects.objectiveExecutions, before + 1);
  assert.ok(requests.some((item) => item.body.code === 'IDEMPOTENCY_OPERATION_PROCESSING'));
});

test('8. retry de criação de objetivo não cria duas linhas', async () => {
  const before = effects.objectives.length;
  await request('POST', '/api/mobile/objectives', { key: 'objective-retry-8', body: { id_badge: 8 } });
  await request('POST', '/api/mobile/objectives', { key: 'objective-retry-8', body: { id_badge: 8 } });
  assert.equal(effects.objectives.length, before + 1);
});

test('9. delete repetido não volta a executar o efeito', async () => {
  const before = effects.deletes;
  await request('DELETE', '/api/mobile/objectives/9', { key: 'delete-retry-9' });
  const replay = await request('DELETE', '/api/mobile/objectives/9', { key: 'delete-retry-9' });
  assert.equal(effects.deletes, before + 1);
  assert.equal(replay.replayed, 'true');
});

test('10. atualização de perfil repetida é reproduzida', async () => {
  const before = effects.profiles;
  await request('PUT', '/api/mobile/profile', { key: 'profile-retry-10', body: { nome: 'Nome' } });
  await request('PUT', '/api/mobile/profile', { key: 'profile-retry-10', body: { nome: 'Nome' } });
  assert.equal(effects.profiles, before + 1);
});

test('11. atualização de assinatura repetida é reproduzida', async () => {
  const before = effects.signatures;
  await request('PUT', '/api/mobile/signature', {
    key: 'signature-retry-11', body: { badge_ids: [1, 2] }
  });
  await request('PUT', '/api/mobile/signature', {
    key: 'signature-retry-11', body: { badge_ids: [1, 2] }
  });
  assert.equal(effects.signatures, before + 1);
});

test('12. criação de submissão repetida cria apenas uma submissão', async () => {
  const before = effects.submissions;
  await request('POST', '/api/mobile/submissions', { key: 'submission-retry-12', body: { id_badge: 12 } });
  await request('POST', '/api/mobile/submissions', { key: 'submission-retry-12', body: { id_badge: 12 } });
  assert.equal(effects.submissions, before + 1);
});

test('13. upload repetido não volta a enviar para o storage', async () => {
  const before = effects.storageUploads;
  const first = await request('POST', '/api/mobile/submissions/12/evidences', {
    key: 'upload-retry-13', body: pdfForm(201)
  });
  const replay = await request('POST', '/api/mobile/submissions/12/evidences', {
    key: 'upload-retry-13', body: pdfForm(201)
  });
  assert.equal(first.status, 201);
  assert.equal(replay.status, 201);
  assert.equal(replay.replayed, 'true');
  assert.equal(effects.storageUploads, before + 1);
});

test('14. confirmação repetida não volta a executar a transição', async () => {
  const before = effects.confirmations;
  await request('POST', '/api/mobile/submissions/14/submit', { key: 'submit-retry-14', body: {} });
  await request('POST', '/api/mobile/submissions/14/submit', { key: 'submit-retry-14', body: {} });
  assert.equal(effects.confirmations, before + 1);
});

test('15. erro permanente é persistido e reproduzido', async () => {
  const before = effects.permanentExecutions;
  const first = await request('POST', '/api/mobile/objectives', {
    key: 'permanent-error-15', body: { id_badge: 15, mode: 'permanent' }
  });
  const replay = await request('POST', '/api/mobile/objectives', {
    key: 'permanent-error-15', body: { id_badge: 15, mode: 'permanent' }
  });
  assert.equal(first.status, 404);
  assert.deepEqual(replay.body, first.body);
  assert.equal(replay.replayed, 'true');
  assert.equal(effects.permanentExecutions, before + 1);
});

test('16. erro retryable pode ser repetido com segurança no mesmo registo', async () => {
  const first = await request('POST', '/api/mobile/objectives', {
    key: 'retryable-error-16', body: { id_badge: 16, mode: 'retryable' }
  });
  const second = await request('POST', '/api/mobile/objectives', {
    key: 'retryable-error-16', body: { id_badge: 16, mode: 'retryable' }
  });
  assert.equal(first.status, 500);
  assert.equal(second.status, 201);
  assert.equal(operations.filter((item) => item.client_operation_id === 'retryable-error-16').length, 1);
  assert.equal(operations.find((item) => item.client_operation_id === 'retryable-error-16').status, 'completed');
});

test('17. request_hash multipart inclui metadados e hash SHA-256 dos bytes', async () => {
  await request('POST', '/api/mobile/submissions/17/evidences', {
    key: 'multipart-hash-17', body: pdfForm(201, '%PDF-1.4\nfirst')
  });
  const conflict = await request('POST', '/api/mobile/submissions/17/evidences', {
    key: 'multipart-hash-17', body: pdfForm(201, '%PDF-1.4\nsecond')
  });
  const operation = operations.find((item) => item.client_operation_id === 'multipart-hash-17');
  assert.equal(conflict.status, 409);
  assert.match(operation.request_hash, /^[0-9a-f]{64}$/);
});

test('18. isolamento por utilizador aplica-se também a replays e respostas', async () => {
  const key = 'isolation-key-18';
  const first = await request('POST', '/api/mobile/submissions', {
    key, userId: 7, body: { id_badge: 18 }
  });
  const second = await request('POST', '/api/mobile/submissions', {
    key, userId: 8, body: { id_badge: 18 }
  });
  const replay = await request('POST', '/api/mobile/submissions', {
    key, userId: 8, body: { id_badge: 18 }
  });
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  assert.deepEqual(replay.body, second.body);
  assert.notDeepEqual(first.body, second.body);
});

test('19. rotas e contratos web permanecem sem middleware mobile', () => {
  const meRoutes = fs.readFileSync(path.join(__dirname, '../routes/me_routes.js'), 'utf8');
  const objectiveRoutes = fs.readFileSync(path.join(__dirname, '../routes/objetivos_routes.js'), 'utf8');
  assert.doesNotMatch(meRoutes, /mobile_idempotency/);
  assert.doesNotMatch(objectiveRoutes, /mobile_idempotency/);
  assert.match(meRoutes, /controller\.submeterMinhaCandidatura/);
  assert.match(objectiveRoutes, /Controller\.criarObjetivo/);
});

test('20. auth, devices, sync, mutations e submissões mantêm montagem e âmbito', () => {
  const central = fs.readFileSync(path.join(__dirname, '../routes/mobile_sync_routes.js'), 'utf8');
  const mutations = fs.readFileSync(path.join(__dirname, '../routes/mobile_mutation_routes.js'), 'utf8');
  const submissionsRoutes = fs.readFileSync(path.join(__dirname, '../routes/mobile_submission_routes.js'), 'utf8');
  const sql = fs.readFileSync(path.join(__dirname, '../scripts/sql/20260717_mobile_operations.sql'), 'utf8');
  const model = fs.readFileSync(path.join(__dirname, '../models/mobile_operation.js'), 'utf8');
  assert.match(central, /router\.use\('\/auth', mobileAuthRoutes\)/);
  assert.match(central, /router\.use\('\/devices', mobileDeviceRoutes\)/);
  assert.match(central, /router\.get\('\/sync', mobileAuthMiddleware, mobileSyncController\.sincronizar\)/);
  assert.equal((mutations.match(/operationType:/g) || []).length, 4);
  assert.equal((submissionsRoutes.match(/operationType:/g) || []).length, 4);
  assert.doesNotMatch(central, /mobileIdempotencyMiddleware/);
  assert.match(sql, /UNIQUE \(id_utilizador, client_operation_id\)/);
  assert.match(sql, /failed_retryable/);
  assert.match(model, /tableName: 'mobile_operations'/);
});
