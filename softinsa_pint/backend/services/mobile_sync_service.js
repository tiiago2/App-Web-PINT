const db = require('../models');
const { Op, QueryTypes, Transaction } = require('sequelize');
const { calcularRanking } = require('../helpers/rankingHelper');
const {
  carregarEstadoPessoalBadges
} = require('./personal_badges_service');
const mobileSyncChangeService = require('./mobile_sync_change_service');

const IDS_PERMISSOES_MOBILE = [1, 2, 3];

function intervaloTemporal(since, syncUntil) {
  return {
    [Op.gt]: since,
    [Op.lte]: syncUntil
  };
}

function erroHttp(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function perfilSeguro(utilizador, consultor) {
  if (!utilizador || !consultor) {
    return null;
  }

  const area = consultor.Area || null;
  const serviceLine = area?.ServiceLine || null;
  const learningPath = serviceLine?.LearningPath || null;
  const timestamps = [utilizador.update_user, consultor.update_user]
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()));
  const updatedAt = timestamps.length > 0
    ? new Date(Math.max(...timestamps.map((value) => value.getTime())))
    : null;

  return {
    id: utilizador.id_utilizador,
    user_id: utilizador.id_utilizador,
    id_utilizador: utilizador.id_utilizador,
    nome: utilizador.nome_user,
    nome_user: utilizador.nome_user,
    email: utilizador.email,
    telefone: utilizador.telefone,
    foto: utilizador.imagem_perfil,
    imagem_perfil: utilizador.imagem_perfil,
    ativo: Boolean(utilizador.ativo && consultor.ativo),
    id_area: consultor.id_area,
    pontos_totais: consultor.pontos_totais,
    area: area ? {
      id_area: area.id_area,
      nome_area: area.nome_area
    } : null,
    service_line: serviceLine ? {
      id_service_line: serviceLine.id_service_line,
      nome_service_line: serviceLine.nome_service_line
    } : null,
    learning_path: learningPath ? {
      id_learning_path: learningPath.id_learning_path,
      nome_learning_path: learningPath.nome_learning_path
    } : null,
    updated_at: updatedAt ? updatedAt.toISOString() : null,
    update_user: updatedAt ? updatedAt.toISOString() : null
  };
}

async function obterUtilizadorConsultor(idUtilizador, transaction) {
  const [utilizador, consultor] = await Promise.all([
    db.Utilizador.findByPk(idUtilizador, {
      attributes: [
        'id_utilizador',
        'nome_user',
        'email',
        'telefone',
        'imagem_perfil',
        'ativo',
        'update_user'
      ],
      transaction
    }),
    db.Consultor.findByPk(idUtilizador, {
      attributes: [
        'id_utilizador',
        'id_area',
        'pontos_totais',
        'ativo',
        'update_user'
      ],
      include: [{
        model: db.Area,
        attributes: ['id_area', 'id_service_line', 'nome_area'],
        required: false,
        include: [{
          model: db.ServiceLine,
          attributes: ['id_service_line', 'id_learning_path', 'nome_service_line'],
          required: false,
          include: [{
            model: db.LearningPath,
            attributes: ['id_learning_path', 'nome_learning_path'],
            required: false
          }]
        }]
      }],
      transaction
    })
  ]);

  if (!consultor) {
    throw erroHttp(403, 'A sincronização mobile está disponível apenas para consultores.');
  }

  if (!utilizador) {
    throw erroHttp(404, 'Utilizador autenticado não encontrado.');
  }

  return { utilizador, consultor };
}

async function obterSnapshotsCalculados(idUtilizador, transaction, syncUntil) {
  const [niveis, areas, ranking, userBadges] = await Promise.all([
    db.Nivel.findAll({
      attributes: ['id_nivel', 'nome_nivel'],
      order: [['id_nivel', 'ASC']],
      raw: true,
      transaction
    }),
    db.Area.findAll({
      attributes: ['id_area', 'id_service_line'],
      where: { deleted_area: false },
      order: [['id_area', 'ASC'], ['id_service_line', 'ASC']],
      raw: true,
      transaction
    }),
    calcularRanking(null, { includeAreaId: true, transaction, agora: syncUntil }),
    carregarEstadoPessoalBadges(idUtilizador, { transaction, agora: syncUntil })
  ]);

  return {
    niveis,
    areasServiceLines: areas.map((area) => ({
      id_area: area.id_area,
      id_service_line: area.id_service_line
    })),
    userBadges,
    outrosUsers: ranking
      .filter((item) => Number(item.id) !== Number(idUtilizador))
      .map((item) => ({
        id_utilizador: item.id,
        nome_user: item.nome,
        id_area: item.id_area ?? null,
        pontos_semanais: item.pontos_semana,
        pontos_mensais: item.pontos_mes,
        pontos_anuais: item.pontos_ano
      }))
      .sort((left, right) => left.id_utilizador - right.id_utilizador)
  };
}

async function obterAssinatura(idUtilizador, filtroAtualizacao, transaction) {
  const whereAssinatura = { id_proprietario: idUtilizador };

  // No modo incremental aplica o filtro temporal sobre update_assinatura
  if (filtroAtualizacao) {
    whereAssinatura.update_assinatura = filtroAtualizacao;
  }

  const assinatura = await db.Assinatura.findOne({
    where: whereAssinatura,
    raw: true,
    transaction
  });

  if (!assinatura) {
    return { assinatura: null, badgesAssinatura: [] };
  }

  const badgesAssinatura = await db.BadgesAssinatura.findAll({
    where: { id_assinatura: assinatura.id_assinatura },
    order: [['id_badge', 'ASC']],
    raw: true,
    transaction
  });

  return { assinatura, badgesAssinatura };
}

async function obterNotificacoesAtuais(idUtilizador, filtroAtualizacao, transaction) {

  let query = `
    SELECT 
      n.id_notificacao, 
      n.id_utilizador, 
      n.descricao_notificacao, 
      n.data_envio, 
      n.tipo_notificacao, 
      n.updated_notificacao, 
      n.deleted_notificacao,
      r.lida,
      r.last_read,
      r.updated_recetor
    FROM notificacoes n
    INNER JOIN recetor r ON n.id_notificacao = r.id_notificacao
    WHERE r.id_utilizador = :idUtilizador
      AND n.deleted_notificacao = false
      AND (r.deleted_recetor = false OR r.deleted_recetor IS NULL)
  `;

  let replacements = { idUtilizador };

  if (filtroAtualizacao) {
    query += ` AND (
      (n.updated_notificacao > :since AND n.updated_notificacao <= :syncUntil) OR
      (r.updated_recetor > :since AND r.updated_recetor <= :syncUntil)
    )`;
    replacements.since = filtroAtualizacao[Op.gt];
    replacements.syncUntil = filtroAtualizacao[Op.lte];
  }

  query += ` ORDER BY n.id_notificacao ASC`;

  const resultados = await db.sequelize.query(query, {
    replacements,
    type: QueryTypes.SELECT,
    transaction
  });

  if (resultados.length === 0) {
    return { notificacoes: [], recetores: [] };
  }

  // Separa os campos de cada tabela em duas listas distintas.
  // O JOIN com r.id_utilizador garante exatamente um recetor por linha.
  const notificacoes = resultados.map(row => ({
    id_notificacao: row.id_notificacao,
    id_utilizador: row.id_utilizador,
    descricao_notificacao: row.descricao_notificacao,
    data_envio: row.data_envio,
    tipo_notificacao: row.tipo_notificacao,
    updated_notificacao: row.updated_notificacao,
    deleted_notificacao: row.deleted_notificacao
  }));

  const recetores = resultados.map(row => ({
    id_notificacao: row.id_notificacao,
    id_utilizador: idUtilizador,
    lida: row.lida ?? 0,
    last_read: row.last_read ?? null,
    updated_recetor: row.updated_recetor
  }));

  return { notificacoes, recetores };
}


async function obterSubmissoesFull(idUtilizador, transaction) {
  const submissoes = await db.Submissoes.findAll({
    where: {
      id_utilizador: idUtilizador,
      status: { [Op.ne]: 'em_progresso' }
    },
    order: [['id_submissao', 'ASC']],
    raw: true,
    transaction
  });
  const idsSubmissoes = submissoes.map((submissao) => submissao.id_submissao);

  if (idsSubmissoes.length === 0) {
    return { submissoes, historico: [], documentos: [] };
  }

  const [historico, documentos] = await Promise.all([
    db.Historico.findAll({
      where: { id_submissao: { [Op.in]: idsSubmissoes } },
      order: [['id_submissao', 'ASC'], ['id_utilizador', 'ASC']],
      raw: true,
      transaction
    }),
    db.Documentos.findAll({
      where: {
        id_submissao: { [Op.in]: idsSubmissoes },
        deleted_file: false
      },
      order: [['id_submissao', 'ASC'], ['id_ficheiro', 'ASC']],
      raw: true,
      transaction
    })
  ]);

  return { submissoes, historico, documentos };
}

async function obterSubmissoesIncrementais(idUtilizador, intervalo, transaction) {
  const [submissoesCriadasOuEnviadas, historicoAlterado] = await Promise.all([
    db.Submissoes.findAll({
      where: {
        id_utilizador: idUtilizador,
        status: { [Op.ne]: 'em_progresso' },
        data_submissao: intervalo
      },
      attributes: ['id_submissao'],
      raw: true,
      transaction
    }),
    db.Historico.findAll({
      where: { data_avaliacao: intervalo },
      attributes: ['id_submissao'],
      include: [{
        model: db.Submissoes,
        attributes: [],
        required: true,
        where: {
          id_utilizador: idUtilizador,
          status: { [Op.ne]: 'em_progresso' }
        }
      }],
      raw: true,
      transaction
    })
  ]);
  const idsAfetados = [...new Set([
    ...submissoesCriadasOuEnviadas.map((submissao) => submissao.id_submissao),
    ...historicoAlterado.map((entrada) => entrada.id_submissao)
  ])];

  const documentos = await db.Documentos.findAll({
    where: { updated_file: intervalo },
    include: [{
      model: db.Submissoes,
      attributes: [],
      required: true,
      where: {
        id_utilizador: idUtilizador,
        status: { [Op.ne]: 'em_progresso' }
      }
    }],
    order: [['id_submissao', 'ASC'], ['id_ficheiro', 'ASC']],
    raw: true,
    transaction
  });

  if (idsAfetados.length === 0) {
    return { submissoes: [], historico: [], documentos };
  }

  const [submissoes, historico] = await Promise.all([
    db.Submissoes.findAll({
      where: {
        id_submissao: { [Op.in]: idsAfetados },
        id_utilizador: idUtilizador,
        status: { [Op.ne]: 'em_progresso' }
      },
      order: [['id_submissao', 'ASC']],
      raw: true,
      transaction
    }),
    db.Historico.findAll({
      where: {
        id_submissao: { [Op.in]: idsAfetados },
        data_avaliacao: intervalo
      },
      order: [['id_submissao', 'ASC'], ['id_utilizador', 'ASC']],
      raw: true,
      transaction
    })
  ]);

  return { submissoes, historico, documentos };
}

async function sincronizacaoFull(idUtilizador, utilizador, consultor, transaction, syncUntil) {
  const [
    permissoes,
    learningPaths,
    serviceLines,
    areas,
    badges,
    requisitos,
    requisitosBadges,
    registosBadges,
    dadosSubmissoes,
    objetivos,
    dadosNotificacoes,
    dadosAssinatura,
    snapshotsCalculados
  ] = await Promise.all([
    db.Permissoes.findAll({
      where: { id_permissao: { [Op.in]: IDS_PERMISSOES_MOBILE } },
      order: [['id_permissao', 'ASC']],
      raw: true,
      transaction
    }),
    db.LearningPath.findAll({
      where: { deleted_path: false },
      order: [['id_learning_path', 'ASC']],
      raw: true,
      transaction
    }),
    db.ServiceLine.findAll({
      where: { deleted_service: false },
      order: [['id_service_line', 'ASC']],
      raw: true,
      transaction
    }),
    db.Area.findAll({
      where: { deleted_area: false },
      order: [['id_area', 'ASC']],
      raw: true,
      transaction
    }),
    db.Badges.findAll({
      where: { deleted_badge: false },
      order: [['id_badge', 'ASC']],
      raw: true,
      transaction
    }),
    db.Requisitos.findAll({
      where: { deleted_requisitos: false },
      order: [['id_requisito', 'ASC']],
      raw: true,
      transaction
    }),
    db.RequisitosBadge.findAll({
      order: [['id_badge', 'ASC'], ['id_requisito', 'ASC']],
      raw: true,
      transaction
    }),
    db.RegistoBadges.findAll({
      where: { id_utilizador: idUtilizador },
      order: [['id_registo', 'ASC']],
      raw: true,
      transaction
    }),
    obterSubmissoesFull(idUtilizador, transaction),
    db.Objetivos.findAll({
      where: {
        id_utilizador: idUtilizador,
        deleted_objetivo: false
      },
      order: [['id_objetivo', 'ASC']],
      raw: true,
      transaction
    }),
    obterNotificacoesAtuais(idUtilizador, null, transaction),
    obterAssinatura(idUtilizador, null, transaction),
    obterSnapshotsCalculados(idUtilizador, transaction, syncUntil)
  ]);

  return {
    perfil: perfilSeguro(utilizador, consultor),
    permissoes,
    learning_paths: learningPaths,
    service_lines: serviceLines,
    areas,
    areas_service_lines: snapshotsCalculados.areasServiceLines,
    niveis: snapshotsCalculados.niveis,
    badges,
    user_badges: snapshotsCalculados.userBadges,
    requisitos,
    requisitos_badges: { upserts: requisitosBadges, deleted: [] },
    registos_badges: registosBadges,
    submissoes: dadosSubmissoes.submissoes,
    historico: dadosSubmissoes.historico,
    documentos: dadosSubmissoes.documentos,
    objetivos,
    notificacoes: { upserts: dadosNotificacoes.notificacoes, deleted: [] },
    recetores_notificacoes: dadosNotificacoes.recetores,
    assinatura: dadosAssinatura.assinatura,
    badges_assinatura: dadosAssinatura.badgesAssinatura,
    outros_users: snapshotsCalculados.outrosUsers
  };
}

async function sincronizacaoIncremental(
  idUtilizador,
  utilizador,
  consultor,
  since,
  syncUntil,
  transaction
) {
  const intervalo = intervaloTemporal(since, syncUntil);
  const areaPerfil = consultor.Area || null;
  const serviceLinePerfil = areaPerfil?.ServiceLine || null;
  const learningPathPerfil = serviceLinePerfil?.LearningPath || null;
  const [
    utilizadorAlterado,
    consultorAlterado,
    areaPerfilAlterada,
    serviceLinePerfilAlterada,
    learningPathPerfilAlterado
  ] = await Promise.all([
    db.Utilizador.findOne({
      where: { id_utilizador: idUtilizador, update_user: intervalo },
      attributes: ['id_utilizador'],
      raw: true,
      transaction
    }),
    db.Consultor.findOne({
      where: { id_utilizador: idUtilizador, update_user: intervalo },
      attributes: ['id_utilizador'],
      raw: true,
      transaction
    }),
    areaPerfil ? db.Area.findOne({
      where: { id_area: areaPerfil.id_area, updated_area: intervalo },
      attributes: ['id_area'],
      raw: true,
      transaction
    }) : null,
    serviceLinePerfil ? db.ServiceLine.findOne({
      where: {
        id_service_line: serviceLinePerfil.id_service_line,
        updated_service: intervalo
      },
      attributes: ['id_service_line'],
      raw: true,
      transaction
    }) : null,
    learningPathPerfil ? db.LearningPath.findOne({
      where: {
        id_learning_path: learningPathPerfil.id_learning_path,
        updated_path: intervalo
      },
      attributes: ['id_learning_path'],
      raw: true,
      transaction
    }) : null
  ]);

  const [
    permissoes,
    learningPaths,
    serviceLines,
    areas,
    badges,
    requisitos,
    requisitosBadges,
    requisitosBadgesDeleted,
    registosBadges,
    dadosSubmissoes,
    objetivos,
    dadosNotificacoes,
    notificacoesDeleted,
    dadosAssinatura,
    snapshotsCalculados
  ] = await Promise.all([
    db.Permissoes.findAll({
      where: {
        id_permissao: { [Op.in]: IDS_PERMISSOES_MOBILE },
        updated_permissao: intervalo
      },
      order: [['id_permissao', 'ASC']],
      raw: true,
      transaction
    }),
    db.LearningPath.findAll({
      where: { updated_path: intervalo },
      order: [['id_learning_path', 'ASC']],
      raw: true,
      transaction
    }),
    db.ServiceLine.findAll({
      where: { updated_service: intervalo },
      order: [['id_service_line', 'ASC']],
      raw: true,
      transaction
    }),
    db.Area.findAll({
      where: { updated_area: intervalo },
      order: [['id_area', 'ASC']],
      raw: true,
      transaction
    }),
    db.Badges.findAll({
      where: { update_badge: intervalo },
      order: [['id_badge', 'ASC']],
      raw: true,
      transaction
    }),
    db.Requisitos.findAll({
      where: { updated_requisitos: intervalo },
      order: [['id_requisito', 'ASC']],
      raw: true,
      transaction
    }),
    db.RequisitosBadge.findAll({
      where: { updated_requisito_badge: intervalo },
      order: [['id_badge', 'ASC'], ['id_requisito', 'ASC']],
      raw: true,
      transaction
    }),
    db.SyncRequisitoBadgeDeleted.findAll({
      where: { deleted_at: intervalo },
      order: [['id_sync_delete', 'ASC']],
      raw: true,
      transaction
    }),
    db.RegistoBadges.findAll({
      where: {
        id_utilizador: idUtilizador,
        data_obtencao: intervalo
      },
      order: [['id_registo', 'ASC']],
      raw: true,
      transaction
    }),
    obterSubmissoesIncrementais(idUtilizador, intervalo, transaction),
    db.Objetivos.findAll({
      where: {
        id_utilizador: idUtilizador,
        [Op.or]: [
          { data_inicial: intervalo },
          { data_conclusao: intervalo }
        ]
      },
      order: [['id_objetivo', 'ASC']],
      raw: true,
      transaction
    }),
    obterNotificacoesAtuais(idUtilizador, intervalo, transaction),
    db.SyncRecetorDeleted.findAll({
      where: {
        id_utilizador: idUtilizador,
        deleted_at: intervalo
      },
      order: [['id_sync_delete', 'ASC']],
      raw: true,
      transaction
    }),
    obterAssinatura(idUtilizador, intervalo, transaction),
    obterSnapshotsCalculados(idUtilizador, transaction, syncUntil)
  ]);

  return {
    perfil: utilizadorAlterado || consultorAlterado ||
      areaPerfilAlterada || serviceLinePerfilAlterada || learningPathPerfilAlterado
      ? perfilSeguro(utilizador, consultor)
      : null,
    permissoes,
    learning_paths: learningPaths,
    service_lines: serviceLines,
    areas,
    areas_service_lines: snapshotsCalculados.areasServiceLines,
    niveis: snapshotsCalculados.niveis,
    badges,
    user_badges: snapshotsCalculados.userBadges,
    requisitos,
    requisitos_badges: {
      upserts: requisitosBadges,
      deleted: requisitosBadgesDeleted
    },
    registos_badges: registosBadges,
    submissoes: dadosSubmissoes.submissoes,
    historico: dadosSubmissoes.historico,
    documentos: dadosSubmissoes.documentos,
    objetivos,
    notificacoes: {
      upserts: dadosNotificacoes.notificacoes,
      deleted: notificacoesDeleted
    },
    recetores_notificacoes: dadosNotificacoes.recetores,
    assinatura: dadosAssinatura.assinatura,
    badges_assinatura: dadosAssinatura.badgesAssinatura,
    outros_users: snapshotsCalculados.outrosUsers
  };
}

async function obterSyncUntil(transaction) {
  const rows = await db.sequelize.query(
    'SELECT CURRENT_TIMESTAMP AS sync_until',
    { type: QueryTypes.SELECT, transaction }
  );
  const syncUntil = new Date(rows[0]?.sync_until);

  if (Number.isNaN(syncUntil.getTime())) {
    throw new Error('Timestamp de sincronização indisponível.');
  }

  return syncUntil;
}

async function sincronizarMobile({ idUtilizador, since, cursor, limit }) {
  // A rota /pull e 100% de leitura — nao faz qualquer escrita na BD.
  // Usar uma transacao partilhada com dezenas de queries em Promise.all
  // causava "rollback has been called on this transaction" quando qualquer
  // query colide na mesma ligacao pg. Cada query corre agora de forma
  // independente, sem objeto de transacao partilhado.
  const syncUntil = await obterSyncUntil(null);
  const { utilizador, consultor } = await obterUtilizadorConsultor(
    idUtilizador,
    null
  );
  const watermark = await mobileSyncChangeService.obterWatermark({
    idUtilizador,
    transaction: null,
    fallbackTimestamp: syncUntil
  });

  if (cursor) {
    const page = await mobileSyncChangeService.listarAlteracoes({
      cursor,
      watermark,
      idUtilizador,
      limit,
      transaction: null
    });
    const fullData = await sincronizacaoFull(
      idUtilizador,
      utilizador,
      consultor,
      null,
      syncUntil
    );

    return {
      data: mobileSyncChangeService.projectarDados(fullData, page.changes),
      syncUntil,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
      changeDeletes: mobileSyncChangeService.deletesDoChangeLog(page.changes)
    };
  }

  if (since) {
    const compatibilityCursor = { changedAt: since, changeId: 0 };
    const pending = await mobileSyncChangeService.listarAlteracoes({
      cursor: compatibilityCursor,
      watermark,
      idUtilizador,
      limit: 1,
      transaction: null
    });
    const data = await sincronizacaoIncremental(
      idUtilizador,
      utilizador,
      consultor,
      since,
      syncUntil,
      null
    );

    return {
      data,
      syncUntil,
      nextCursor: compatibilityCursor,
      hasMore: pending.changes.length > 0,
      changeDeletes: []
    };
  }

  const data = await sincronizacaoFull(
    idUtilizador,
    utilizador,
    consultor,
    null,
    syncUntil
  );

  return {
    data,
    syncUntil,
    nextCursor: watermark,
    hasMore: false,
    changeDeletes: []
  };
}

module.exports = {
  sincronizarMobile
};
