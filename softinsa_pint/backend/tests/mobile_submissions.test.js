const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { after, before, test } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');

const MOBILE_SECRET = 'mobile-submission-tests-secret-with-32-characters';
process.env.MOBILE_JWT_SECRET = MOBILE_SECRET;

function updatable(record) {
  Object.defineProperty(record, 'update', {
    enumerable: false,
    value: async (values) => {
      Object.assign(record, values);
      return record;
    }
  });
  Object.defineProperty(record, 'save', {
    enumerable: false,
    value: async () => record
  });
  return record;
}

const users = [
  { id_utilizador: 7, nome_user: 'User 7', email: 'seven@example.com', telefone: 912345678, imagem_perfil: 'https://example.com/7.png', ativo: true },
  { id_utilizador: 8, nome_user: 'User 8', email: 'eight@example.com', telefone: 923456789, imagem_perfil: 'https://example.com/8.png', ativo: true }
];
const consultants = [
  { id_utilizador: 7, id_area: 3, ativo: true },
  { id_utilizador: 8, id_area: 4, ativo: true }
];
const badges = [
  { id_badge: 101, deleted_badge: false, validade: null },
  { id_badge: 102, deleted_badge: false, validade: null }
];
const requirements = [
  { id_requisito: 201, deleted_requisitos: false },
  { id_requisito: 202, deleted_requisitos: false },
  { id_requisito: 203, deleted_requisitos: false }
];
const requirementRelations = [
  { id_badge: 101, id_requisito: 201 },
  { id_badge: 101, id_requisito: 202 },
  { id_badge: 102, id_requisito: 203 }
];
const submissions = [
  updatable({
    id_submissao: 80,
    id_badge: 102,
    id_utilizador: 8,
    status: 'em_progresso',
    data_submissao: new Date('2026-07-17T09:00:00Z'),
    notificacao_sla: false
  })
];
const documents = [
  updatable({
    id_submissao: 80,
    id_ficheiro: 800,
    id_requisito: 203,
    ficheiro: 'https://storage.example.com/other.pdf',
    updated_file: new Date('2026-07-17T09:05:00Z'),
    deleted_file: false
  })
];
const badgeRecords = [];
const mobileOperations = [];
let nextSubmissionId = 100;
let nextFileId = 900;
let nextMobileOperationId = 1;
let transactionCount = 0;

function operatorValue(value) {
  if (!value || typeof value !== 'object') return undefined;
  const symbol = Object.getOwnPropertySymbols(value)[0];
  return symbol ? value[symbol] : undefined;
}

function matches(record, where) {
  return Object.entries(where).every(([field, expected]) => {
    const operand = operatorValue(expected);
    if (Array.isArray(operand)) return operand.map(Number).includes(Number(record[field]));
    return record[field] === expected || Number(record[field]) === Number(expected);
  });
}

function transactionArgs(options, callback) {
  return typeof options === 'function' ? options : callback;
}

const fakeDb = {
  sequelize: {
    async transaction(options, callback) {
      transactionCount += 1;
      return transactionArgs(options, callback)({ LOCK: { UPDATE: 'UPDATE' } });
    }
  },
  Utilizador: {
    async findByPk(id) {
      return users.find((user) => user.id_utilizador === Number(id)) || null;
    }
  },
  Consultor: {
    async findOne({ where }) {
      return consultants.find((consultant) => matches(consultant, where)) || null;
    }
  },
  Badges: {
    async findOne({ where }) {
      return badges.find((badge) => matches(badge, where)) || null;
    }
  },
  Submissoes: {
    async findAll({ where }) {
      return submissions.filter((submission) => matches(submission, where));
    },
    async findOne({ where }) {
      return submissions.find((submission) => matches(submission, where)) || null;
    },
    async create(values) {
      const submission = updatable({ id_submissao: nextSubmissionId++, ...values });
      submissions.push(submission);
      return submission;
    }
  },
  RegistoBadges: {
    async findAll({ where }) {
      return badgeRecords.filter((record) => matches(record, where));
    }
  },
  Requisitos: {
    async findOne({ where }) {
      return requirements.find((requirement) => matches(requirement, where)) || null;
    },
    async findAll({ where }) {
      return requirements.filter((requirement) => matches(requirement, where));
    }
  },
  RequisitosBadge: {
    async findOne({ where }) {
      return requirementRelations.find((relation) => matches(relation, where)) || null;
    },
    async findAll({ where }) {
      return requirementRelations.filter((relation) => matches(relation, where));
    }
  },
  Permissoes: {
    async findOne() {
      return { toggle: true };
    }
  },
  Documentos: {
    async findAll({ where }) {
      return documents.filter((document) => matches(document, where));
    },
    async findOne({ where }) {
      return documents.find((document) => matches(document, where)) || null;
    },
    async create(values) {
      const document = updatable({ id_ficheiro: nextFileId++, ...values });
      documents.push(document);
      return document;
    },
    async update(values, { where }) {
      let affected = 0;
      for (const document of documents) {
        if (matches(document, where)) {
          Object.assign(document, values);
          affected += 1;
        }
      }
      return [affected];
    },
    async bulkCreate(values) {
      const created = values.map((value) => {
        const document = updatable({ ...value });
        documents.push(document);
        return document;
      });
      return created;
    }
  },
  MobileOperation: {
    async findOne({ where }) {
      return mobileOperations.find((operation) => matches(operation, where)) || null;
    },
    async findByPk(id) {
      return mobileOperations.find((operation) => operation.id_mobile_operation === Number(id)) || null;
    },
    async create(values) {
      const operation = updatable({ id_mobile_operation: nextMobileOperationId++, ...values });
      mobileOperations.push(operation);
      return operation;
    },
    async destroy() {
      return 0;
    }
  }
};

const storageUploads = [];
const storageRemovals = [];
const fakeStorage = {
  async upload(file) {
    storageUploads.push(file);
    return {
      url: `https://storage.example.com/evidence-${storageUploads.length}.pdf`,
      publicId: `evidence-${storageUploads.length}`,
      resourceType: 'raw'
    };
  },
  async remove(info) {
    storageRemovals.push(info);
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
const storagePath = require.resolve('../services/mobile_evidence_storage_service');
require.cache[storagePath] = {
  id: storagePath,
  filename: storagePath,
  loaded: true,
  exports: fakeStorage,
  children: [],
  paths: []
};

const mobileRoutes = require('../routes/mobile_sync_routes');
const app = express();
app.use(express.json());
app.use('/api/mobile', mobileRoutes);

function tokenFor(idUser) {
  return jwt.sign({
    id_utilizador: idUser,
    token_type: 'mobile_access'
  }, MOBILE_SECRET, {
    algorithm: 'HS256',
    subject: String(idUser),
    issuer: 'softinsa-pint',
    audience: 'mobile-api',
    expiresIn: 900
  });
}

const accessToken = tokenFor(7);
let server;
let baseUrl;
let mainSubmissionId;
let ownFileId;
let incompleteSubmissionId;
let operationCounter = 0;

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

async function request(method, pathname, { body, token = accessToken } = {}) {
  operationCounter += 1;
  const headers = { 'Idempotency-Key': `submission-test-${operationCounter}` };
  let requestBody;
  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined) {
    headers['content-type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }
  if (token !== null) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: requestBody
  });
  return { status: response.status, body: await response.json() };
}

function pdfForm(idRequirement, content = Buffer.from('%PDF-1.4\nmobile evidence')) {
  const form = new FormData();
  form.append('id_requisito', String(idRequirement));
  form.append('ficheiro', new Blob([content], { type: 'application/pdf' }), 'evidência segura.pdf');
  return form;
}

test('1. cria submissão válida apenas após pedido explícito', async () => {
  const beforeTransactions = transactionCount;
  const response = await request('POST', '/api/mobile/submissions', {
    body: { id_badge: 101, id_utilizador: 8 }
  });
  mainSubmissionId = response.body.submission?.id_submissao;
  const persisted = submissions.find((submission) => submission.id_submissao === mainSubmissionId);
  assert.equal(response.status, 201);
  assert.equal(response.body.submission.status, 'em_progresso');
  assert.equal(persisted.id_utilizador, 7);
  assert.equal(transactionCount, beforeTransactions + 3);
});

test('2. badge inexistente devolve 404', async () => {
  const response = await request('POST', '/api/mobile/submissions', {
    body: { id_badge: 999 }
  });
  assert.equal(response.status, 404);
});

test('3. candidatura ativa duplicada devolve 409', async () => {
  const response = await request('POST', '/api/mobile/submissions', {
    body: { id_badge: 101 }
  });
  assert.equal(response.status, 409);
  assert.equal(response.body.code, 'DUPLICATE_SUBMISSION');
});

test('4. upload válido persiste apenas metadados seguros', async () => {
  const response = await request(
    'POST',
    `/api/mobile/submissions/${mainSubmissionId}/evidences`,
    { body: pdfForm(201) }
  );
  ownFileId = response.body.evidence?.id_ficheiro;
  assert.equal(response.status, 201);
  assert.equal(response.body.evidence.id_submissao, mainSubmissionId);
  assert.match(response.body.evidence.ficheiro, /^https:\/\/storage\.example\.com\//);
  assert.doesNotMatch(storageUploads.at(-1).safeOriginalName, /[\\/\s]/);
  assert.equal(Object.hasOwn(response.body.evidence, 'publicId'), false);
});

test('5. upload sem ficheiro devolve 400', async () => {
  const form = new FormData();
  form.append('id_requisito', '201');
  const response = await request(
    'POST',
    `/api/mobile/submissions/${mainSubmissionId}/evidences`,
    { body: form }
  );
  assert.equal(response.status, 400);
});

test('6. MIME ou assinatura interna inválida devolve 415', async () => {
  const invalidMime = new FormData();
  invalidMime.append('id_requisito', '201');
  invalidMime.append('ficheiro', new Blob(['plain'], { type: 'text/plain' }), 'plain.txt');
  const mimeResponse = await request(
    'POST',
    `/api/mobile/submissions/${mainSubmissionId}/evidences`,
    { body: invalidMime }
  );
  const signatureResponse = await request(
    'POST',
    `/api/mobile/submissions/${mainSubmissionId}/evidences`,
    { body: pdfForm(201, Buffer.from('not a real pdf')) }
  );
  assert.equal(mimeResponse.status, 415);
  assert.equal(signatureResponse.status, 415);
});

test('7. tamanho excessivo devolve 413 antes do storage', async () => {
  const beforeUploads = storageUploads.length;
  const oversized = Buffer.alloc(10 * 1024 * 1024 + 1, 0x20);
  oversized.write('%PDF-', 0, 'ascii');
  const response = await request(
    'POST',
    `/api/mobile/submissions/${mainSubmissionId}/evidences`,
    { body: pdfForm(201, oversized) }
  );
  assert.equal(response.status, 413);
  assert.equal(storageUploads.length, beforeUploads);
});

test('8. requisito de outro badge é recusado', async () => {
  const beforeUploads = storageUploads.length;
  const response = await request(
    'POST',
    `/api/mobile/submissions/${mainSubmissionId}/evidences`,
    { body: pdfForm(203) }
  );
  assert.equal(response.status, 409);
  assert.equal(storageUploads.length, beforeUploads);
});

test('9. upload numa submissão de outro utilizador devolve 403', async () => {
  const beforeUploads = storageUploads.length;
  const response = await request(
    'POST',
    '/api/mobile/submissions/80/evidences',
    { body: pdfForm(203) }
  );
  assert.equal(response.status, 403);
  assert.equal(storageUploads.length, beforeUploads);
});

test('10. remove evidência própria por soft delete', async () => {
  const response = await request(
    'DELETE',
    `/api/mobile/submissions/${mainSubmissionId}/evidences/${ownFileId}`
  );
  const repeated = await request(
    'DELETE',
    `/api/mobile/submissions/${mainSubmissionId}/evidences/${ownFileId}`
  );
  const persisted = documents.find((document) => document.id_ficheiro === ownFileId);
  assert.equal(response.status, 200);
  assert.equal(response.body.deleted, true);
  assert.equal(repeated.status, 200);
  assert.equal(repeated.body.deleted, true);
  assert.equal(persisted.deleted_file, true);
  assert.equal(storageRemovals.length, 0);
});

test('11. não remove evidência pertencente a outra submissão', async () => {
  const response = await request(
    'DELETE',
    `/api/mobile/submissions/${mainSubmissionId}/evidences/800`
  );
  assert.equal(response.status, 403);
  assert.equal(documents.find((document) => document.id_ficheiro === 800).deleted_file, false);
});

test('12. confirma submissão com todas as evidências numa transação', async () => {
  await request('POST', `/api/mobile/submissions/${mainSubmissionId}/evidences`, { body: pdfForm(201) });
  await request('POST', `/api/mobile/submissions/${mainSubmissionId}/evidences`, { body: pdfForm(202) });
  const beforeTransactions = transactionCount;
  const response = await request('POST', `/api/mobile/submissions/${mainSubmissionId}/submit`, {
    body: {}
  });
  assert.equal(response.status, 200);
  assert.equal(response.body.submission.status, 'pendente');
  assert.equal(transactionCount, beforeTransactions + 3);
});

test('13. confirmação com evidências em falta devolve 409', async () => {
  const created = await request('POST', '/api/mobile/submissions', { body: { id_badge: 102 } });
  incompleteSubmissionId = created.body.submission.id_submissao;
  const response = await request('POST', `/api/mobile/submissions/${incompleteSubmissionId}/submit`, {
    body: {}
  });
  assert.equal(response.status, 409);
  assert.deepEqual(response.body.requisitos_em_falta, [203]);
});

test('14. confirmar a mesma submissão duas vezes devolve 409', async () => {
  const response = await request('POST', `/api/mobile/submissions/${mainSubmissionId}/submit`, {
    body: {}
  });
  assert.equal(response.status, 409);
  assert.equal(response.body.status_atual, 'pendente');
});

test('15. upload após confirmação devolve 409 sem tocar no storage', async () => {
  const beforeUploads = storageUploads.length;
  const response = await request(
    'POST',
    `/api/mobile/submissions/${mainSubmissionId}/evidences`,
    { body: pdfForm(201) }
  );
  assert.equal(response.status, 409);
  assert.equal(storageUploads.length, beforeUploads);
});

test('16. consulta e operações ficam isoladas entre utilizadores', async () => {
  const own = await request('GET', `/api/mobile/submissions/${mainSubmissionId}`);
  const other = await request('GET', '/api/mobile/submissions/80');
  const unauthenticated = await request('GET', `/api/mobile/submissions/${mainSubmissionId}`, {
    token: null
  });
  assert.equal(own.status, 200);
  assert.ok(own.body.submission.evidences.every((item) => item.id_submissao === mainSubmissionId));
  assert.equal(other.status, 403);
  assert.equal(unauthenticated.status, 401);
});

test('17. rotas web de rascunho, evidências e submissão permanecem inalteradas', () => {
  const routes = fs.readFileSync(path.join(__dirname, '../routes/me_routes.js'), 'utf8');
  assert.match(routes, /router\.post\('\/badges\/:id\/rascunho', authMiddleware, controller\.criarOuObterRascunho\)/);
  assert.match(routes, /router\.post\('\/badges\/:id\/submeter', authMiddleware, controller\.submeterMinhaCandidatura\)/);
  assert.match(routes, /controller\.guardarEvidenciaRascunho/);
  assert.match(routes, /controller\.removerEvidenciaRascunho/);
});

test('18. sync e respetivo service permanecem inalterados', () => {
  const routes = fs.readFileSync(path.join(__dirname, '../routes/mobile_sync_routes.js'), 'utf8');
  const service = fs.readFileSync(path.join(__dirname, '../services/mobile_sync_service.js'), 'utf8');
  assert.match(routes, /router\.get\('\/sync', mobileAuthMiddleware, mobileSyncController\.sincronizar\)/);
  assert.doesNotMatch(service, /mobile_submission/);
});

test('19. auth, devices e mutations das fases anteriores permanecem montados', () => {
  const routes = fs.readFileSync(path.join(__dirname, '../routes/mobile_sync_routes.js'), 'utf8');
  const mutationRoutes = fs.readFileSync(path.join(__dirname, '../routes/mobile_mutation_routes.js'), 'utf8');
  assert.match(routes, /router\.use\('\/auth', mobileAuthRoutes\)/);
  assert.match(routes, /router\.use\('\/devices', mobileDeviceRoutes\)/);
  assert.match(routes, /router\.use\('\/', mobileMutationRoutes\)/);
  assert.match(mutationRoutes, /router\.post\(\s*'\/objectives'/);
  assert.match(mutationRoutes, /router\.put\(\s*'\/profile'/);
  assert.match(mutationRoutes, /router\.put\(\s*'\/signature'/);
});
