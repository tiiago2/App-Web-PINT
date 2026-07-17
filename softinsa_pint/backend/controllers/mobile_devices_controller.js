const db = require('../models');

const LIMITS = {
  token: 4096,
  device_id: 255,
  platform: 32
};

function normalizeRequiredString(value, field) {
  if (typeof value !== 'string') {
    const error = new Error(`${field} é obrigatório.`);
    error.statusCode = 400;
    throw error;
  }

  const normalized = value.trim();
  if (!normalized) {
    const error = new Error(`${field} não pode estar vazio.`);
    error.statusCode = 400;
    throw error;
  }
  if (normalized.length > LIMITS[field]) {
    const error = new Error(`${field} excede o tamanho permitido.`);
    error.statusCode = 400;
    throw error;
  }
  return normalized;
}

exports.registerDevice = async (req, res) => {
  try {
    const idUtilizador = req.utilizadorLogado.id_utilizador;
    const token = normalizeRequiredString(req.body?.token, 'token');
    const deviceId = normalizeRequiredString(req.body?.device_id, 'device_id');
    const platform = normalizeRequiredString(req.body?.platform, 'platform').toLowerCase();
    let created = false;

    await db.sequelize.transaction(async (transaction) => {
      await db.MobileDevice.update(
        { ativo: false, updated_at: new Date() },
        {
          where: { fcm_token: token, ativo: true },
          transaction
        }
      );

      const existing = await db.MobileDevice.findOne({
        where: {
          id_utilizador: idUtilizador,
          device_id: deviceId
        },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (existing) {
        await existing.update({
          fcm_token: token,
          platform,
          ativo: true,
          updated_at: new Date()
        }, { transaction });
      } else {
        await db.MobileDevice.create({
          id_utilizador: idUtilizador,
          device_id: deviceId,
          fcm_token: token,
          platform,
          ativo: true,
          created_at: new Date(),
          updated_at: new Date()
        }, { transaction });
        created = true;
      }
    });

    return res.status(created ? 201 : 200).json({
      registered: true,
      device_id: deviceId,
      active: true
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Erro interno ao registar dispositivo móvel.');
    return res.status(500).json({ error: 'Erro ao registar dispositivo.' });
  }
};

exports.deactivateDevice = async (req, res) => {
  try {
    const idUtilizador = req.utilizadorLogado.id_utilizador;
    const deviceId = normalizeRequiredString(req.params.deviceId, 'device_id');
    await db.MobileDevice.update(
      { ativo: false, updated_at: new Date() },
      {
        where: {
          id_utilizador: idUtilizador,
          device_id: deviceId
        }
      }
    );
    return res.status(200).json({
      deactivated: true,
      device_id: deviceId
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Erro interno ao desativar dispositivo móvel.');
    return res.status(500).json({ error: 'Erro ao desativar dispositivo.' });
  }
};
