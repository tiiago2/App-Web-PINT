const db = require('../models');
const { sequelize, Submissoes, Recetor, Utilizador, Documentos } = db;

const mobileSyncService = require('../services/mobile_sync_service');
const {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  cursorPublico
} = require('../services/mobile_sync_change_service');
const { MOBILE_SYNC_CONTRACT_VERSION } = require('../config/mobile_sync_contract');

const ISO_8601_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function validarSince(valor) {
  if (typeof valor !== 'string') {
    return null;
  }

  const correspondencia = ISO_8601_TIMESTAMP.exec(valor);
  if (!correspondencia) {
    return null;
  }

  const [, ano, mes, dia, hora, minuto, segundo] = correspondencia.map(Number);
  const dataCalendario = new Date(Date.UTC(ano, mes - 1, dia));
  const calendarioValido = dataCalendario.getUTCFullYear() === ano
    && dataCalendario.getUTCMonth() === mes - 1
    && dataCalendario.getUTCDate() === dia;
  const relogioValido = hora <= 23 && minuto <= 59 && segundo <= 59;
  const data = new Date(valor);

  if (!calendarioValido || !relogioValido || Number.isNaN(data.getTime())) {
    return null;
  }

  return data;
}

function validarInteiroSeguro(valor, { min, max = Number.MAX_SAFE_INTEGER }) {
  if (typeof valor !== 'string' || !/^\d+$/.test(valor)) {
    return null;
  }

  const parsed = Number(valor);
  return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max
    ? parsed
    : null;
}

function valoresUnicos(items, key) {
  const seen = new Set();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function construirDeleted(data, changeDeletes = []) {
  const deleted = {
    badge_requirements: (data.requisitos_badges?.deleted || []).map((item) => ({
      id_badge: item.id_badge,
      id_requisito: item.id_requisito,
      deleted_at: item.deleted_at
    })),
    notification_receivers: (data.notificacoes?.deleted || []).map((item) => ({
      id_notificacao: item.id_notificacao,
      id_utilizador: item.id_utilizador,
      deleted_at: item.deleted_at
    })),
    objectives: (data.objetivos || [])
      .filter((objetivo) => objetivo.deleted_objetivo)
      .map((objetivo) => ({
        id_objetivo: objetivo.id_objetivo,
        data_eliminacao: objetivo.data_eliminacao
      })),
    submission_documents: (data.documentos || [])
      .filter((documento) => documento.deleted_file)
      .map((documento) => ({
        id_submissao: documento.id_submissao,
        id_ficheiro: documento.id_ficheiro,
        updated_file: documento.updated_file
      })),
    signature_badges: [],
    changes: []
  };

  for (const change of changeDeletes) {
    const metadata = change.metadata || {};
    const generic = {
      entity: change.entity,
      record_id: change.record_id,
      changed_at: change.changed_at,
      metadata
    };
    deleted.changes.push(generic);

    if (change.entity === 'badge_requirements') {
      deleted.badge_requirements.push({
        id_badge: metadata.id_badge,
        id_requisito: metadata.id_requisito,
        deleted_at: change.changed_at
      });
    } else if (change.entity === 'notification_receivers') {
      deleted.notification_receivers.push({
        id_notificacao: metadata.id_notificacao,
        id_utilizador: metadata.id_utilizador,
        deleted_at: change.changed_at
      });
    } else if (change.entity === 'objectives') {
      deleted.objectives.push({
        id_objetivo: metadata.id_objetivo ?? Number(change.record_id),
        data_eliminacao: change.changed_at
      });
    } else if (change.entity === 'submission_documents') {
      const [idSubmissao, idFicheiro] = change.record_id.split(':').map(Number);
      deleted.submission_documents.push({
        id_submissao: metadata.id_submissao ?? idSubmissao,
        id_ficheiro: metadata.id_ficheiro ?? idFicheiro,
        updated_file: change.changed_at
      });
    } else if (change.entity === 'signature_badges') {
      deleted.signature_badges.push({
        id_assinatura: metadata.id_assinatura,
        id_badge: metadata.id_badge,
        deleted_at: change.changed_at
      });
    }
  }

  deleted.badge_requirements = valoresUnicos(
    deleted.badge_requirements,
    (item) => `${item.id_badge}:${item.id_requisito}`
  );
  deleted.notification_receivers = valoresUnicos(
    deleted.notification_receivers,
    (item) => `${item.id_notificacao}:${item.id_utilizador}`
  );
  deleted.objectives = valoresUnicos(deleted.objectives, (item) => item.id_objetivo);
  deleted.submission_documents = valoresUnicos(
    deleted.submission_documents,
    (item) => `${item.id_submissao}:${item.id_ficheiro}`
  );
  deleted.signature_badges = valoresUnicos(
    deleted.signature_badges,
    (item) => `${item.id_assinatura}:${item.id_badge}`
  );

  return deleted;
}

function criarMobileSyncController(service = mobileSyncService) {
  return {
    async pull(req, res) {
      const sinceRecebido = req.query.since;
      const cursorTimestampRecebido = req.query.cursorTimestamp;
      const cursorChangeIdRecebido = req.query.cursorChangeId;
      const limitRecebido = req.query.limit;
      const temCursorTimestamp = cursorTimestampRecebido !== undefined;
      const temCursorChangeId = cursorChangeIdRecebido !== undefined;
      let since = null;
      let cursor = null;
      let limit = DEFAULT_LIMIT;

      if (temCursorTimestamp !== temCursorChangeId) {
        return res.status(400).json({
          error: 'cursorTimestamp e cursorChangeId devem ser fornecidos em conjunto.'
        });
      }

      if (temCursorTimestamp && sinceRecebido !== undefined) {
        return res.status(400).json({
          error: 'Use since ou o cursor composto, não ambos.'
        });
      }

      if (temCursorTimestamp) {
        const changedAt = validarSince(cursorTimestampRecebido);
        const changeId = validarInteiroSeguro(cursorChangeIdRecebido, { min: 0 });

        if (!changedAt) {
          return res.status(400).json({ error: 'cursorTimestamp deve ser ISO-8601 válido.' });
        }
        if (changeId === null) {
          return res.status(400).json({ error: 'cursorChangeId deve ser um inteiro válido.' });
        }
        cursor = { changedAt, changeId };
      }

      if (limitRecebido !== undefined) {
        if (!cursor) {
          return res.status(400).json({ error: 'limit só pode ser usado com cursor composto.' });
        }
        const parsedLimit = validarInteiroSeguro(limitRecebido, { min: 1, max: MAX_LIMIT });
        if (parsedLimit === null) {
          return res.status(400).json({
            error: `limit deve ser um inteiro entre 1 e ${MAX_LIMIT}.`
          });
        }
        limit = parsedLimit;
      }

      if (sinceRecebido !== undefined) {
        since = validarSince(sinceRecebido);
        if (!since) {
          return res.status(400).json({
            error: 'O parâmetro since deve ser um timestamp ISO-8601 válido.'
          });
        }
      }

      try {
        const {
          data,
          syncUntil,
          nextCursor,
          hasMore = false,
          changeDeletes = []
        } = await service.sincronizarMobile({
          idUtilizador: req.mobileAuth.id_utilizador,
          since,
          cursor,
          limit
        });

        return res.status(200).json({
          success: true,
          contract_version: MOBILE_SYNC_CONTRACT_VERSION,
          mode: cursor ? 'cursor' : since ? 'incremental' : 'full',
          sync_until: syncUntil.toISOString(),
          next_cursor: cursorPublico(nextCursor),
          has_more: hasMore,
          data,
          deleted: construirDeleted(data, changeDeletes)
        });
      } catch (error) {
        if (error.statusCode) {
          return res.status(error.statusCode).json({ error: error.message });
        }

        console.error('Erro interno na sincronização mobile.');
        return res.status(500).json({ error: 'Erro interno ao sincronizar dados mobile.' });
      }
    },

    async sincronizar(req, res) {
      return this.pull(req, res);
    },

    async push(req, res) {
      const transaction = await sequelize.transaction();
      try {
        const { submissoes_pendentes, recetores_lidos, perfil_editado } = req.body;
        
        const processedIds = {
          submissoes: [],
          recetores: [],
          perfil: []
        };

        // Processar Submissões Pendentes
        if (Array.isArray(submissoes_pendentes)) {
          for (const sub of submissoes_pendentes) {
            if (sub.id_submissao) {
              const exists = await Submissoes.findOne({ 
                where: { id_submissao: sub.id_submissao }, 
                paranoid: false,
                transaction 
              });

              if (exists) {
                await Submissoes.update(sub, { 
                  where: { id_submissao: sub.id_submissao }, 
                  transaction 
                });
              } else {
                await Submissoes.create(sub, { transaction });
              }
              processedIds.submissoes.push(sub.id_submissao);
            }
          }
        }

        // Processar Recetores Lidos
        if (Array.isArray(recetores_lidos)) {
          for (const rec of recetores_lidos) {
            if (rec.id_notificacao && rec.id_utilizador) {
              const exists = await Recetor.findOne({
                where: { 
                  id_notificacao: rec.id_notificacao,
                  id_utilizador: rec.id_utilizador
                },
                transaction
              });

              if (exists) {
                await Recetor.update(rec, {
                  where: { 
                    id_notificacao: rec.id_notificacao,
                    id_utilizador: rec.id_utilizador
                  },
                  transaction
                });
              } else {
                await Recetor.create(rec, { transaction });
              }
              processedIds.recetores.push({ 
                id_notificacao: rec.id_notificacao, 
                id_utilizador: rec.id_utilizador 
              });
            }
          }
        }

        // Processar Perfil Editado
        if (Array.isArray(perfil_editado)) {
          for (const perfil of perfil_editado) {
            if (perfil.id_utilizador) {
              const exists = await Utilizador.findOne({
                where: { id_utilizador: perfil.id_utilizador },
                paranoid: false,
                transaction
              });

              if (exists) {
                await Utilizador.update(perfil, {
                  where: { id_utilizador: perfil.id_utilizador },
                  transaction
                });
              } else {
                await Utilizador.create(perfil, { transaction });
              }
              processedIds.perfil.push(perfil.id_utilizador);
            }
          }
        }

        await transaction.commit();
        
        return res.status(200).json({
          success: true,
          processed_ids: processedIds
        });

      } catch (error) {
        await transaction.rollback();
        console.error("Erro no push de sincronização:", error);
        return res.status(500).json({ success: false, message: "Erro interno no servidor ao sincronizar (push)." });
      }
    },

    async upload(req, res) {
      try {
        const { id_submissao, id_requisito } = req.body;

        if (!req.file) {
          return res.status(400).json({ success: false, message: "Nenhum ficheiro foi enviado." });
        }

        if (!id_submissao || !id_requisito) {
          return res.status(400).json({ success: false, message: "id_submissao e id_requisito são campos obrigatórios." });
        }

        const filePath = req.file.path || req.file.filename;

        const novoDocumento = await Documentos.create({
          id_submissao: parseInt(id_submissao),
          id_requisito: parseInt(id_requisito),
          ficheiro: filePath
        });

        return res.status(200).json({
          success: true,
          message: "Ficheiro carregado e registado com sucesso.",
          documento: novoDocumento
        });

      } catch (error) {
        console.error("Erro no upload de documento de sincronização:", error);
        return res.status(500).json({ success: false, message: "Erro interno no servidor ao efetuar upload." });
      }
    }
  };
}

module.exports = criarMobileSyncController();
module.exports._criarParaTestes = criarMobileSyncController;
module.exports._validarSince = validarSince;
module.exports._validarInteiroSeguro = validarInteiroSeguro;
module.exports._construirDeleted = construirDeleted;
