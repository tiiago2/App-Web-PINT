const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { before, test } = require('node:test');

const FIXED_SYNC_UNTIL = new Date('2026-07-16T20:30:00.123Z');
const transaction = { id: 'mobile-sync-transaction' };
const calls = [];
let transactionOptions;
let rankingOptions;
let personalBadgesOptions;

const utilizador = {
  id_utilizador: 7,
  nome_user: 'Consultor Sete',
  email: 'sete@example.com',
  telefone: 912345678,
  imagem_perfil: 'https://example.com/sete.png',
  ativo: true,
  update_user: new Date('2026-07-16T19:00:00.000Z')
};
const consultor = {
  id_utilizador: 7,
  id_area: 3,
  pontos_totais: 120,
  ativo: true,
  update_user: new Date('2026-07-16T19:00:00.000Z'),
  Area: {
    id_area: 3,
    id_service_line: 2,
    nome_area: 'Área Mobile',
    ServiceLine: {
      id_service_line: 2,
      id_learning_path: 1,
      nome_service_line: 'Service Mobile',
      LearningPath: {
        id_learning_path: 1,
        nome_learning_path: 'Learning Mobile'
      }
    }
  }
};
const submissao = {
  id_submissao: 70,
  id_badge: 5,
  id_utilizador: 7,
  status: 'pendente',
  data_submissao: new Date('2026-07-16T20:00:00.000Z')
};
const historico = {
  id_utilizador: 9,
  id_submissao: 70,
  aceite: true,
  feedback: 'ok',
  data_avaliacao: new Date('2026-07-16T20:05:00.000Z')
};
const documentoAtivo = {
  id_submissao: 70,
  id_ficheiro: 700,
  id_requisito: 4,
  ficheiro: 'https://example.com/doc.pdf',
  updated_file: new Date('2026-07-16T20:10:00.000Z'),
  deleted_file: false
};
const documentoEliminado = {
  ...documentoAtivo,
  deleted_file: true,
  updated_file: new Date('2026-07-16T20:20:00.000Z')
};
const objetivoAtivo = {
  id_objetivo: 30,
  id_badge: 5,
  id_utilizador: 7,
  data_inicial: new Date('2026-07-16T18:00:00.000Z'),
  data_final: new Date('2026-08-16T18:00:00.000Z'),
  deleted_objetivo: false,
  data_eliminacao: null,
  data_conclusao: null,
  notificacao_fim: false
};
const objetivoEliminado = {
  ...objetivoAtivo,
  deleted_objetivo: true,
  data_eliminacao: new Date('2026-07-16T20:15:00.000Z')
};
const cursorEvent = {
  change_id: 10,
  entity: 'badges',
  record_id: '5',
  id_utilizador: null,
  operation: 'update',
  changed_at: new Date('2026-07-16T20:25:00.000Z'),
  metadata_json: { id_badge: 5 }
};

function record(model, method, options) {
  calls.push({ model, method, options });
}

function model(name, handlers = {}) {
  return {
    async findAll(options = {}) {
      record(name, 'findAll', options);
      return handlers.findAll ? handlers.findAll(options) : [];
    },
    async findOne(options = {}) {
      record(name, 'findOne', options);
      return handlers.findOne ? handlers.findOne(options) : null;
    },
    async findByPk(id, options = {}) {
      record(name, 'findByPk', { id, ...options });
      return handlers.findByPk ? handlers.findByPk(id, options) : null;
    }
  };
}

const fakeDb = {
  sequelize: {
    async transaction(options, callback) {
      transactionOptions = options;
      return callback(transaction);
    },
    async query(sql, options) {
      calls.push({ model: 'sequelize', method: 'query', sql, options });
      return [{ sync_until: FIXED_SYNC_UNTIL }];
    }
  },
  Utilizador: model('Utilizador', {
    findByPk: (id) => Number(id) === 7 ? utilizador : null,
    findOne: () => null
  }),
  Consultor: model('Consultor', {
    findByPk: (id) => Number(id) === 7 ? consultor : null,
    findOne: () => null
  }),
  Nivel: model('Nivel', {
    findAll: () => [{ id_nivel: 1, nome_nivel: 'Inicial' }]
  }),
  Permissoes: model('Permissoes', {
    findAll: () => [{ id_permissao: 1, descricao_permissao: 'Mobile', toggle: true }]
  }),
  LearningPath: model('LearningPath', {
    findAll: () => [{ id_learning_path: 1, nome_learning_path: 'Learning Mobile', deleted_path: false }],
    findOne: () => null
  }),
  ServiceLine: model('ServiceLine', {
    findAll: () => [{ id_service_line: 2, id_learning_path: 1, nome_service_line: 'Service Mobile', deleted_service: false }],
    findOne: () => null
  }),
  Area: model('Area', {
    findAll: () => [{ id_area: 3, id_service_line: 2, nome_area: 'Área Mobile', deleted_area: false }],
    findOne: () => null
  }),
  Badges: model('Badges', {
    findAll: () => [{ id_badge: 5, id_area: 3, id_nivel: 1, nome_badge: 'Badge Mobile', deleted_badge: false }]
  }),
  Requisitos: model('Requisitos', {
    findAll: () => [{ id_requisito: 4, nome_requisito: 'Requisito', deleted_requisitos: false }]
  }),
  RequisitosBadge: model('RequisitosBadge', {
    findAll: () => [{ id_badge: 5, id_requisito: 4 }]
  }),
  SyncRequisitoBadgeDeleted: model('SyncRequisitoBadgeDeleted', {
    findAll: () => [{ id_sync_delete: 1, id_badge: 6, id_requisito: 8, deleted_at: FIXED_SYNC_UNTIL }]
  }),
  RegistoBadges: model('RegistoBadges', {
    findAll: () => [{ id_registo: 2, id_badge: 5, id_utilizador: 7, data_obtencao: FIXED_SYNC_UNTIL, expirado: false }]
  }),
  Submissoes: model('Submissoes', {
    findAll: (options) => options.attributes?.length === 1
      ? [{ id_submissao: submissao.id_submissao }]
      : [submissao]
  }),
  Historico: model('Historico', {
    findAll: (options) => options.attributes?.length === 1
      ? [{ id_submissao: submissao.id_submissao }]
      : [historico]
  }),
  Documentos: model('Documentos', {
    findAll: (options) => options.where?.deleted_file === false
      ? [documentoAtivo]
      : [documentoEliminado]
  }),
  Objetivos: model('Objetivos', {
    findAll: (options) => options.where?.deleted_objetivo === false
      ? [objetivoAtivo]
      : [objetivoEliminado]
  }),
  Recetor: model('Recetor', {
    findAll: () => [{ id_notificacao: 90, id_utilizador: 7, lida: false, last_read: null }]
  }),
  Notificacoes: model('Notificacoes', {
    findAll: () => [{ id_notificacao: 90, descricao_notificacao: 'Apenas para o sete', tipo_notificacao: 'mobile' }]
  }),
  SyncRecetorDeleted: model('SyncRecetorDeleted', {
    findAll: () => [{ id_sync_delete: 2, id_notificacao: 91, id_utilizador: 7, deleted_at: FIXED_SYNC_UNTIL }]
  }),
  MobileSyncChange: model('MobileSyncChange', {
    findAll: () => [cursorEvent],
    findOne: () => cursorEvent
  }),
  Assinatura: model('Assinatura', {
    findOne: () => ({ id_assinatura: 12, id_proprietario: 7, update_assinatura: FIXED_SYNC_UNTIL })
  }),
  BadgesAssinatura: model('BadgesAssinatura', {
    findAll: () => [{ id_assinatura: 12, id_badge: 5 }]
  })
};

function injectModule(modulePath, exports) {
  require.cache[modulePath] = {
    id: modulePath,
    filename: modulePath,
    loaded: true,
    exports,
    children: [],
    paths: []
  };
}

injectModule(require.resolve('../models'), fakeDb);
injectModule(require.resolve('../helpers/rankingHelper'), {
  async calcularRanking(idServiceLine, options) {
    rankingOptions = options;
    return [
      { id: 7, nome: 'Consultor Sete', id_area: 3, pontos_semana: 5, pontos_mes: 10, pontos_ano: 20 },
      { id: 8, nome: 'Consultor Oito', id_area: 4, pontos_semana: 2, pontos_mes: 4, pontos_ano: 8 }
    ];
  }
});
injectModule(require.resolve('../services/personal_badges_service'), {
  async carregarEstadoPessoalBadges(idUtilizador, options) {
    personalBadgesOptions = { idUtilizador, ...options };
    return [{ id_badge: 5, estado: 'conquistados' }];
  }
});

const mobileSyncService = require('../services/mobile_sync_service');
const mobileSyncController = require('../controllers/mobile_sync_controller');

let fullResult;
let incrementalResult;
let cursorResult;

before(async () => {
  fullResult = await mobileSyncService.sincronizarMobile({
    idUtilizador: 7,
    since: null
  });
  incrementalResult = await mobileSyncService.sincronizarMobile({
    idUtilizador: 7,
    since: new Date('2026-07-16T20:00:00.000Z')
  });
  cursorResult = await mobileSyncService.sincronizarMobile({
    idUtilizador: 7,
    cursor: {
      changedAt: new Date('2026-07-16T20:00:00.000Z'),
      changeId: 0
    },
    limit: 10
  });
});

function responseMock() {
  return {
    statusCode: null,
    body: null,
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

test('1. sync sem since devolve snapshot completo e usa REPEATABLE READ', async () => {
  const controller = mobileSyncController._criarParaTestes({
    sincronizarMobile: async () => fullResult
  });
  const response = responseMock();
  await controller.sincronizar({ query: {}, mobileAuth: { id_utilizador: 7 } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.mode, 'full');
  assert.equal(transactionOptions.isolationLevel, 'REPEATABLE READ');
  assert.equal(transactionOptions.readOnly, true);
});

test('2. sync com since ISO válido usa modo incremental e passa uma Date ao service', async () => {
  let received;
  const controller = mobileSyncController._criarParaTestes({
    async sincronizarMobile(input) {
      received = input;
      return incrementalResult;
    }
  });
  const response = responseMock();
  await controller.sincronizar({
    query: { since: '2026-07-16T20:00:00.000Z' },
    mobileAuth: { id_utilizador: 7 }
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.mode, 'incremental');
  assert.ok(received.since instanceof Date);
  assert.equal(received.idUtilizador, 7);
});

test('3. since inválido devolve 400 sem chamar o service', async () => {
  let called = false;
  const controller = mobileSyncController._criarParaTestes({
    async sincronizarMobile() {
      called = true;
    }
  });
  const response = responseMock();
  await controller.sincronizar({
    query: { since: '2026-99-99' },
    mobileAuth: { id_utilizador: 7 }
  }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(called, false);
});

test('4. utilizador sem alterações recebe coleções incrementais vazias', async () => {
  const emptyData = {
    perfil: null,
    permissoes: [], learning_paths: [], service_lines: [], areas: [],
    areas_service_lines: [], niveis: [], badges: [], user_badges: [], requisitos: [],
    requisitos_badges: { upserts: [], deleted: [] }, registos_badges: [],
    submissoes: [], historico: [], documentos: [], objetivos: [],
    notificacoes: { upserts: [], deleted: [] }, assinatura: null,
    recetores_notificacoes: [], badges_assinatura: [], outros_users: []
  };
  const controller = mobileSyncController._criarParaTestes({
    sincronizarMobile: async () => ({ data: emptyData, syncUntil: FIXED_SYNC_UNTIL })
  });
  const response = responseMock();
  await controller.sincronizar({
    query: { since: '2026-07-16T20:00:00.000Z' },
    mobileAuth: { id_utilizador: 7 }
  }, response);

  assert.deepEqual(response.body.data.submissoes, []);
  assert.deepEqual(response.body.data.notificacoes.upserts, []);
  assert.deepEqual(response.body.deleted.objectives, []);
});

test('5. consultas pessoais usam apenas o id do utilizador autenticado e não expõem segredos', () => {
  const personalCalls = calls.filter((call) => [
    'RegistoBadges', 'Submissoes', 'Objetivos', 'Recetor', 'SyncRecetorDeleted', 'Assinatura'
  ].includes(call.model));
  assert.ok(personalCalls.some((call) => call.options?.where?.id_utilizador === 7));
  assert.ok(personalCalls.some((call) => call.options?.where?.id_proprietario === 7));
  assert.doesNotMatch(JSON.stringify(fullResult.data), /password|token_hash|refresh_token/i);
});

test('6. profile está presente e contém apenas o consultor autenticado', () => {
  assert.equal(fullResult.data.perfil.id_utilizador, 7);
  assert.equal(fullResult.data.perfil.email, utilizador.email);
  assert.equal(fullResult.data.perfil.id_area, 3);
});

test('7. catálogo obrigatório está presente no snapshot', () => {
  for (const field of [
    'permissoes', 'learning_paths', 'service_lines', 'areas', 'niveis',
    'badges', 'requisitos', 'requisitos_badges'
  ]) {
    assert.ok(Object.hasOwn(fullResult.data, field), field);
  }
});

test('8. submissões e documentos pertencem apenas ao utilizador autenticado', () => {
  assert.ok(fullResult.data.submissoes.every((item) => item.id_utilizador === 7));
  assert.ok(fullResult.data.documentos.every((item) => item.id_submissao === 70));
});

test('9. notificações são obtidas através dos recetores do utilizador autenticado', () => {
  const receiverCall = calls.find((call) => call.model === 'Recetor');
  assert.equal(receiverCall.options.where.id_utilizador, 7);
  assert.deepEqual(fullResult.data.notificacoes.upserts.map((item) => item.id_notificacao), [90]);
});

test('10. tombstones e soft deletes são consolidados no bloco deleted', () => {
  const deleted = mobileSyncController._construirDeleted(incrementalResult.data);
  assert.equal(deleted.badge_requirements[0].id_badge, 6);
  assert.equal(Object.hasOwn(deleted.badge_requirements[0], 'id_sync_delete'), false);
  assert.equal(deleted.notification_receivers[0].id_utilizador, 7);
  assert.equal(deleted.objectives[0].id_objetivo, 30);
  assert.equal(deleted.submission_documents[0].id_ficheiro, 700);
  assert.equal(Object.hasOwn(deleted.submission_documents[0], 'ficheiro'), false);
  assert.deepEqual(deleted.signature_badges, []);
});

test('11. sync_until é obtido do servidor/base e está presente no contrato', () => {
  const timestampCall = calls.find((call) => call.model === 'sequelize' && call.method === 'query');
  assert.match(timestampCall.sql, /CURRENT_TIMESTAMP/);
  assert.equal(fullResult.syncUntil.toISOString(), FIXED_SYNC_UNTIL.toISOString());
  assert.equal(timestampCall.options.transaction, transaction);
  assert.equal(rankingOptions.transaction, transaction);
  assert.equal(rankingOptions.agora.toISOString(), FIXED_SYNC_UNTIL.toISOString());
  assert.equal(personalBadgesOptions.transaction, transaction);
  assert.equal(personalBadgesOptions.agora.toISOString(), FIXED_SYNC_UNTIL.toISOString());
});

test('12. /api/mobile/health permanece inalterado', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'routes', 'mobile_sync_routes.js'), 'utf8');
  assert.match(source, /router\.get\('\/health', mobileHealthController\.health\)/);
});

test('13. endpoints de autenticação mobile permanecem inalterados', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'routes', 'mobile_auth_routes.js'), 'utf8');
  assert.match(source, /router\.post\('\/login', mobileAuthController\.login\)/);
  assert.match(source, /router\.post\('\/refresh', mobileAuthController\.refresh\)/);
  assert.match(source, /router\.post\('\/logout', mobileAuthController\.logout\)/);
  assert.match(source, /router\.get\('\/me', mobileAuthMiddleware, mobileAuthController\.me\)/);
});

test('14. endpoints de dispositivos mobile permanecem inalterados', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'routes', 'mobile_device_routes.js'), 'utf8');
  assert.match(source, /router\.put\('\/', adaptarFcmToken, mobileDevicesController\.registerDevice\)/);
  assert.match(source, /router\.delete\('\/:deviceId', mobileDevicesController\.deactivateDevice\)/);
});

test('15. /api/mobile/sync continua protegido, agora pelo middleware mobile', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'routes', 'mobile_sync_routes.js'), 'utf8');
  assert.match(source, /router\.get\('\/sync', mobileAuthMiddleware, mobileSyncController\.sincronizar\)/);
  assert.doesNotMatch(source, /router\.get\('\/sync', authMiddleware/);
});

test('16. modo cursor projeta no payload apenas as entidades da página de eventos', () => {
  assert.deepEqual(cursorResult.data.badges.map((item) => item.id_badge), [5]);
  assert.deepEqual(cursorResult.data.learning_paths, []);
  assert.equal(cursorResult.nextCursor.changeId, 10);
  assert.equal(cursorResult.hasMore, false);
});
