const dbPadrao = require('../models');
const { Op: opPadrao } = require('sequelize');

function erroHttp(statusCode, message, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (code) error.code = code;
  return error;
}

function inteiroPositivo(value, field) {
  const normalized = typeof value === 'string' && /^\d+$/.test(value)
    ? Number(value)
    : value;
  if (!Number.isSafeInteger(normalized) || normalized <= 0) {
    throw erroHttp(400, `${field} deve ser um inteiro positivo.`);
  }
  return normalized;
}

function dataCivil(value, field) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw erroHttp(400, `${field} deve usar o formato YYYY-MM-DD.`);
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    throw erroHttp(400, `${field} não é uma data válida.`);
  }
  return date;
}

function valoresDoRegisto(registo) {
  return typeof registo?.get === 'function' ? registo.get({ plain: true }) : registo;
}

function formatarObjetivo(registo) {
  const objetivo = valoresDoRegisto(registo);
  return {
    id_objetivo: objetivo.id_objetivo,
    id_badge: objetivo.id_badge,
    id_utilizador: objetivo.id_utilizador,
    data_inicial: objetivo.data_inicial,
    data_final: objetivo.data_final,
    data_conclusao: objetivo.data_conclusao ?? null,
    deleted_objetivo: Boolean(objetivo.deleted_objetivo)
  };
}

function validarTexto(value, field, maxLength) {
  if (typeof value !== 'string') {
    throw erroHttp(400, `${field} deve ser texto.`);
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw erroHttp(400, `${field} é inválido.`);
  }
  return normalized;
}

function validarTelefone(value) {
  const text = typeof value === 'number' ? String(value) : value;
  if (typeof text !== 'string' || !/^\d{1,10}$/.test(text)) {
    throw erroHttp(400, 'telefone é inválido.');
  }
  const normalized = Number(text);
  if (!Number.isSafeInteger(normalized) || normalized <= 0 || normalized > 2147483647) {
    throw erroHttp(400, 'telefone é inválido.');
  }
  return normalized;
}

function validarEmail(value) {
  const normalized = validarTexto(value, 'email', 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw erroHttp(400, 'email é inválido.');
  }
  return normalized;
}

function validarFoto(value) {
  const normalized = validarTexto(value, 'foto', 2048);
  let url;
  try {
    url = new URL(normalized);
  } catch {
    throw erroHttp(400, 'foto deve ser um URL HTTP ou HTTPS válido.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw erroHttp(400, 'foto deve ser um URL HTTP ou HTTPS válido.');
  }
  return normalized;
}

function criarMobileMutationService({ db = dbPadrao, Op = opPadrao, now = () => new Date() } = {}) {
  async function criarObjetivo({ idUtilizador, body }) {
    const idBadge = inteiroPositivo(body?.id_badge, 'id_badge');
    const dataInicial = dataCivil(body?.data_inicial, 'data_inicial');
    const dataFinal = dataCivil(body?.data_final, 'data_final');

    if (dataFinal.getTime() < dataInicial.getTime()) {
      throw erroHttp(400, 'data_final não pode ser anterior a data_inicial.');
    }

    const badge = await db.Badges.findOne({
      where: { id_badge: idBadge, deleted_badge: false }
    });
    if (!badge) throw erroHttp(404, 'Badge não encontrado ou inativo.');

    const duplicado = await db.Objetivos.findOne({
      where: {
        id_utilizador: idUtilizador,
        id_badge: idBadge,
        deleted_objetivo: false,
        data_conclusao: null
      }
    });
    if (duplicado) {
      throw erroHttp(409, 'Já existe um objetivo ativo para este badge.', 'OBJETIVO_DUPLICADO');
    }

    const objetivo = await db.Objetivos.create({
      id_badge: idBadge,
      id_utilizador: idUtilizador,
      data_inicial: dataInicial,
      data_final: dataFinal,
      deleted_objetivo: false,
      data_eliminacao: null,
      data_conclusao: null,
      notificacao_fim: false
    });
    return formatarObjetivo(objetivo);
  }

  async function eliminarObjetivo({ idUtilizador, idObjetivo }) {
    const normalizedId = inteiroPositivo(idObjetivo, 'idObjetivo');
    const objetivo = await db.Objetivos.findOne({
      where: { id_objetivo: normalizedId }
    });

    if (!objetivo) {
      return { deleted: true, id_objetivo: normalizedId };
    }
    if (Number(objetivo.id_utilizador) !== Number(idUtilizador)) {
      throw erroHttp(403, 'Não tem permissão para eliminar este objetivo.');
    }
    if (!objetivo.deleted_objetivo) {
      await objetivo.update({
        deleted_objetivo: true,
        data_eliminacao: now()
      });
    }
    return { deleted: true, id_objetivo: normalizedId };
  }

  function normalizarPerfil(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw erroHttp(400, 'Body inválido.');
    }

    const permitidos = new Set(['nome', 'email', 'telefone', 'foto']);
    const recebidos = Object.keys(body);
    const proibido = recebidos.find((field) => !permitidos.has(field));
    if (proibido) throw erroHttp(400, `O campo ${proibido} não pode ser alterado.`);
    if (recebidos.length === 0) throw erroHttp(400, 'Indique pelo menos um campo de perfil.');

    const updates = {};
    if (Object.hasOwn(body, 'nome')) updates.nome_user = validarTexto(body.nome, 'nome', 255);
    if (Object.hasOwn(body, 'email')) updates.email = validarEmail(body.email);
    if (Object.hasOwn(body, 'telefone')) updates.telefone = validarTelefone(body.telefone);
    if (Object.hasOwn(body, 'foto')) updates.imagem_perfil = validarFoto(body.foto);
    return updates;
  }

  async function atualizarPerfil({ idUtilizador, body }) {
    const updates = normalizarPerfil(body);
    return db.sequelize.transaction(async (transaction) => {
      const utilizador = await db.Utilizador.findByPk(idUtilizador, {
        transaction,
        lock: transaction.LOCK?.UPDATE
      });
      const consultor = await db.Consultor.findOne({
        where: { id_utilizador: idUtilizador },
        transaction,
        lock: transaction.LOCK?.UPDATE
      });
      if (!utilizador || !consultor) throw erroHttp(404, 'Perfil mobile não encontrado.');

      if (updates.email && updates.email !== utilizador.email) {
        const existente = await db.Utilizador.findOne({
          where: {
            email: updates.email,
            id_utilizador: { [Op.ne]: idUtilizador }
          },
          transaction
        });
        if (existente) throw erroHttp(409, 'Já existe outro utilizador com este email.');
      }

      const updatedAt = now();
      const persisted = { ...updates, update_user: updatedAt };
      await utilizador.update(persisted, { transaction });
      await consultor.update(persisted, { transaction });

      return {
        id: utilizador.id_utilizador,
        nome: utilizador.nome_user,
        email: utilizador.email,
        telefone: utilizador.telefone,
        foto: utilizador.imagem_perfil,
        area_id: consultor.id_area
      };
    });
  }

  function normalizarBadgeIds(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw erroHttp(400, 'Body inválido.');
    }
    const recebidos = Object.keys(body);
    if (recebidos.some((field) => field !== 'badge_ids')) {
      throw erroHttp(400, 'A assinatura aceita apenas o campo badge_ids.');
    }
    if (!Array.isArray(body.badge_ids)) {
      throw erroHttp(400, 'badge_ids deve ser um array.');
    }
    if (body.badge_ids.length > 100) {
      throw erroHttp(400, 'badge_ids excede o limite permitido.');
    }

    const ids = body.badge_ids.map((id) => inteiroPositivo(id, 'badge_ids'));
    if (new Set(ids).size !== ids.length) {
      throw erroHttp(400, 'badge_ids não pode conter duplicados.');
    }
    return ids;
  }

  function registoValido(registo, badgePorId, agora) {
    if (registo.expirado) return false;
    const badge = badgePorId.get(Number(registo.id_badge));
    if (!badge || badge.deleted_badge) return false;
    const validade = Number(badge.validade);
    if (!Number.isInteger(validade) || validade <= 0) return true;
    const obtencao = new Date(registo.data_obtencao);
    const expiracao = new Date(obtencao);
    expiracao.setUTCDate(expiracao.getUTCDate() + validade);
    return Number.isFinite(expiracao.getTime()) && expiracao > agora;
  }

  async function atualizarAssinatura({ idUtilizador, body }) {
    const badgeIds = normalizarBadgeIds(body);
    return db.sequelize.transaction(async (transaction) => {
      if (badgeIds.length > 0) {
        const [badges, registos] = await Promise.all([
          db.Badges.findAll({
            where: { id_badge: { [Op.in]: badgeIds }, deleted_badge: false },
            transaction
          }),
          db.RegistoBadges.findAll({
            where: {
              id_utilizador: idUtilizador,
              id_badge: { [Op.in]: badgeIds },
              expirado: false
            },
            transaction
          })
        ]);
        const badgePorId = new Map(badges.map((badge) => [Number(badge.id_badge), badge]));
        const validos = new Set(
          registos
            .filter((registo) => registoValido(registo, badgePorId, now()))
            .map((registo) => Number(registo.id_badge))
        );
        if (badgeIds.some((id) => !validos.has(id))) {
          throw erroHttp(403, 'A assinatura contém um badge que não pertence ao utilizador ou está expirado.');
        }
      }

      let assinatura = await db.Assinatura.findOne({
        where: { id_proprietario: idUtilizador },
        transaction,
        lock: transaction.LOCK?.UPDATE
      });
      const updatedAt = now();
      if (!assinatura) {
        assinatura = await db.Assinatura.create({
          id_proprietario: idUtilizador,
          update_assinatura: updatedAt
        }, { transaction });
      } else {
        await assinatura.update({ update_assinatura: updatedAt }, { transaction });
      }

      await db.BadgesAssinatura.destroy({
        where: { id_assinatura: assinatura.id_assinatura },
        transaction
      });
      if (badgeIds.length > 0) {
        await db.BadgesAssinatura.bulkCreate(
          badgeIds.map((idBadge) => ({
            id_assinatura: assinatura.id_assinatura,
            id_badge: idBadge
          })),
          { transaction }
        );
      }

      return {
        id_assinatura: assinatura.id_assinatura,
        id_proprietario: Number(idUtilizador),
        badge_ids: badgeIds,
        update_assinatura: updatedAt
      };
    });
  }

  return {
    criarObjetivo,
    eliminarObjetivo,
    atualizarPerfil,
    atualizarAssinatura
  };
}

module.exports = criarMobileMutationService();
module.exports._criarParaTestes = criarMobileMutationService;
