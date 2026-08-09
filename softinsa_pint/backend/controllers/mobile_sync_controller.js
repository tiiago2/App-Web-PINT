const db = require('../models');
const { sequelize, Submissoes, Recetor, Utilizador, Documentos, Objetivos, RegistoBadges, Notificacoes, Assinatura, BadgesAssinatura } = db;
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

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
        data_eliminacao: objetivo.data_conclusao
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
      const sinceRecebido = req.query.since || req.query.last_sync_timestamp;
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

        console.error('❌ Erro interno na sincronização mobile:', error); 
        return res.status(500).json({ error: 'Erro interno ao sincronizar dados mobile.' });
      }
    },

    async sincronizar(req, res) {
      return this.pull(req, res);
    },

    async push(req, res) {
      const ENTITY_MAP = {
        'submission': 'submissoes', 'submissao': 'submissoes', 'submissoes': 'submissoes',
        'objective': 'objetivos', 'objetivo': 'objetivos', 'objetivos': 'objetivos',
        'document': 'documentos_submissao', 'documento': 'documentos_submissao', 'documentos_submissao': 'documentos_submissao',
        'notification': 'notificacoes', 'notificacao': 'notificacoes', 'notificacoes': 'notificacoes',
        'user_badge': 'user_badges', 'user_badges': 'user_badges',
        'recetores': 'recetores', 'recetor': 'recetores', 'recetores_lidos': 'recetores',
        'perfil': 'perfil', 'perfil_editado': 'perfil',
        'assinatura': 'assinatura', 'assinaturas': 'assinatura'
      };

      const MODEL_CONFIGS = {
        'submissoes': { model: Submissoes, pkField: 'id_submissao', userIdField: 'id_utilizador' },
        'objetivos': { model: Objetivos, pkField: 'id_objetivo', userIdField: 'id_utilizador' },
        'documentos_submissao': { model: Documentos, pkField: 'id_ficheiro', userIdField: null },
        'notificacoes': { model: Notificacoes, pkField: 'id_notificacao', userIdField: 'id_utilizador' },
        'user_badges': { model: RegistoBadges, pkField: 'id_registo', userIdField: 'id_utilizador' },
        'recetores': { model: Recetor, pkField: null, userIdField: 'id_utilizador' },
        'perfil': { model: Utilizador, pkField: 'id_utilizador', userIdField: 'id_utilizador' },
        'assinatura': { model: Assinatura, pkField: 'id_assinatura', userIdField: 'id_proprietario' }
      };

      const processedIds = {
        submissoes: {},
        objetivos: [],
        documentos_submissao: [],
        notificacoes: [],
        user_badges: [],
        recetores: [],
        perfil: [],
        assinatura: []
      };

      const submissaoIdMap = new Map();
      const operations = [];

      try {
        // 1. Extrair e unificar todas as operações do request body
        if (Array.isArray(req.body)) {
          operations.push(...req.body);
        } else if (Array.isArray(req.body?.operations)) {
          operations.push(...req.body.operations);
        } else if (Array.isArray(req.body?.changes)) {
          operations.push(...req.body.changes);
        } else {
          // Se for enviado em chaves agrupadas (ex: submissoes_pendentes: [...])
          for (const key of Object.keys(req.body || {})) {
            const normalizedKey = key.replace(/_pendentes$/, '').replace(/_lidos$/, '').replace(/_editado$/, '');
            const canonical = ENTITY_MAP[normalizedKey] || ENTITY_MAP[key];
            if (canonical && Array.isArray(req.body[key])) {
              for (const item of req.body[key]) {
                if (item && item.payload !== undefined) {
                  operations.push({ ...item, entity: canonical });
                } else {
                  operations.push({
                    entity: canonical,
                    user_id: item.id_utilizador || item.user_id || item.id_user,
                    local_record_id: item.id_local !== undefined ? item.id_local : null,
                    payload: item
                  });
                }
              }
            }
          }
        }

        // 2. Ordenar operações para processar 'submissoes' primeiro (necessário para FK de documentos)
        operations.sort((a, b) => {
          const aName = ENTITY_MAP[a.entity] || a.entity;
          const bName = ENTITY_MAP[b.entity] || b.entity;
          if (aName === 'submissoes' && bName !== 'submissoes') return -1;
          if (aName !== 'submissoes' && bName === 'submissoes') return 1;
          return 0;
        });

        // 3. Processar cada operação individualmente com resiliência
        for (const op of operations) {
          const rawEntity = op.entity;
          const canonicalEntity = ENTITY_MAP[rawEntity] || rawEntity;
          const config = MODEL_CONFIGS[canonicalEntity];

          if (!config) {
            console.warn(`⚠️ [PUSH AUDIT] Entidade desconhecida ignorada: ${rawEntity}`);
            continue;
          }

          const opPayload = op.payload || {};
          const tempId = op.local_record_id !== undefined && op.local_record_id !== null
            ? op.local_record_id
            : (opPayload.id_local !== undefined ? opPayload.id_local : opPayload[config.pkField]);

          // Injetar user_id no payload
          const rawUserId = op.user_id ||
                            opPayload.id_utilizador ||
                            opPayload.user_id ||
                            opPayload.id_user ||
                            (req.mobileAuth && req.mobileAuth.id_utilizador) ||
                            (req.user && req.user.id);
          const userId = rawUserId ? Number(rawUserId) : null;

          // ── RESOLUÇÃO DE FK id_submissao (para documentos_submissao) ──────────────────────
          // O Flutter envia sempre o id_submissao real do servidor se a submissão já estava
          // sincronizada, ou o id_submissao_local para submissões criadas no mesmo lote.
          if (canonicalEntity === 'documentos_submissao') {
            // FONTE 1: id_submissao já é o ID real do servidor (submissão previamente sincronizada)
            let realSubmissaoId = opPayload.id_submissao || null;

            // FONTE 2: Submissão criada no mesmo lote — traduzir via mapa em memória
            if (!realSubmissaoId && opPayload.id_submissao_local !== undefined) {
              realSubmissaoId = submissaoIdMap.get(opPayload.id_submissao_local) ?? null;
            }

            if (realSubmissaoId) {
              opPayload.id_submissao = realSubmissaoId;
            } else {
              // Submissão pai não encontrada — omitir documento para evitar violação de FK
              console.warn(
                `⚠️ [PUSH SYNC] Documento omitido: Submissão ` +
                `'${opPayload.id_submissao_local ?? opPayload.id_submissao}' ` +
                `não existe no PostgreSQL nem no lote atual.`
              );
              continue; // Salta para a próxima operação do lote sem crashar
            }
          }
          // ─────────────────────────────────────────────────────────────────────────────────

          let operationType = op.operation;
          if (!operationType) {
            operationType = (opPayload[config.pkField] && opPayload[config.pkField] > 0) ? 'update' : 'insert';
          }

          // Executar numa transação isolada por registo
          const localTransaction = await sequelize.transaction();
          try {
            let serverId = null;

            if (canonicalEntity === 'recetores') {
              const recKey = `${opPayload.id_notificacao}:${opPayload.id_utilizador || userId}`;
              const exists = await Recetor.findOne({
                where: {
                  id_notificacao: opPayload.id_notificacao,
                  id_utilizador: opPayload.id_utilizador || userId
                },
                transaction: localTransaction
              });

              if (exists) {
                const { id_notificacao, id_utilizador, ...updateData } = opPayload;
                await Recetor.update(updateData, {
                  where: {
                    id_notificacao: opPayload.id_notificacao,
                    id_utilizador: opPayload.id_utilizador || userId
                  },
                  transaction: localTransaction
                });
              } else {
                const createData = { ...opPayload };
                if (userId && !createData.id_utilizador) {
                  createData.id_utilizador = userId;
                }
                await Recetor.create(createData, { transaction: localTransaction });
              }
              serverId = recKey;
            } else if (canonicalEntity === 'perfil') {
              if (operationType === 'update') {
                const targetProfileId = userId;

                const updateData = { ...opPayload };
                delete updateData.id_utilizador;
                delete updateData.id_local;

                await Utilizador.update(updateData, {
                  where: { id_utilizador: targetProfileId },
                  transaction: localTransaction
                });
                console.log(`✅ [PUSH] Perfil de utilizador ${targetProfileId} atualizado.`);
                serverId = targetProfileId;
              } else {
                console.log(`⚠️ [PUSH] Operação não suportada para perfil: ${operationType}`);
              }
            } else if (canonicalEntity === 'assinatura') {
              try {
                // Verificar se a assinatura já existe para o utilizador
                const existingAss = await Assinatura.findOne({
                  where: { id_proprietario: userId },
                  transaction: localTransaction
                });

                let finalId;
                if (existingAss) {
                  // O modelo Assinatura no Postgres tem a coluna "update_assinatura" e "id_proprietario".
                  // Os dados binários/formato do mobile não pertencem à tabela assinatura direta,
                  // mapeamos o timestamp de atualização.
                  await Assinatura.update({
                    update_assinatura: new Date()
                  }, {
                    where: { id_assinatura: existingAss.id_assinatura, id_proprietario: userId },
                    transaction: localTransaction
                  });
                  finalId = existingAss.id_assinatura;
                  console.log(`✍️ [PUSH UPDATE] Assinatura ${finalId} atualizada no Postgres (Dono: ${userId}).`);
                } else {
                  const novaAss = await Assinatura.create({
                    id_proprietario: userId,
                    update_assinatura: new Date()
                  }, { transaction: localTransaction });
                  finalId = novaAss.id_assinatura;
                  console.log(`✍️ [PUSH INSERT] Assinatura ${finalId} criada no Postgres (Dono: ${userId}).`);
                }

                // Se vierem os badges associados da assinatura no payload
                const badgesList = opPayload.badges || opPayload.badges_ids || opPayload.id_badges;
                if (Array.isArray(badgesList)) {
                  await BadgesAssinatura.destroy({
                    where: { id_assinatura: finalId },
                    transaction: localTransaction
                  });
                  const relations = badgesList.map(idBadge => ({
                    id_assinatura: finalId,
                    id_badge: Number(idBadge)
                  }));
                  await BadgesAssinatura.bulkCreate(relations, { transaction: localTransaction });
                  console.log(`✍️ [PUSH] Associados ${relations.length} badges à assinatura ${finalId}.`);
                }

                serverId = finalId;
              } catch (err) {
                console.error('💥 [ERRO ASSINATURA]:', err.message);
                throw err; // Relança para acionar rollback local
              }
            } else if (canonicalEntity === 'documentos_submissao') {
              if (operationType === 'delete') {
                const targetDocId = opPayload.id_ficheiro || opPayload.id || opPayload.id_servidor;
                const doc = await Documentos.findOne({
                  where: { id_ficheiro: targetDocId },
                  include: [{
                    model: Submissoes,
                    where: { id_utilizador: userId }
                  }],
                  transaction: localTransaction
                });

                if (doc) {
                  await Documentos.destroy({
                    where: { id_ficheiro: targetDocId },
                    transaction: localTransaction
                  });
                  console.log(`✅ [PUSH] Documento ${targetDocId} removido com sucesso.`);
                  serverId = targetDocId;
                } else {
                  console.log(`⚠️ [PUSH] Documento ${targetDocId} não encontrado ou sem autorização BOLA.`);
                }
              } else {
                // INSERT
                console.log('📄 [PUSH] A processar documento para id_submissao:', opPayload.id_submissao);

                const targetSubId = opPayload.id_submissao;

                if (!targetSubId) {
                  console.log('⚠️ [PUSH] Submissão não encontrada para o documento:', opPayload);
                  await localTransaction.rollback();
                  continue;
                }

                // Mapear campos para garantir compatibilidade com o Modelo Documentos
                const docData = {
                  id_submissao: targetSubId,
                  id_requisito: opPayload.id_requisito || 1,
                  ficheiro: opPayload.url_ficheiro || opPayload.caminho_local || opPayload.url || opPayload.nome_ficheiro || opPayload.nome || '',
                  nome_ficheiro: opPayload.nome_ficheiro || opPayload.nome,
                  url_ficheiro: opPayload.url_ficheiro || opPayload.caminho_local || opPayload.url,
                  user_id: op.user_id || req.user.id,
                  updated_file: new Date(),
                  deleted_file: false
                };

                const novoDoc = await Documentos.create(docData, { transaction: localTransaction });
                console.log('✅ [PUSH] Documento criado com sucesso no Postgres! ID:', novoDoc.id_ficheiro || novoDoc.id);
                serverId = novoDoc.id_ficheiro || novoDoc.id;
              }
            } else {
              const pkValue = opPayload[config.pkField];
              let exists = null;

              // Blindagem BOLA: Adicionar filtro por dono nos Updates e Deletes
              const whereCondition = { [config.pkField]: pkValue };
              if (userId && config.userIdField) {
                whereCondition[config.userIdField] = userId;
              }

              if (operationType === 'delete') {
                const affectedRows = await config.model.destroy({
                  where: whereCondition,
                  transaction: localTransaction
                });
                if (affectedRows > 0) {
                  console.log(`✅ [PUSH] Registo ${pkValue} de ${canonicalEntity} removido.`);
                  serverId = pkValue;
                } else {
                  console.log(`⚠️ [PUSH] Falha ao remover registo ${pkValue} em ${canonicalEntity} (não encontrado ou sem autorização BOLA).`);
                }
              } else {
                if (pkValue && pkValue > 0) {
                  exists = await config.model.findOne({
                    where: whereCondition,
                    paranoid: false,
                    transaction: localTransaction
                  });
                }

                if (exists) {
                  // Caso UPDATE com BOLA
                  const updateData = { ...opPayload };
                  delete updateData[config.pkField];
                  delete updateData.id_local;

                  if (userId && config.userIdField) {
                    updateData[config.userIdField] = userId;
                  }

                  let executeUpdate = true;
                  if (canonicalEntity === 'submissoes') {
                    const clientUpdatedAt = opPayload.updated_at ? new Date(opPayload.updated_at) : null;
                    const serverUpdatedAt = exists.updated_submissao ? new Date(exists.updated_submissao) : null;
                    if (clientUpdatedAt && serverUpdatedAt && clientUpdatedAt < serverUpdatedAt) {
                      executeUpdate = false;
                      console.log(`⚠️ [PUSH LWW] Update ignorado para submissão ${pkValue}. Data cliente (${clientUpdatedAt.toISOString()}) é anterior à do servidor (${serverUpdatedAt.toISOString()}).`);
                    }
                  }

                  if (executeUpdate) {
                    await config.model.update(updateData, {
                      where: whereCondition,
                      transaction: localTransaction
                    });
                  }
                  serverId = exists[config.pkField];
                } else {
                  // Caso INSERT
                  const createData = { ...opPayload };
                  delete createData[config.pkField];
                  delete createData.id_local;

                  // Fallbacks para campos obrigatórios
                  if (canonicalEntity === 'submissoes' && !createData.data_submissao) {
                    createData.data_submissao = new Date();
                  }
                  if (canonicalEntity === 'objetivos' && !createData.data_inicial) {
                    createData.data_inicial = new Date();
                  }
                  if (canonicalEntity === 'objetivos' && !createData.data_final) {
                    const df = new Date();
                    df.setMonth(df.getMonth() + 1);
                    createData.data_final = df;
                  }
                  if (canonicalEntity === 'user_badges' && !createData.data_obtencao) {
                    createData.data_obtencao = new Date();
                  }

                  if (userId && config.userIdField) {
                    createData[config.userIdField] = userId;
                    createData.user_id = userId;
                    createData.id_user = userId;
                  }

                  const newRecord = await config.model.create(createData, { transaction: localTransaction });
                  serverId = newRecord[config.pkField] || newRecord.id;
                }
              }
            }

            await localTransaction.commit();

            if (canonicalEntity === 'submissoes' && tempId !== undefined && tempId !== null) {
              submissaoIdMap.set(tempId, serverId);
            }

            if (canonicalEntity === 'submissoes') {
              if (tempId !== undefined && tempId !== null) {
                processedIds.submissoes[tempId] = isNaN(serverId) ? serverId : Number(serverId);
              }
            } else if (processedIds[canonicalEntity]) {
              processedIds[canonicalEntity].push({
                id_local: tempId !== undefined && tempId !== null ? (isNaN(tempId) ? tempId : Number(tempId)) : null,
                id_servidor: isNaN(serverId) ? serverId : Number(serverId)
              });
            }

          } catch (err) {
            await localTransaction.rollback();
            console.error(`\x1b[31m💥 [PUSH AUDIT ERROR] Falha na entidade '${canonicalEntity}' (Operação: ${operationType}):\x1b[0m`, err.message);
            if (err.errors) {
              console.error('  Detalhes Sequelize:', err.errors.map(e => e.message));
            }
          }
        }

        return res.status(200).json({
          success: true,
          message: "Sincronização Push concluída com sucesso.",
          processed_ids: processedIds
        });

      } catch (error) {
        console.error("Erro global no push de sincronização:", error);
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

        const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const uploadResult = await cloudinary.uploader.upload(fileBase64, {
          folder: 'evidencias_badges',
          resource_type: 'auto'
        });

        const novoDocumento = await Documentos.create({
          id_submissao: parseInt(id_submissao),
          id_requisito: parseInt(id_requisito),
          ficheiro: uploadResult.secure_url
        });

        return res.status(200).json({
          success: true,
          data: {
            id_ficheiro: novoDocumento.id_ficheiro || novoDocumento.id,
            id_submissao: novoDocumento.id_submissao,
            url: uploadResult.secure_url
          }
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
