const dbDefault = require('../models');
const storageDefault = require('./mobile_evidence_storage_service');
const { Op: opDefault } = require('sequelize');
const {
  normalizarStatus,
  selecionarSubmissaoMaisRecente,
  selecionarRegistoMaisRecente,
  registoEstaExpirado,
  determinarBloqueioRascunho,
  escolherOrigemEvidencias,
  escolherDocumentosParaCopiar
} = require('./personal_badges_service');

function httpError(statusCode, message, code, extra = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (code) error.code = code;
  Object.assign(error, extra);
  return error;
}

function positiveInteger(value, field) {
  const text = String(value ?? '').trim();
  if (!/^\d+$/.test(text)) throw httpError(400, `${field} deve ser um inteiro positivo.`);
  const number = Number(text);
  if (!Number.isSafeInteger(number) || number <= 0) {
    throw httpError(400, `${field} deve ser um inteiro positivo.`);
  }
  return number;
}

function plain(record) {
  return typeof record?.get === 'function' ? record.get({ plain: true }) : record;
}

function submissionPayload(record) {
  const submission = plain(record);
  return {
    id_submissao: submission.id_submissao,
    id_badge: submission.id_badge,
    status: normalizarStatus(submission.status),
    data_submissao: submission.data_submissao
  };
}

function evidencePayload(record) {
  const document = plain(record);
  return {
    id_ficheiro: document.id_ficheiro,
    id_submissao: document.id_submissao,
    id_requisito: document.id_requisito,
    ficheiro: document.ficheiro,
    updated_file: document.updated_file,
    deleted_file: Boolean(document.deleted_file)
  };
}

function fileSignatureMatches(file) {
  const buffer = file?.buffer;
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return false;
  if (file.mimetype === 'application/pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  if (file.mimetype === 'image/png') {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (file.mimetype === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (file.mimetype === 'image/webp') {
    return buffer.length >= 12
      && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
      && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

function createMobileSubmissionService({
  db = dbDefault,
  storage = storageDefault,
  Op = opDefault,
  now = () => new Date()
} = {}) {
  async function activeBadge(idBadge, transaction, lock = false) {
    const options = {
      where: { id_badge: idBadge, deleted_badge: false },
      transaction
    };
    if (lock && transaction) options.lock = transaction.LOCK.UPDATE;
    const badge = await db.Badges.findOne(options);
    if (!badge) throw httpError(404, 'Badge não encontrado ou inativo.');
    return badge;
  }

  async function ownedSubmission(idSubmission, idUser, transaction, lock = false) {
    const options = { where: { id_submissao: idSubmission }, transaction };
    if (lock && transaction) options.lock = transaction.LOCK.UPDATE;
    const submission = await db.Submissoes.findOne(options);
    if (!submission) throw httpError(404, 'Submissão não encontrada.');
    if (Number(submission.id_utilizador) !== Number(idUser)) {
      throw httpError(403, 'Não tem permissão para aceder a esta submissão.');
    }
    return submission;
  }

  function requireEditable(submission) {
    const status = normalizarStatus(submission.status);
    if (status !== 'em_progresso') {
      throw httpError(409, 'A submissão já não pode ser editada.', 'SUBMISSION_NOT_EDITABLE', {
        status_atual: status
      });
    }
  }

  async function activeRequirementIds(idBadge, transaction) {
    const relations = await db.RequisitosBadge.findAll({
      where: { id_badge: idBadge },
      transaction
    });
    const relatedIds = [...new Set(relations.map((relation) => Number(relation.id_requisito)))];
    if (relatedIds.length === 0) {
      throw httpError(409, 'Este badge não tem requisitos ativos.', 'BADGE_WITHOUT_REQUIREMENTS');
    }
    const requirements = await db.Requisitos.findAll({
      where: {
        id_requisito: { [Op.in]: relatedIds },
        deleted_requisitos: false
      },
      transaction
    });
    const ids = requirements.map((requirement) => Number(requirement.id_requisito));
    if (ids.length === 0) {
      throw httpError(409, 'Este badge não tem requisitos ativos.', 'BADGE_WITHOUT_REQUIREMENTS');
    }
    return ids;
  }

  async function requireRequirement(idBadge, idRequirement, transaction) {
    const requirement = await db.Requisitos.findOne({
      where: { id_requisito: idRequirement, deleted_requisitos: false },
      transaction
    });
    if (!requirement) throw httpError(404, 'Requisito não encontrado.');
    const relation = await db.RequisitosBadge.findOne({
      where: { id_badge: idBadge, id_requisito: idRequirement },
      transaction
    });
    if (!relation) {
      throw httpError(409, 'O requisito não pertence ao badge da submissão.', 'REQUIREMENT_NOT_ASSOCIATED');
    }
    return requirement;
  }

  async function uploadEnabled(transaction) {
    const permission = await db.Permissoes.findOne({
      where: { descricao_permissao: 'Upload de Evidências' },
      transaction
    });
    if (permission && permission.toggle === false) {
      throw httpError(403, 'A funcionalidade de upload de evidências está desativada.', 'UPLOAD_DISABLED');
    }
  }

  async function copyPreviousEvidences({ idBadge, sourceSubmission, targetSubmission, transaction }) {
    if (!sourceSubmission) return 0;
    const relations = await db.RequisitosBadge.findAll({
      where: { id_badge: idBadge },
      transaction
    });
    const relatedIds = [...new Set(relations.map((relation) => Number(relation.id_requisito)))];
    if (relatedIds.length === 0) return 0;
    const requirements = await db.Requisitos.findAll({
      where: {
        id_requisito: { [Op.in]: relatedIds },
        deleted_requisitos: false
      },
      transaction
    });
    const activeIds = requirements.map((requirement) => Number(requirement.id_requisito));
    if (activeIds.length === 0) return 0;
    const documents = await db.Documentos.findAll({
      where: {
        id_submissao: sourceSubmission.id_submissao,
        id_requisito: { [Op.in]: activeIds },
        deleted_file: false
      },
      transaction
    });
    const selected = escolherDocumentosParaCopiar(documents);
    if (selected.length === 0) return 0;
    const timestamp = now();
    await db.Documentos.bulkCreate(selected.map((document) => ({
      id_submissao: targetSubmission.id_submissao,
      id_ficheiro: document.id_ficheiro,
      id_requisito: document.id_requisito,
      ficheiro: document.ficheiro,
      updated_file: timestamp,
      deleted_file: false
    })), { transaction });
    return selected.length;
  }

  async function createSubmission({ idUser, body }) {
    const idBadge = positiveInteger(body?.id_badge, 'id_badge');
    return db.sequelize.transaction({ isolationLevel: 'SERIALIZABLE' }, async (transaction) => {
      const badge = await activeBadge(idBadge, transaction, true);
      const [submissions, records] = await Promise.all([
        db.Submissoes.findAll({
          where: { id_utilizador: idUser, id_badge: idBadge },
          transaction,
          lock: transaction.LOCK.UPDATE
        }),
        db.RegistoBadges.findAll({
          where: { id_utilizador: idUser, id_badge: idBadge },
          transaction
        })
      ]);
      const latestSubmission = selecionarSubmissaoMaisRecente(submissions);
      const latestRecord = selecionarRegistoMaisRecente(records);
      const block = determinarBloqueioRascunho({
        badge,
        submissaoMaisRecente: latestSubmission,
        registoMaisRecente: latestRecord,
        agora: now()
      });
      if (block) throw block;
      if (normalizarStatus(latestSubmission?.status) === 'em_progresso') {
        throw httpError(409, 'Já existe uma submissão ativa para este badge.', 'DUPLICATE_SUBMISSION');
      }

      const renewal = Boolean(latestRecord && registoEstaExpirado(badge, latestRecord, now()));
      const source = escolherOrigemEvidencias({
        submissoes: submissions,
        submissaoMaisRecente: latestSubmission,
        registoMaisRecente: latestRecord,
        renovacao: renewal
      });
      const submission = await db.Submissoes.create({
        id_badge: idBadge,
        id_utilizador: idUser,
        status: 'em_progresso',
        data_submissao: now(),
        notificacao_sla: false
      }, { transaction });
      const copied = await copyPreviousEvidences({
        idBadge,
        sourceSubmission: source.submissaoOrigem,
        targetSubmission: submission,
        transaction
      });
      return {
        ...submissionPayload(submission),
        evidencias_copiadas: copied
      };
    });
  }

  async function addEvidence({ idUser, idSubmission, idRequirement, file }) {
    const submissionId = positiveInteger(idSubmission, 'idSubmissao');
    const requirementId = positiveInteger(idRequirement, 'id_requisito');
    if (!file) throw httpError(400, 'Ficheiro obrigatório.', 'FILE_REQUIRED');
    if (!fileSignatureMatches(file)) {
      throw httpError(415, 'O conteúdo do ficheiro não corresponde ao tipo declarado.', 'INVALID_FILE_SIGNATURE');
    }

    const initialSubmission = await ownedSubmission(submissionId, idUser);
    requireEditable(initialSubmission);
    await activeBadge(initialSubmission.id_badge);
    await requireRequirement(initialSubmission.id_badge, requirementId);
    await uploadEnabled();

    let uploaded;
    try {
      uploaded = await storage.upload(file);
      return await db.sequelize.transaction({ isolationLevel: 'SERIALIZABLE' }, async (transaction) => {
        const submission = await ownedSubmission(submissionId, idUser, transaction, true);
        requireEditable(submission);
        await activeBadge(submission.id_badge, transaction, true);
        await requireRequirement(submission.id_badge, requirementId, transaction);
        await uploadEnabled(transaction);

        const activeDocuments = await db.Documentos.findAll({
          where: {
            id_submissao: submissionId,
            id_requisito: requirementId,
            deleted_file: false
          },
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        const timestamp = now();
        if (activeDocuments.length > 0) {
          await db.Documentos.update({
            deleted_file: true,
            updated_file: timestamp
          }, {
            where: {
              id_submissao: submissionId,
              id_requisito: requirementId,
              deleted_file: false
            },
            transaction
          });
        }
        const document = await db.Documentos.create({
          id_submissao: submissionId,
          id_requisito: requirementId,
          ficheiro: uploaded.url,
          updated_file: timestamp,
          deleted_file: false
        }, { transaction });
        return {
          created: activeDocuments.length === 0,
          replaced: activeDocuments.length > 0,
          evidence: evidencePayload(document)
        };
      });
    } catch (error) {
      if (uploaded) {
        try {
          await storage.remove(uploaded);
        } catch {
          console.error('Falha ao limpar um upload mobile não persistido.');
        }
      }
      throw error;
    }
  }

  async function removeEvidence({ idUser, idSubmission, idFile }) {
    const submissionId = positiveInteger(idSubmission, 'idSubmissao');
    const fileId = positiveInteger(idFile, 'idFicheiro');
    return db.sequelize.transaction({ isolationLevel: 'SERIALIZABLE' }, async (transaction) => {
      const submission = await ownedSubmission(submissionId, idUser, transaction, true);
      requireEditable(submission);
      const document = await db.Documentos.findOne({
        where: {
          id_submissao: submissionId,
          id_ficheiro: fileId
        },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!document) {
        const foreignDocument = await db.Documentos.findOne({
          where: { id_ficheiro: fileId },
          transaction
        });
        if (foreignDocument) {
          throw httpError(403, 'Não tem permissão para remover esta evidência.');
        }
        return { deleted: true, id_ficheiro: fileId };
      }
      if (!document.deleted_file) {
        await document.update({ deleted_file: true, updated_file: now() }, { transaction });
      }
      return { deleted: true, id_ficheiro: fileId };
    });
  }

  async function submit({ idUser, idSubmission }) {
    const submissionId = positiveInteger(idSubmission, 'idSubmissao');
    return db.sequelize.transaction({ isolationLevel: 'SERIALIZABLE' }, async (transaction) => {
      const submission = await ownedSubmission(submissionId, idUser, transaction, true);
      requireEditable(submission);
      await activeBadge(submission.id_badge, transaction, true);
      const requiredIds = await activeRequirementIds(submission.id_badge, transaction);
      const documents = await db.Documentos.findAll({
        where: {
          id_submissao: submissionId,
          id_requisito: { [Op.in]: requiredIds },
          deleted_file: false
        },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      const attached = new Set(documents.map((document) => Number(document.id_requisito)));
      const missing = requiredIds.filter((id) => !attached.has(id));
      if (missing.length > 0) {
        throw httpError(409, 'A submissão ainda não tem todas as evidências obrigatórias.', 'INCOMPLETE_REQUIREMENTS', {
          total_requisitos: requiredIds.length,
          requisitos_anexados: attached.size,
          requisitos_em_falta: missing
        });
      }
      submission.status = 'pendente';
      submission.data_submissao = now();
      if (typeof submission.save === 'function') await submission.save({ transaction });
      else await submission.update({ status: 'pendente', data_submissao: submission.data_submissao }, { transaction });
      return submissionPayload(submission);
    });
  }

  async function getSubmission({ idUser, idSubmission }) {
    const submissionId = positiveInteger(idSubmission, 'idSubmissao');
    const submission = await ownedSubmission(submissionId, idUser);
    const documents = await db.Documentos.findAll({
      where: { id_submissao: submissionId, deleted_file: false },
      order: [['id_requisito', 'ASC'], ['id_ficheiro', 'ASC']]
    });
    return {
      ...submissionPayload(submission),
      evidences: documents.map(evidencePayload)
    };
  }

  return { createSubmission, addEvidence, removeEvidence, submit, getSubmission };
}

module.exports = createMobileSubmissionService();
module.exports._createForTests = createMobileSubmissionService;
module.exports._fileSignatureMatches = fileSignatureMatches;
