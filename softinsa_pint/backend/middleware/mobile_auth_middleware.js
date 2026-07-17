const mobileAuthService = require('../services/mobile_auth_service');

function criarMobileAuthMiddleware(service = mobileAuthService) {
  return async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res.status(401).json({
        success: false,
        error: 'Access token não fornecido.'
      });
    }

    const match = /^Bearer ([^\s]+)$/.exec(authorization);
    if (!match) {
      return res.status(401).json({
        success: false,
        error: 'Formato de autorização inválido.'
      });
    }

    try {
      const payload = service.verificarAccessToken(match[1]);
      const mobileUser = await service.obterUtilizadorAutorizado(payload.id_utilizador);
      req.mobileAuth = { id_utilizador: payload.id_utilizador };
      req.mobileUser = mobileUser.user;
      return next();
    } catch (error) {
      if (error.statusCode === 403) {
        return res.status(403).json({ success: false, error: error.message });
      }

      if (error.statusCode === 500) {
        console.error('Configuração da autenticação mobile indisponível.');
        return res.status(500).json({
          success: false,
          error: 'Autenticação mobile indisponível.'
        });
      }

      const expired = error.name === 'TokenExpiredError';
      return res.status(401).json({
        success: false,
        error: expired ? 'Access token expirado.' : 'Access token inválido.'
      });
    }
  };
}

module.exports = criarMobileAuthMiddleware();
module.exports._criarParaTestes = criarMobileAuthMiddleware;
