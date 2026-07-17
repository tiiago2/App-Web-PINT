const mobileAuthService = require('../services/mobile_auth_service');

const LIMITES = {
  email: 320,
  password: 4096,
  device_id: 255,
  refresh_token: 1024
};

function erroValidacao(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function textoObrigatorio(value, field, { trim = true } = {}) {
  if (typeof value !== 'string') {
    throw erroValidacao(`${field} é obrigatório.`);
  }

  const normalized = trim ? value.trim() : value;
  if (!normalized) {
    throw erroValidacao(`${field} é obrigatório.`);
  }

  if (normalized.length > LIMITES[field]) {
    throw erroValidacao(`${field} excede o tamanho permitido.`);
  }

  return normalized;
}

function responderErro(res, error, operation) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
  }

  console.error(`Erro interno na autenticação mobile (${operation}).`);
  return res.status(500).json({
    success: false,
    error: 'Erro interno na autenticação mobile.'
  });
}

function criarMobileAuthController(service = mobileAuthService) {
  return {
    async login(req, res) {
      try {
        const email = textoObrigatorio(req.body?.email, 'email');
        const password = textoObrigatorio(req.body?.password, 'password', { trim: false });
        const deviceId = textoObrigatorio(req.body?.device_id, 'device_id');
        const result = await service.login({ email, password, deviceId });

        return res.status(200).json({
          success: true,
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
          token_type: 'Bearer',
          expires_in: result.expiresIn,
          user: result.user
        });
      } catch (error) {
        return responderErro(res, error, 'login');
      }
    },

    async refresh(req, res) {
      try {
        const refreshToken = textoObrigatorio(
          req.body?.refresh_token,
          'refresh_token'
        );
        const deviceId = textoObrigatorio(req.body?.device_id, 'device_id');
        const result = await service.refresh({ refreshToken, deviceId });

        return res.status(200).json({
          success: true,
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
          token_type: 'Bearer',
          expires_in: result.expiresIn
        });
      } catch (error) {
        return responderErro(res, error, 'refresh');
      }
    },

    async logout(req, res) {
      try {
        const refreshToken = textoObrigatorio(
          req.body?.refresh_token,
          'refresh_token'
        );
        const deviceId = textoObrigatorio(req.body?.device_id, 'device_id');
        await service.logout({ refreshToken, deviceId });

        return res.status(200).json({ success: true });
      } catch (error) {
        return responderErro(res, error, 'logout');
      }
    },

    me(req, res) {
      return res.status(200).json({
        success: true,
        user: req.mobileUser
      });
    }
  };
}

module.exports = criarMobileAuthController();
module.exports._criarParaTestes = criarMobileAuthController;
