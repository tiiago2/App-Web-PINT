const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const mobileAuthServiceModule = require('../services/mobile_auth_service');
const mobileAuthControllerModule = require('../controllers/mobile_auth_controller');
const mobileAuthMiddlewareModule = require('../middleware/mobile_auth_middleware');

const TEST_ENV = {
  MOBILE_JWT_SECRET: 'mobile-test-secret-with-at-least-32-characters',
  MOBILE_ACCESS_TOKEN_TTL_SECONDS: '900',
  MOBILE_REFRESH_TOKEN_TTL_DAYS: '30'
};

function criarResposta() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

function criarContexto() {
  let currentTime = Date.now();
  let nextTokenId = 1;
  let transactionCalls = 0;
  const tokens = [];
  const utilizador = {
    id_utilizador: 7,
    nome_user: 'Consultor Teste',
    email: 'consultor@example.com',
    telefone: 912345678,
    imagem_perfil: 'https://example.com/foto.png',
    password: 'password-hash',
    ativo: true
  };
  const consultor = {
    id_utilizador: 7,
    id_area: 3,
    ativo: true
  };

  function criarRegistoToken(data) {
    const record = {
      id_mobile_refresh_token: nextTokenId++,
      ...data,
      async update(values) {
        Object.assign(this, values);
        return this;
      }
    };
    tokens.push(record);
    return record;
  }

  const db = {
    sequelize: {
      async transaction(callback) {
        transactionCalls += 1;
        return callback({ LOCK: { UPDATE: 'UPDATE' } });
      }
    },
    Utilizador: {
      async findOne({ where }) {
        return where.email === utilizador.email ? utilizador : null;
      },
      async findByPk(id) {
        return Number(id) === utilizador.id_utilizador ? utilizador : null;
      }
    },
    Consultor: {
      async findOne({ where }) {
        return Number(where.id_utilizador) === consultor.id_utilizador
          ? consultor
          : null;
      }
    },
    MobileRefreshToken: {
      async findAll({ where }) {
        return tokens.filter((token) => (
          token.id_utilizador === where.id_utilizador
          && token.device_id === where.device_id
          && token.revoked_at === where.revoked_at
        ));
      },
      async findOne({ where }) {
        return tokens.find((token) => token.token_hash === where.token_hash) || null;
      },
      async create(data) {
        return criarRegistoToken(data);
      }
    }
  };
  const bcrypt = {
    async compare(password, hash) {
      return password === 'correct-password' && hash === utilizador.password;
    }
  };
  const service = mobileAuthServiceModule._criarParaTestes({
    db,
    bcrypt,
    jwt,
    crypto,
    env: TEST_ENV,
    now: () => new Date(currentTime)
  });

  return {
    service,
    tokens,
    utilizador,
    consultor,
    advanceDays(days) {
      currentTime += days * 24 * 60 * 60 * 1000;
    },
    get transactionCalls() {
      return transactionCalls;
    }
  };
}

async function loginValido(context, deviceId = 'device-1') {
  return context.service.login({
    email: context.utilizador.email,
    password: 'correct-password',
    deviceId
  });
}

test('1. login válido devolve access e refresh tokens sem persistir o token em claro', async () => {
  const context = criarContexto();
  const result = await loginValido(context);
  const decoded = jwt.decode(result.accessToken);

  assert.ok(result.accessToken);
  assert.ok(result.refreshToken);
  assert.equal(result.expiresIn, 900);
  assert.equal(decoded.exp - decoded.iat, 900);
  assert.equal(context.tokens.length, 1);
  assert.match(context.tokens[0].token_hash, /^[a-f0-9]{64}$/);
  assert.notEqual(context.tokens[0].token_hash, result.refreshToken);
  assert.equal(context.tokens[0].id_utilizador, context.utilizador.id_utilizador);
  assert.equal(context.tokens[0].device_id, 'device-1');
});

test('2. login inválido devolve erro genérico 401', async () => {
  const context = criarContexto();

  await assert.rejects(
    context.service.login({
      email: context.utilizador.email,
      password: 'wrong-password',
      deviceId: 'device-1'
    }),
    (error) => error.statusCode === 401 && error.message === 'Credenciais inválidas.'
  );
});

test('3. login sem device_id devolve 400 antes de chamar o service', async () => {
  let serviceCalled = false;
  const controller = mobileAuthControllerModule._criarParaTestes({
    async login() {
      serviceCalled = true;
    }
  });
  const response = criarResposta();

  await controller.login({
    body: { email: 'consultor@example.com', password: 'correct-password' }
  }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(serviceCalled, false);
});

test('4. refresh válido devolve novos tokens', async () => {
  const context = criarContexto();
  const login = await loginValido(context);
  const refreshed = await context.service.refresh({
    refreshToken: login.refreshToken,
    deviceId: 'device-1'
  });

  assert.ok(refreshed.accessToken);
  assert.ok(refreshed.refreshToken);
  assert.notEqual(refreshed.refreshToken, login.refreshToken);
});

test('5. refresh expirado é rejeitado', async () => {
  const context = criarContexto();
  const login = await loginValido(context);
  context.advanceDays(31);

  await assert.rejects(
    context.service.refresh({ refreshToken: login.refreshToken, deviceId: 'device-1' }),
    (error) => error.statusCode === 401 && /expirado/.test(error.message)
  );
});

test('6. refresh revogado é rejeitado', async () => {
  const context = criarContexto();
  const login = await loginValido(context);
  context.tokens[0].revoked_at = new Date();

  await assert.rejects(
    context.service.refresh({ refreshToken: login.refreshToken, deviceId: 'device-1' }),
    (error) => error.statusCode === 401 && /revogado/.test(error.message)
  );
});

test('7. refresh com device_id incorreto é rejeitado', async () => {
  const context = criarContexto();
  const login = await loginValido(context);

  await assert.rejects(
    context.service.refresh({ refreshToken: login.refreshToken, deviceId: 'device-2' }),
    (error) => error.statusCode === 401 && /dispositivo/.test(error.message)
  );
});

test('8. rotação revoga o token anterior e liga-o ao substituto numa transação', async () => {
  const context = criarContexto();
  const login = await loginValido(context);
  const anterior = context.tokens[0];

  await context.service.refresh({ refreshToken: login.refreshToken, deviceId: 'device-1' });

  assert.ok(anterior.revoked_at);
  assert.equal(anterior.replaced_by_token_id, context.tokens[1].id_mobile_refresh_token);
  assert.equal(context.transactionCalls, 2);
});

test('9. reutilização do token antigo após rotação é rejeitada', async () => {
  const context = criarContexto();
  const login = await loginValido(context);
  await context.service.refresh({ refreshToken: login.refreshToken, deviceId: 'device-1' });

  await assert.rejects(
    context.service.refresh({ refreshToken: login.refreshToken, deviceId: 'device-1' }),
    (error) => error.statusCode === 401
  );
});

test('10. logout revoga o refresh token sem alterar o dispositivo FCM', async () => {
  const context = criarContexto();
  const login = await loginValido(context);

  await context.service.logout({ refreshToken: login.refreshToken, deviceId: 'device-1' });

  assert.ok(context.tokens[0].revoked_at);
  assert.equal(Object.hasOwn(context.tokens[0], 'fcm_token'), false);
});

test('11. logout repetido é idempotente', async () => {
  const context = criarContexto();
  const login = await loginValido(context);

  await context.service.logout({ refreshToken: login.refreshToken, deviceId: 'device-1' });
  const result = await context.service.logout({
    refreshToken: login.refreshToken,
    deviceId: 'device-1'
  });

  assert.deepEqual(result, { success: true });
});

test('12. /me com access token válido disponibiliza o perfil mobile mínimo', async () => {
  const context = criarContexto();
  const login = await loginValido(context);
  const middleware = mobileAuthMiddlewareModule._criarParaTestes(context.service);
  const controller = mobileAuthControllerModule._criarParaTestes(context.service);
  const request = { headers: { authorization: `Bearer ${login.accessToken}` } };
  const middlewareResponse = criarResposta();
  let nextCalled = false;

  await middleware(request, middlewareResponse, () => { nextCalled = true; });
  const response = criarResposta();
  controller.me(request, response);

  assert.equal(nextCalled, true);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(Object.keys(response.body.user), [
    'id', 'nome', 'email', 'telefone', 'foto', 'area_id'
  ]);
});

test('13. /me sem token devolve 401', async () => {
  const context = criarContexto();
  const middleware = mobileAuthMiddlewareModule._criarParaTestes(context.service);
  const response = criarResposta();

  await middleware({ headers: {} }, response, () => {});

  assert.equal(response.statusCode, 401);
});

test('14. /me com access token expirado devolve 401', async () => {
  const context = criarContexto();
  const middleware = mobileAuthMiddlewareModule._criarParaTestes(context.service);
  const expiredToken = jwt.sign({
    id_utilizador: context.utilizador.id_utilizador,
    token_type: 'mobile_access'
  }, TEST_ENV.MOBILE_JWT_SECRET, {
    algorithm: 'HS256',
    subject: String(context.utilizador.id_utilizador),
    issuer: 'softinsa-pint',
    audience: 'mobile-api',
    expiresIn: -1
  });
  const response = criarResposta();

  await middleware({
    headers: { authorization: `Bearer ${expiredToken}` }
  }, response, () => {});

  assert.equal(response.statusCode, 401);
  assert.match(response.body.error, /expirado/);
});

test('15. POST /api/login web permanece registado e separado do router mobile', () => {
  const root = path.join(__dirname, '..');
  const centralRoutes = fs.readFileSync(path.join(root, 'routes', 'central_rotas.js'), 'utf8');
  const webAuth = fs.readFileSync(path.join(root, 'controllers', 'auth_controller.js'), 'utf8');
  const mobileRoutes = fs.readFileSync(path.join(root, 'routes', 'mobile_auth_routes.js'), 'utf8');

  assert.match(centralRoutes, /router\.post\(["']\/login["'], controller_login\.login\)/);
  assert.match(webAuth, /expiresIn:\s*['"]8h['"]/);
  assert.doesNotMatch(mobileRoutes, /\.\.\/controllers\/auth_controller/);
  assert.doesNotMatch(mobileRoutes, /\.\.\/middleware\/auth_middleware/);
});
