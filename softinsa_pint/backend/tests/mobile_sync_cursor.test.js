const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { Op } = require('sequelize');

const T0 = new Date('2026-07-16T19:59:59.000Z');
const T1 = new Date('2026-07-16T20:00:00.000Z');
const T2 = new Date('2026-07-16T20:01:00.000Z');

const events = [
  { change_id: 1, entity: 'levels', record_id: '1', id_utilizador: null, operation: 'update', changed_at: T1, metadata_json: { id_nivel: 1 } },
  { change_id: 2, entity: 'objectives', record_id: '30', id_utilizador: 7, operation: 'delete', changed_at: T1, metadata_json: { id_objetivo: 30 } },
  { change_id: 3, entity: 'objectives', record_id: '31', id_utilizador: 8, operation: 'update', changed_at: T1, metadata_json: { id_objetivo: 31 } },
  { change_id: 4, entity: 'badge_requirements', record_id: '5:4', id_utilizador: null, operation: 'delete', changed_at: T1, metadata_json: { id_badge: 5, id_requisito: 4 } },
  { change_id: 5, entity: 'signature_badges', record_id: '12:5', id_utilizador: 7, operation: 'delete', changed_at: T1, metadata_json: { id_assinatura: 12, id_badge: 5 } },
  { change_id: 6, entity: 'notification_receivers', record_id: '90:7', id_utilizador: 7, operation: 'delete', changed_at: T1, metadata_json: { id_notificacao: 90, id_utilizador: 7 } },
  { change_id: 7, entity: 'badges', record_id: '5', id_utilizador: null, operation: 'update', changed_at: T1, metadata_json: { id_badge: 5 } },
  { change_id: 8, entity: 'submission_documents', record_id: '70:700', id_utilizador: 7, operation: 'delete', changed_at: T2, metadata_json: { id_submissao: 70, id_ficheiro: 700 } }
];

function cursorFromWhereCondition(condition, direction) {
  const branches = condition[Op.or];
  const timestampOperator = direction === 'after' ? Op.gt : Op.lt;
  const idOperator = direction === 'after' ? Op.gt : Op.lte;
  return {
    changedAt: branches[0].changed_at[timestampOperator],
    changeId: branches[1][Op.and][1].change_id[idOperator]
  };
}

function compareEventToCursor(event, cursor) {
  const difference = new Date(event.changed_at).getTime() - cursor.changedAt.getTime();
  return difference || Number(event.change_id) - cursor.changeId;
}

const fakeDb = {
  MobileSyncChange: {
    async findOne(options) {
      const userId = options.where[Op.or][1].id_utilizador;
      return [...events]
        .filter((event) => event.id_utilizador === null || event.id_utilizador === userId)
        .sort((a, b) => compareEventToCursor(b, {
          changedAt: new Date(a.changed_at),
          changeId: Number(a.change_id)
        }))[0] || null;
    },
    async findAll(options) {
      const conditions = options.where[Op.and];
      const after = cursorFromWhereCondition(conditions[0], 'after');
      const until = cursorFromWhereCondition(conditions[1], 'until');
      const userId = conditions[2][Op.or][1].id_utilizador;

      return events
        .filter((event) => event.id_utilizador === null || event.id_utilizador === userId)
        .filter((event) => compareEventToCursor(event, after) > 0)
        .filter((event) => compareEventToCursor(event, until) <= 0)
        .sort((left, right) => {
          const timeDifference = new Date(left.changed_at) - new Date(right.changed_at);
          return timeDifference || Number(left.change_id) - Number(right.change_id);
        })
        .slice(0, options.limit);
    },
    async create(values) {
      const event = {
        change_id: events.length + 1,
        changed_at: new Date(),
        ...values
      };
      events.push(event);
      return event;
    }
  }
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
const changeService = require('../services/mobile_sync_change_service');
injectModule(require.resolve('../services/mobile_sync_service'), {});
const syncControllerModule = require('../controllers/mobile_sync_controller');

const emptyData = {
  perfil: null,
  permissoes: [], learning_paths: [], service_lines: [], areas: [],
  areas_service_lines: [], niveis: [], badges: [], user_badges: [], requisitos: [],
  requisitos_badges: { upserts: [], deleted: [] }, registos_badges: [],
  submissoes: [], historico: [], documentos: [], objetivos: [],
  notificacoes: { upserts: [], deleted: [] }, assinatura: null,
  recetores_notificacoes: [], badges_assinatura: [], outros_users: []
};

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

function syncResult(overrides = {}) {
  return {
    data: emptyData,
    syncUntil: T2,
    nextCursor: { changedAt: T1, changeId: 7 },
    hasMore: false,
    changeDeletes: [],
    ...overrides
  };
}

async function invokeController(query, serviceResult = syncResult()) {
  let input;
  const controller = syncControllerModule._criarParaTestes({
    async sincronizarMobile(received) {
      input = received;
      return serviceResult;
    }
  });
  const response = responseMock();
  await controller.sincronizar({ query, mobileAuth: { id_utilizador: 7 } }, response);
  return { response, input };
}

test('1. snapshot sem cursor mantém o modo full e devolve watermark', async () => {
  const { response, input } = await invokeController({});
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.mode, 'full');
  assert.deepEqual(response.body.next_cursor, {
    changed_at: T1.toISOString(),
    change_id: 7
  });
  assert.equal(input.cursor, null);
});

test('2. parâmetro since continua compatível', async () => {
  const { response, input } = await invokeController({ since: T0.toISOString() });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.mode, 'incremental');
  assert.ok(input.since instanceof Date);
});

test('3. cursor composto válido é aceite e encaminhado', async () => {
  const { response, input } = await invokeController({
    cursorTimestamp: T1.toISOString(),
    cursorChangeId: '4'
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.mode, 'cursor');
  assert.equal(input.cursor.changedAt.toISOString(), T1.toISOString());
  assert.equal(input.cursor.changeId, 4);
});

test('4. cursorTimestamp inválido devolve 400', async () => {
  const { response } = await invokeController({
    cursorTimestamp: 'data-inválida',
    cursorChangeId: '4'
  });
  assert.equal(response.statusCode, 400);
});

test('5. cursorChangeId inválido devolve 400', async () => {
  const { response } = await invokeController({
    cursorTimestamp: T1.toISOString(),
    cursorChangeId: '-1'
  });
  assert.equal(response.statusCode, 400);
});

test('6. apenas um campo do cursor devolve 400', async () => {
  const first = await invokeController({ cursorTimestamp: T1.toISOString() });
  const second = await invokeController({ cursorChangeId: '2' });
  assert.equal(first.response.statusCode, 400);
  assert.equal(second.response.statusCode, 400);
});

test('7. vários eventos com o mesmo timestamp não são perdidos', async () => {
  const result = await changeService.listarAlteracoes({
    cursor: { changedAt: T1, changeId: 1 },
    watermark: { changedAt: T2, changeId: 8 },
    idUtilizador: 7,
    limit: 20,
    transaction: { id: 'tx' }
  });
  assert.deepEqual(result.changes.map((event) => event.change_id), [2, 4, 5, 6, 7, 8]);
});

test('8. eventos são ordenados por changed_at e change_id', async () => {
  const result = await changeService.listarAlteracoes({
    cursor: { changedAt: T0, changeId: 0 },
    watermark: { changedAt: T2, changeId: 8 },
    idUtilizador: 7,
    limit: 20
  });
  assert.deepEqual(result.changes.map((event) => event.change_id), [1, 2, 4, 5, 6, 7, 8]);
});

test('9. sem eventos novos conserva o cursor recebido', async () => {
  const cursor = { changedAt: T2, changeId: 8 };
  const result = await changeService.listarAlteracoes({
    cursor,
    watermark: cursor,
    idUtilizador: 7,
    limit: 10
  });
  assert.equal(result.changes.length, 0);
  assert.equal(result.nextCursor, cursor);
});

test('10. eventos pessoais do utilizador autenticado são incluídos', async () => {
  const result = await changeService.listarAlteracoes({
    cursor: { changedAt: T0, changeId: 0 },
    watermark: { changedAt: T2, changeId: 8 },
    idUtilizador: 7,
    limit: 20
  });
  assert.ok(result.changes.some((event) => event.id_utilizador === 7));
});

test('11. eventos globais são incluídos', async () => {
  const result = await changeService.listarAlteracoes({
    cursor: { changedAt: T0, changeId: 0 },
    watermark: { changedAt: T2, changeId: 8 },
    idUtilizador: 7,
    limit: 20
  });
  assert.ok(result.changes.some((event) => event.id_utilizador === null));
});

test('12. eventos pessoais de outro utilizador são excluídos', async () => {
  const result = await changeService.listarAlteracoes({
    cursor: { changedAt: T0, changeId: 0 },
    watermark: { changedAt: T2, changeId: 8 },
    idUtilizador: 7,
    limit: 20
  });
  assert.equal(result.changes.some((event) => event.change_id === 3), false);
});

test('13. delete simples é representado pelo change log', () => {
  const deleted = changeService.deletesDoChangeLog([events[1]]);
  assert.equal(deleted[0].entity, 'objectives');
  assert.equal(deleted[0].record_id, '30');
});

test('14. delete de relação composta mantém as duas chaves', () => {
  const deleted = changeService.deletesDoChangeLog([events[3]]);
  assert.deepEqual(deleted[0].metadata, { id_badge: 5, id_requisito: 4 });
});

test('15. remoção de signature_badges entra no bloco específico', () => {
  const deletes = changeService.deletesDoChangeLog([events[4]]);
  const deleted = syncControllerModule._construirDeleted(emptyData, deletes);
  assert.deepEqual(deleted.signature_badges[0], {
    id_assinatura: 12,
    id_badge: 5,
    deleted_at: T1
  });
});

test('16. remoção de notification_receivers entra no bloco específico', () => {
  const deletes = changeService.deletesDoChangeLog([events[5]]);
  const deleted = syncControllerModule._construirDeleted(emptyData, deletes);
  assert.equal(deleted.notification_receivers[0].id_notificacao, 90);
  assert.equal(deleted.notification_receivers[0].id_utilizador, 7);
});

test('17. paginação respeita limit', async () => {
  const result = await changeService.listarAlteracoes({
    cursor: { changedAt: T0, changeId: 0 },
    watermark: { changedAt: T2, changeId: 8 },
    idUtilizador: 7,
    limit: 2
  });
  assert.equal(result.changes.length, 2);
});

test('18. has_more é verdadeiro quando existe uma página seguinte', async () => {
  const result = await changeService.listarAlteracoes({
    cursor: { changedAt: T0, changeId: 0 },
    watermark: { changedAt: T2, changeId: 8 },
    idUtilizador: 7,
    limit: 2
  });
  assert.equal(result.hasMore, true);
});

test('19. next_cursor corresponde ao último evento devolvido', async () => {
  const result = await changeService.listarAlteracoes({
    cursor: { changedAt: T0, changeId: 0 },
    watermark: { changedAt: T2, changeId: 8 },
    idUtilizador: 7,
    limit: 2
  });
  assert.equal(result.nextCursor.changedAt.toISOString(), T1.toISOString());
  assert.equal(result.nextCursor.changeId, 2);
});

test('20. contrato da Fase 4 permanece e a versão evolui para 3', async () => {
  const { response } = await invokeController({});
  for (const field of ['success', 'contract_version', 'mode', 'sync_until', 'data', 'deleted']) {
    assert.ok(Object.hasOwn(response.body, field), field);
  }
  assert.equal(response.body.contract_version, '3');
  assert.ok(Object.hasOwn(response.body.deleted, 'badge_requirements'));
  assert.ok(Object.hasOwn(response.body.deleted, 'notification_receivers'));
});

test('21. /api/mobile/health permanece inalterado', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'routes', 'mobile_sync_routes.js'), 'utf8');
  assert.match(source, /router\.get\('\/health', mobileHealthController\.health\)/);
});

test('22. autenticação mobile permanece inalterada', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'routes', 'mobile_auth_routes.js'), 'utf8');
  assert.match(source, /router\.post\('\/login', mobileAuthController\.login\)/);
  assert.match(source, /router\.post\('\/refresh', mobileAuthController\.refresh\)/);
  assert.match(source, /router\.post\('\/logout', mobileAuthController\.logout\)/);
  assert.match(source, /router\.get\('\/me', mobileAuthMiddleware, mobileAuthController\.me\)/);
});

test('23. dispositivos mobile permanecem inalterados', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'routes', 'mobile_device_routes.js'), 'utf8');
  assert.match(source, /router\.put\('\/', adaptarFcmToken, mobileDevicesController\.registerDevice\)/);
  assert.match(source, /router\.delete\('\/:deviceId', mobileDevicesController\.deactivateDevice\)/);
});

test('24. sync continua protegido pelo middleware mobile', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'routes', 'mobile_sync_routes.js'), 'utf8');
  assert.match(source, /router\.get\('\/sync', mobileAuthMiddleware, mobileSyncController\.sincronizar\)/);
});

test('25. limit inválido ou fora do máximo devolve 400', async () => {
  const base = { cursorTimestamp: T1.toISOString(), cursorChangeId: '1' };
  const zero = await invokeController({ ...base, limit: '0' });
  const excessive = await invokeController({ ...base, limit: '501' });
  const nonInteger = await invokeController({ ...base, limit: 'abc' });
  assert.equal(zero.response.statusCode, 400);
  assert.equal(excessive.response.statusCode, 400);
  assert.equal(nonInteger.response.statusCode, 400);
});

test('26. alteração de recetor é refletida antes de o cursor avançar', () => {
  const fullData = {
    ...emptyData,
    notificacoes: {
      upserts: [{ id_notificacao: 90, descricao_notificacao: 'Aviso' }],
      deleted: []
    },
    recetores_notificacoes: [{
      id_notificacao: 90,
      id_utilizador: 7,
      lida: true,
      last_read: true
    }]
  };
  const projected = changeService.projectarDados(fullData, [{
    ...events[5],
    operation: 'update'
  }]);

  assert.equal(projected.notificacoes.upserts[0].id_notificacao, 90);
  assert.deepEqual(projected.recetores_notificacoes[0], {
    id_notificacao: 90,
    id_utilizador: 7,
    lida: true,
    last_read: true
  });
});

test('27. repository permite registar uma alteração mobile isolada', async () => {
  const created = await changeService.registarAlteracao({
    entity: 'objectives',
    recordId: 99,
    idUtilizador: 7,
    operation: 'update',
    metadata: { id_objetivo: 99 },
    transaction: { id: 'tx-create' }
  });
  assert.equal(created.entity, 'objectives');
  assert.equal(created.record_id, '99');
  assert.equal(created.id_utilizador, 7);
});

test('28. since com cursor ou limit sem cursor devolvem 400', async () => {
  const mixed = await invokeController({
    since: T0.toISOString(),
    cursorTimestamp: T1.toISOString(),
    cursorChangeId: '1'
  });
  const limitWithoutCursor = await invokeController({ limit: '10' });
  assert.equal(mixed.response.statusCode, 400);
  assert.equal(limitWithoutCursor.response.statusCode, 400);
});
