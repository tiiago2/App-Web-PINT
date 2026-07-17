const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { after, before, test } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');

const MOBILE_SECRET = 'mobile-device-tests-secret-with-32-characters';
process.env.MOBILE_JWT_SECRET = MOBILE_SECRET;

const utilizador = {
  id_utilizador: 7,
  nome_user: 'Consultor Mobile',
  email: 'mobile@example.com',
  telefone: 912345678,
  imagem_perfil: 'https://example.com/mobile.png',
  ativo: true
};
const consultor = {
  id_utilizador: 7,
  id_area: 3,
  ativo: true
};
let nextId = 2;
const devices = [{
  id_mobile_device: 1,
  id_utilizador: 8,
  device_id: 'device-outro-utilizador',
  fcm_token: 'fcm-outro-utilizador',
  platform: 'android',
  ativo: true,
  created_at: new Date(),
  updated_at: new Date()
}];

function corresponde(record, where) {
  return Object.entries(where).every(([key, value]) => record[key] === value);
}

function tornarAtualizavel(record) {
  Object.defineProperty(record, 'update', {
    configurable: true,
    enumerable: false,
    value: async (values) => {
      Object.assign(record, values);
      return record;
    }
  });
  return record;
}

devices.forEach(tornarAtualizavel);

const fakeDb = {
  sequelize: {
    async transaction(callback) {
      return callback({ LOCK: { UPDATE: 'UPDATE' } });
    }
  },
  Utilizador: {
    async findByPk(id) {
      return Number(id) === utilizador.id_utilizador ? utilizador : null;
    }
  },
  Consultor: {
    async findOne({ where }) {
      return Number(where.id_utilizador) === consultor.id_utilizador ? consultor : null;
    }
  },
  MobileDevice: {
    async update(values, { where }) {
      let affected = 0;
      for (const device of devices) {
        if (corresponde(device, where)) {
          Object.assign(device, values);
          affected += 1;
        }
      }
      return [affected];
    },
    async findOne({ where }) {
      return devices.find((device) => corresponde(device, where)) || null;
    },
    async create(values) {
      const device = tornarAtualizavel({
        id_mobile_device: nextId++,
        ...values
      });
      devices.push(device);
      return device;
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

const mobileDeviceRoutes = require('../routes/mobile_device_routes');
const app = express();
app.use(express.json());
app.use('/api/mobile/devices', mobileDeviceRoutes);

const accessToken = jwt.sign({
  id_utilizador: utilizador.id_utilizador,
  token_type: 'mobile_access'
}, MOBILE_SECRET, {
  algorithm: 'HS256',
  subject: String(utilizador.id_utilizador),
  issuer: 'softinsa-pint',
  audience: 'mobile-api',
  expiresIn: 900
});

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

async function request(method, pathname, { body, authenticated = true } = {}) {
  const headers = {};
  if (body !== undefined) {
    headers['content-type'] = 'application/json';
  }
  if (authenticated) {
    headers.authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return {
    status: response.status,
    body: await response.json()
  };
}

test('1. PUT sem access token mobile devolve 401', async () => {
  const response = await request('PUT', '/api/mobile/devices', {
    authenticated: false,
    body: { device_id: 'device-7', fcm_token: 'fcm-7', platform: 'android' }
  });
  assert.equal(response.status, 401);
});

test('2. PUT com token mobile válido cria dispositivo para o utilizador autenticado', async () => {
  const response = await request('PUT', '/api/mobile/devices', {
    body: {
      device_id: 'device-7',
      fcm_token: 'fcm-7',
      platform: 'android',
      app_version: '1.0.0'
    }
  });
  const persisted = devices.find((device) => device.device_id === 'device-7');

  assert.equal(response.status, 201);
  assert.equal(persisted.id_utilizador, utilizador.id_utilizador);
  assert.equal(persisted.fcm_token, 'fcm-7');
  assert.equal(persisted.ativo, true);
  assert.equal(Object.hasOwn(persisted, 'app_version'), false);
});

test('3. PUT sem device_id devolve 400', async () => {
  const response = await request('PUT', '/api/mobile/devices', {
    body: { fcm_token: 'fcm-sem-device', platform: 'android' }
  });
  assert.equal(response.status, 400);
});

test('4. PUT sem fcm_token devolve 400', async () => {
  const response = await request('PUT', '/api/mobile/devices', {
    body: { device_id: 'device-sem-fcm', platform: 'android' }
  });
  assert.equal(response.status, 400);
});

test('5. PUT do mesmo device_id atualiza o token FCM e mantém o vínculo', async () => {
  const response = await request('PUT', '/api/mobile/devices', {
    body: { device_id: 'device-7', fcm_token: 'fcm-7-novo', platform: 'ios' }
  });
  const persisted = devices.find((device) => device.device_id === 'device-7');

  assert.equal(response.status, 200);
  assert.equal(persisted.id_utilizador, utilizador.id_utilizador);
  assert.equal(persisted.fcm_token, 'fcm-7-novo');
  assert.equal(persisted.platform, 'ios');
  assert.equal(persisted.ativo, true);
});

test('6. DELETE sem access token mobile devolve 401', async () => {
  const response = await request('DELETE', '/api/mobile/devices/device-7', {
    authenticated: false
  });
  assert.equal(response.status, 401);
});

test('7. DELETE do próprio dispositivo desativa sem apagar fisicamente', async () => {
  const response = await request('DELETE', '/api/mobile/devices/device-7');
  const persisted = devices.find((device) => device.device_id === 'device-7');

  assert.equal(response.status, 200);
  assert.equal(persisted.ativo, false);
  assert.ok(devices.includes(persisted));
});

test('8. DELETE repetido é idempotente', async () => {
  const response = await request('DELETE', '/api/mobile/devices/device-7');
  const persisted = devices.find((device) => device.device_id === 'device-7');

  assert.equal(response.status, 200);
  assert.equal(persisted.ativo, false);
});

test('9. DELETE não afeta dispositivo de outro utilizador', async () => {
  const otherDevice = devices.find((device) => device.id_utilizador === 8);
  const response = await request(
    'DELETE',
    `/api/mobile/devices/${otherDevice.device_id}`
  );

  assert.equal(response.status, 200);
  assert.equal(otherDevice.ativo, true);
});

test('10. as rotas existentes /api/me/devices permanecem com o middleware web', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'routes', 'me_routes.js'),
    'utf8'
  );
  assert.match(source, /router\.put\('\/devices', authMiddleware, mobileDevicesController\.registerDevice\)/);
  assert.match(source, /router\.delete\('\/devices\/:deviceId', authMiddleware, mobileDevicesController\.deactivateDevice\)/);
});

test('11. /api/mobile/sync permanece protegido e usa o middleware mobile da Fase 4', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'routes', 'mobile_sync_routes.js'),
    'utf8'
  );
  assert.match(source, /router\.get\('\/sync', mobileAuthMiddleware, mobileSyncController\.sincronizar\)/);
});
