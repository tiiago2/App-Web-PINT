const { Op } = require('sequelize');
const db = require('../models');

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

function normalizarMetadata(metadata) {
  if (!metadata) return {};
  if (typeof metadata === 'object') return metadata;

  try {
    return JSON.parse(metadata);
  } catch {
    return {};
  }
}

function cursorDeEvento(evento) {
  return {
    changedAt: new Date(evento.changed_at),
    changeId: Number(evento.change_id)
  };
}

function cursorPublico(cursor) {
  if (!cursor) return null;
  return {
    changed_at: cursor.changedAt.toISOString(),
    change_id: cursor.changeId
  };
}

function compararCursores(left, right) {
  const timestampDifference = left.changedAt.getTime() - right.changedAt.getTime();
  return timestampDifference || left.changeId - right.changeId;
}

function condicaoDepois(cursor) {
  return {
    [Op.or]: [
      { changed_at: { [Op.gt]: cursor.changedAt } },
      {
        [Op.and]: [
          { changed_at: cursor.changedAt },
          { change_id: { [Op.gt]: cursor.changeId } }
        ]
      }
    ]
  };
}

function condicaoAte(cursor) {
  return {
    [Op.or]: [
      { changed_at: { [Op.lt]: cursor.changedAt } },
      {
        [Op.and]: [
          { changed_at: cursor.changedAt },
          { change_id: { [Op.lte]: cursor.changeId } }
        ]
      }
    ]
  };
}

async function obterWatermark({ idUtilizador, transaction, fallbackTimestamp }) {
  const ultimo = await db.MobileSyncChange.findOne({
    where: {
      [Op.or]: [
        { id_utilizador: null },
        { id_utilizador: idUtilizador }
      ]
    },
    order: [['changed_at', 'DESC'], ['change_id', 'DESC']],
    raw: true,
    transaction
  });

  return ultimo
    ? cursorDeEvento(ultimo)
    : { changedAt: new Date(fallbackTimestamp), changeId: 0 };
}

async function listarAlteracoes({
  cursor,
  watermark,
  idUtilizador,
  limit = DEFAULT_LIMIT,
  transaction
}) {
  const rows = await db.MobileSyncChange.findAll({
    where: {
      [Op.and]: [
        condicaoDepois(cursor),
        condicaoAte(watermark),
        {
          [Op.or]: [
            { id_utilizador: null },
            { id_utilizador: idUtilizador }
          ]
        }
      ]
    },
    order: [['changed_at', 'ASC'], ['change_id', 'ASC']],
    limit: limit + 1,
    raw: true,
    transaction
  });
  const hasMore = rows.length > limit;
  const changes = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = changes.length > 0
    ? cursorDeEvento(changes[changes.length - 1])
    : cursor;

  return { changes, hasMore, nextCursor };
}

async function registarAlteracao({
  entity,
  recordId,
  idUtilizador = null,
  operation,
  metadata = null,
  transaction
}) {
  return db.MobileSyncChange.create({
    entity,
    record_id: String(recordId),
    id_utilizador: idUtilizador,
    operation,
    metadata_json: metadata
  }, { transaction });
}

function idsEventos(changes, entity) {
  return new Set(
    changes
      .filter((change) => change.entity === entity && change.operation !== 'delete')
      .map((change) => String(change.record_id))
  );
}

function temEvento(changes, entities) {
  const accepted = new Set(entities);
  return changes.some((change) => accepted.has(change.entity));
}

function filtrarPorId(items, ids, field) {
  return (items || []).filter((item) => ids.has(String(item[field])));
}

function filtrarComposto(items, ids, fields) {
  return (items || []).filter((item) => {
    const key = fields.map((field) => item[field]).join(':');
    return ids.has(String(key));
  });
}

function projectarDados(fullData, changes) {
  const learningPathIds = idsEventos(changes, 'learning_paths');
  const serviceLineIds = idsEventos(changes, 'service_lines');
  const areaIds = idsEventos(changes, 'areas');
  const levelIds = idsEventos(changes, 'levels');
  const badgeIds = idsEventos(changes, 'badges');
  const permissionIds = idsEventos(changes, 'permissions');
  const requirementIds = idsEventos(changes, 'requirements');
  const badgeRequirementIds = idsEventos(changes, 'badge_requirements');
  const badgeRecordIds = idsEventos(changes, 'badge_records');
  const submissionIds = idsEventos(changes, 'submissions');
  const documentIds = idsEventos(changes, 'submission_documents');
  const historyIds = idsEventos(changes, 'history');
  const objectiveIds = idsEventos(changes, 'objectives');
  const notificationIds = new Set([
    ...idsEventos(changes, 'notifications'),
    ...changes
      .filter((change) => change.entity === 'notification_receivers')
      .map((change) => String(normalizarMetadata(change.metadata_json).id_notificacao || '').trim())
      .filter(Boolean)
  ]);
  const notificationReceiverIds = idsEventos(changes, 'notification_receivers');
  const signatureIds = idsEventos(changes, 'signature');
  const signatureBadgeIds = idsEventos(changes, 'signature_badges');
  const personalBadgeChanged = temEvento(changes, [
    'badges', 'requirements', 'badge_requirements', 'badge_records',
    'submissions', 'submission_documents', 'history'
  ]);

  return {
    perfil: temEvento(changes, ['profile']) ? fullData.perfil : null,
    permissoes: filtrarPorId(fullData.permissoes, permissionIds, 'id_permissao'),
    learning_paths: filtrarPorId(fullData.learning_paths, learningPathIds, 'id_learning_path'),
    service_lines: filtrarPorId(fullData.service_lines, serviceLineIds, 'id_service_line'),
    areas: filtrarPorId(fullData.areas, areaIds, 'id_area'),
    areas_service_lines: filtrarPorId(fullData.areas_service_lines, areaIds, 'id_area'),
    niveis: filtrarPorId(fullData.niveis, levelIds, 'id_nivel'),
    badges: filtrarPorId(fullData.badges, badgeIds, 'id_badge'),
    user_badges: personalBadgeChanged ? fullData.user_badges : [],
    requisitos: filtrarPorId(fullData.requisitos, requirementIds, 'id_requisito'),
    requisitos_badges: {
      upserts: filtrarComposto(
        fullData.requisitos_badges?.upserts,
        badgeRequirementIds,
        ['id_badge', 'id_requisito']
      ),
      deleted: []
    },
    registos_badges: filtrarPorId(fullData.registos_badges, badgeRecordIds, 'id_registo'),
    submissoes: filtrarPorId(fullData.submissoes, submissionIds, 'id_submissao'),
    historico: filtrarComposto(fullData.historico, historyIds, ['id_submissao', 'id_utilizador']),
    documentos: filtrarComposto(
      fullData.documentos,
      documentIds,
      ['id_submissao', 'id_ficheiro']
    ),
    objetivos: filtrarPorId(fullData.objetivos, objectiveIds, 'id_objetivo'),
    notificacoes: {
      upserts: filtrarPorId(
        fullData.notificacoes?.upserts,
        notificationIds,
        'id_notificacao'
      ),
      deleted: []
    },
    recetores_notificacoes: filtrarComposto(
      fullData.recetores_notificacoes,
      notificationReceiverIds,
      ['id_notificacao', 'id_utilizador']
    ),
    assinatura: signatureIds.has(String(fullData.assinatura?.id_assinatura))
      ? fullData.assinatura
      : null,
    badges_assinatura: filtrarComposto(
      fullData.badges_assinatura,
      signatureBadgeIds,
      ['id_assinatura', 'id_badge']
    ),
    outros_users: temEvento(changes, ['ranking']) ? fullData.outros_users : []
  };
}

function deletesDoChangeLog(changes) {
  return changes
    .filter((change) => change.operation === 'delete')
    .map((change) => ({
      entity: change.entity,
      record_id: String(change.record_id),
      id_utilizador: change.id_utilizador,
      changed_at: new Date(change.changed_at),
      metadata: normalizarMetadata(change.metadata_json)
    }));
}

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  compararCursores,
  cursorPublico,
  obterWatermark,
  listarAlteracoes,
  registarAlteracao,
  projectarDados,
  deletesDoChangeLog
};
