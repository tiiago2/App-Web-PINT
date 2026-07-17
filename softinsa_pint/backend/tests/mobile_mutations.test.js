const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { after, before, test } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');

const MOBILE_SECRET = 'mobile-mutation-tests-secret-with-32-characters';
process.env.MOBILE_JWT_SECRET = MOBILE_SECRET;

function atualizavel(record) {
  Object.defineProperty(record, 'update', {
    enumerable: false,
    value: async (values) => {
      Object.assign(record, values);
      return record;
    }
  });
  return record;
}

const utilizadores = [
  atualizavel({
    id_utilizador: 7,
    nome_user: 'Consultor Sete',
    email: 'sete@example.com',
    telefone: 912345678,
    imagem_perfil: 'https://example.com/sete.png',
    ativo: true
  }),
  atualizavel({
    id_utilizador: 8,
    nome_user: 'Consultor Oito',
    email: 'oito@example.com',
    telefone: 923456789,
    imagem_perfil: 'https://example.com/oito.png',
    ativo: true
  })
];
const consultores = [
  atualizavel({ ...utilizadores[0], id_area: 3 }),
  atualizavel({ ...utilizadores[1], id_area: 4 })
];
const badges = [
  { id_badge: 1, deleted_badge: false, validade: null },
  { id_badge: 2, deleted_badge: false, validade: 365 },
  { id_badge: 3, deleted_badge: false, validade: null },
  { id_badge: 4, deleted_badge: true, validade: null }
];
const registosBadges = [
  { id_utilizador: 7, id_badge: 1, expirado: false, data_obtencao: new Date('2026-01-01T00:00:00Z') },
  { id_utilizador: 7, id_badge: 2, expirado: false, data_obtencao: new Date('2026-01-01T00:00:00Z') },
  { id_utilizador: 8, id_badge: 3, expirado: false, data_obtencao: new Date('2026-01-01T00:00:00Z') }
];
const objetivos = [
  atualizavel({
    id_objetivo: 50,
    id_badge: 3,
    id_utilizador: 8,
    data_inicial: new Date('2026-07-01T00:00:00Z'),
    data_final: new Date('2026-12-01T00:00:00Z'),
    deleted_objetivo: false,
    data_eliminacao: null,
    data_conclusao: null
  })
];
const assinaturas = [
  atualizavel({ id_assinatura: 1, id_proprietario: 7, update_assinatura: new Date('2026-01-01T00:00:00Z') }),
  atualizavel({ id_assinatura: 2, id_proprietario: 8, update_assinatura: new Date('2026-01-01T00:00:00Z') })
];
const badgesAssinatura = [
  { id_assinatura: 1, id_badge: 1 },
  { id_assinatura: 2, id_badge: 3 }
];
const mobileOperations = [];
let nextObjectiveId = 100;
let nextSignatureId = 3;
let nextMobileOperationId = 1;
let transactionCount = 0;

function valorOperador(whereValue) {
  if (!whereValue || typeof whereValue !== 'object') return undefined;
  const symbol = Object.getOwnPropertySymbols(whereValue)[0];
  return symbol ? whereValue[symbol] : undefined;
}

function corresponde(record, where) {
  return Object.entries(where).every(([field, expected]) => {
    if (expected && typeof expected === 'object') {
      const operand = valorOperador(expected);
      if (Array.isArray(operand)) return operand.map(Number).includes(Number(record[field]));
      if (operand !== undefined) return Number(record[field]) !== Number(operand);
    }
    return record[field] === expected || Number(record[field]) === Number(expected);
  });
}

const fakeDb = {
  sequelize: {
    async transaction(options, callback) {
      transactionCount += 1;
      const handler = typeof options === 'function' ? options : callback;
      return handler({ LOCK: { UPDATE: 'UPDATE' } });
    }
  },
  Utilizador: {
    async findByPk(id) {
      return utilizadores.find((user) => user.id_utilizador === Number(id)) || null;
    },
    async findOne({ where }) {
      return utilizadores.find((user) => corresponde(user, where)) || null;
    }
  },
  Consultor: {
    async findOne({ where }) {
      return consultores.find((user) => corresponde(user, where)) || null;
    }
  },
  Badges: {
    async findOne({ where }) {
      return badges.find((badge) => corresponde(badge, where)) || null;
    },
    async findAll({ where }) {
      return badges.filter((badge) => corresponde(badge, where));
    }
  },
  Objetivos: {
    async findOne({ where }) {
      return objetivos.find((objetivo) => corresponde(objetivo, where)) || null;
    },
    async create(values) {
      const objetivo = atualizavel({ id_objetivo: nextObjectiveId++, ...values });
      objetivos.push(objetivo);
      return objetivo;
    }
  },
  RegistoBadges: {
    async findAll({ where }) {
      return registosBadges.filter((registo) => corresponde(registo, where));
    }
  },
  Assinatura: {
    async findOne({ where }) {
      return assinaturas.find((assinatura) => corresponde(assinatura, where)) || null;
    },
    async create(values) {
      const assinatura = atualizavel({ id_assinatura: nextSignatureId++, ...values });
      assinaturas.push(assinatura);
      return assinatura;
    }
  },
  BadgesAssinatura: {
    async destroy({ where }) {
      for (let index = badgesAssinatura.length - 1; index >= 0; index -= 1) {
        if (corresponde(badgesAssinatura[index], where)) badgesAssinatura.splice(index, 1);
      }
    },
    async bulkCreate(values) {
      badgesAssinatura.push(...values);
      return values;
    }
  },
  MobileOperation: {
    async findOne({ where }) {
      return mobileOperations.find((operation) => corresponde(operation, where)) || null;
    },
    async findByPk(id) {
      return mobileOperations.find((operation) => operation.id_mobile_operation === Number(id)) || null;
    },
    async create(values) {
      const operation = atualizavel({ id_mobile_operation: nextMobileOperationId++, ...values });
      mobileOperations.push(operation);
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

const mobileRoutes = require('../routes/mobile_sync_routes');
const app = express();
app.use(express.json());
app.use('/api/mobile', mobileRoutes);

function tokenPara(idUtilizador) {
  return jwt.sign({
    id_utilizador: idUtilizador,
    token_type: 'mobile_access'
  }, MOBILE_SECRET, {
    algorithm: 'HS256',
    subject: String(idUtilizador),
    issuer: 'softinsa-pint',
    audience: 'mobile-api',
    expiresIn: 900
  });
}

const accessToken = tokenPara(7);
let server;
let baseUrl;
let objectiveId;
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
  const headers = { 'Idempotency-Key': `mutation-test-${operationCounter}` };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (token !== null) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: response.status, body: await response.json() };
}

test('1. cria objetivo válido para o utilizador do token', async () => {
  const response = await request('POST', '/api/mobile/objectives', {
    body: {
      id_badge: 1,
      data_inicial: '2026-07-16',
      data_final: '2026-12-31',
      id_utilizador: 8
    }
  });
  objectiveId = response.body.objective?.id_objetivo;
  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.objective.id_utilizador, 7);
  assert.equal(objetivos.find((item) => item.id_objetivo === objectiveId).id_utilizador, 7);
});

test('2. criar objetivo sem id_badge devolve 400', async () => {
  const response = await request('POST', '/api/mobile/objectives', {
    body: { data_inicial: '2026-07-16', data_final: '2026-12-31' }
  });
  assert.equal(response.status, 400);
});

test('3. criar objetivo com datas inválidas devolve 400', async () => {
  const invalid = await request('POST', '/api/mobile/objectives', {
    body: { id_badge: 2, data_inicial: '2026-02-30', data_final: '2026-12-31' }
  });
  const reversed = await request('POST', '/api/mobile/objectives', {
    body: { id_badge: 2, data_inicial: '2026-12-31', data_final: '2026-07-16' }
  });
  assert.equal(invalid.status, 400);
  assert.equal(reversed.status, 400);
});

test('4. elimina objetivo próprio por soft delete', async () => {
  const response = await request('DELETE', `/api/mobile/objectives/${objectiveId}`);
  const persisted = objetivos.find((item) => item.id_objetivo === objectiveId);
  assert.equal(response.status, 200);
  assert.equal(response.body.deleted, true);
  assert.equal(persisted.deleted_objetivo, true);
  assert.ok(persisted.data_eliminacao instanceof Date);
});

test('5. recusa eliminar objetivo de outro utilizador', async () => {
  const response = await request('DELETE', '/api/mobile/objectives/50');
  assert.equal(response.status, 403);
  assert.equal(objetivos.find((item) => item.id_objetivo === 50).deleted_objetivo, false);
});

test('6. repetir eliminação é idempotente', async () => {
  const firstDeletionDate = objetivos.find((item) => item.id_objetivo === objectiveId).data_eliminacao;
  const response = await request('DELETE', `/api/mobile/objectives/${objectiveId}`);
  assert.equal(response.status, 200);
  assert.equal(response.body.deleted, true);
  assert.equal(objetivos.find((item) => item.id_objetivo === objectiveId).data_eliminacao, firstDeletionDate);
});

test('7. atualiza perfil apenas com os campos permitidos', async () => {
  const beforeTransactions = transactionCount;
  const response = await request('PUT', '/api/mobile/profile', {
    body: {
      nome: 'Nome Atualizado',
      email: 'novo@example.com',
      telefone: '934567890',
      foto: 'https://example.com/nova.png'
    }
  });
  assert.equal(response.status, 200);
  assert.equal(response.body.profile.nome, 'Nome Atualizado');
  assert.equal(utilizadores[0].nome_user, 'Nome Atualizado');
  assert.equal(consultores[0].nome_user, 'Nome Atualizado');
  assert.equal(utilizadores[0].email, 'novo@example.com');
  assert.equal(transactionCount, beforeTransactions + 3);
});

test('8. recusa atualizar campo de perfil proibido', async () => {
  const response = await request('PUT', '/api/mobile/profile', {
    body: { ativo: false }
  });
  assert.equal(response.status, 400);
  assert.equal(utilizadores[0].ativo, true);
});

test('9. atualiza assinatura válida numa transação', async () => {
  const beforeTransactions = transactionCount;
  const response = await request('PUT', '/api/mobile/signature', {
    body: { badge_ids: [1, 2] }
  });
  const ownLinks = badgesAssinatura.filter((item) => item.id_assinatura === 1);
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.signature.badge_ids, [1, 2]);
  assert.deepEqual(ownLinks.map((item) => item.id_badge), [1, 2]);
  assert.equal(transactionCount, beforeTransactions + 3);
});

test('10. recusa assinatura com badge de outro utilizador', async () => {
  const response = await request('PUT', '/api/mobile/signature', {
    body: { badge_ids: [3] }
  });
  assert.equal(response.status, 403);
  assert.deepEqual(
    badgesAssinatura.filter((item) => item.id_assinatura === 1).map((item) => item.id_badge),
    [1, 2]
  );
});

test('11. recusa assinatura com duplicados', async () => {
  const response = await request('PUT', '/api/mobile/signature', {
    body: { badge_ids: [1, 1] }
  });
  assert.equal(response.status, 400);
});

test('12. assinatura vazia remove apenas os badges do próprio utilizador', async () => {
  const response = await request('PUT', '/api/mobile/signature', {
    body: { badge_ids: [] }
  });
  assert.equal(response.status, 200);
  assert.equal(badgesAssinatura.some((item) => item.id_assinatura === 1), false);
  assert.equal(badgesAssinatura.some((item) => item.id_assinatura === 2 && item.id_badge === 3), true);
});

test('13. acesso sem token devolve 401', async () => {
  const response = await request('PUT', '/api/mobile/profile', {
    token: null,
    body: { nome: 'Sem Token' }
  });
  assert.equal(response.status, 401);
});

test('14. token inválido devolve 401', async () => {
  const response = await request('PUT', '/api/mobile/profile', {
    token: 'token-invalido',
    body: { nome: 'Token Inválido' }
  });
  assert.equal(response.status, 401);
});

test('15. operações ficam isoladas entre utilizadores', async () => {
  const nomeUser7 = utilizadores[0].nome_user;
  const response = await request('PUT', '/api/mobile/profile', {
    token: tokenPara(8),
    body: { nome: 'Apenas Utilizador Oito' }
  });
  assert.equal(response.status, 200);
  assert.equal(utilizadores[1].nome_user, 'Apenas Utilizador Oito');
  assert.equal(consultores[1].nome_user, 'Apenas Utilizador Oito');
  assert.equal(utilizadores[0].nome_user, nomeUser7);
});

test('16. rotas web de objetivos e perfil permanecem com os contratos existentes', () => {
  const objectiveRoutes = fs.readFileSync(path.join(__dirname, '../routes/objetivos_routes.js'), 'utf8');
  const profileRoutes = fs.readFileSync(path.join(__dirname, '../routes/profile_routes.js'), 'utf8');
  assert.match(objectiveRoutes, /router\.post\("\/", authMiddleware, Controller\.criarObjetivo\)/);
  assert.match(objectiveRoutes, /router\.delete\("\/:id", authMiddleware, Controller\.removerObjetivo\)/);
  assert.match(profileRoutes, /router\.post\("\/updateassinatura", authMiddleware, Controller\.atualizarPerfilCompleto\)/);
});

test('17. rota e serviço de sync permanecem separados das mutações', () => {
  const routes = fs.readFileSync(path.join(__dirname, '../routes/mobile_sync_routes.js'), 'utf8');
  const syncService = fs.readFileSync(path.join(__dirname, '../services/mobile_sync_service.js'), 'utf8');
  assert.match(routes, /router\.get\('\/sync', mobileAuthMiddleware, mobileSyncController\.sincronizar\)/);
  assert.doesNotMatch(syncService, /mobile_mutation/);
});

test('18. auth e devices mobile mantêm os routers e controllers anteriores', () => {
  const routes = fs.readFileSync(path.join(__dirname, '../routes/mobile_sync_routes.js'), 'utf8');
  const deviceRoutes = fs.readFileSync(path.join(__dirname, '../routes/mobile_device_routes.js'), 'utf8');
  assert.match(routes, /router\.use\('\/auth', mobileAuthRoutes\)/);
  assert.match(routes, /router\.use\('\/devices', mobileDeviceRoutes\)/);
  assert.match(deviceRoutes, /mobileDevicesController\.registerDevice/);
  assert.match(deviceRoutes, /mobileDevicesController\.deactivateDevice/);
});
