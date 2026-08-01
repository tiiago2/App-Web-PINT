const ACCESS_TOKEN_ISSUER = 'softinsa-pint';
const ACCESS_TOKEN_AUDIENCE = 'mobile-api';
const ACCESS_TOKEN_TYPE = 'mobile_access';
const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const DEFAULT_REFRESH_TOKEN_TTL_DAYS = 30;

function criarErroHttp(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function inteiroPositivo(value, fallback) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function criarMobileAuthService({ db, bcrypt, jwt, crypto, env, now }) {
  const currentEnv = env || process.env;
  const agora = now || (() => new Date());

  function configuracao() {
    const secret = currentEnv.MOBILE_JWT_SECRET;
    if (typeof secret !== 'string' || secret.trim().length < 32) {
      throw criarErroHttp(500, 'Autenticação mobile indisponível.');
    }

    return {
      secret,
      accessTtlSeconds: inteiroPositivo(
        currentEnv.MOBILE_ACCESS_TOKEN_TTL_SECONDS,
        DEFAULT_ACCESS_TOKEN_TTL_SECONDS
      ),
      refreshTtlDays: inteiroPositivo(
        currentEnv.MOBILE_REFRESH_TOKEN_TTL_DAYS,
        DEFAULT_REFRESH_TOKEN_TTL_DAYS
      )
    };
  }

  function formatarUtilizador(utilizador, consultor) {
    return {
      id: utilizador.id_utilizador,
      nome: utilizador.nome_user,
      email: utilizador.email,
      telefone: utilizador.telefone,
      foto: utilizador.imagem_perfil,
      area_id: consultor.id_area,
      primeiro_login: Boolean(utilizador.primeiro_login)
    };
  }

  function gerarAccessToken(utilizador) {
    const config = configuracao();
    const token = jwt.sign({
      id_utilizador: utilizador.id_utilizador,
      token_type: ACCESS_TOKEN_TYPE
    }, config.secret, {
      algorithm: 'HS256',
      subject: String(utilizador.id_utilizador),
      issuer: ACCESS_TOKEN_ISSUER,
      audience: ACCESS_TOKEN_AUDIENCE,
      expiresIn: config.accessTtlSeconds
    });

    return {
      token,
      expiresIn: config.accessTtlSeconds
    };
  }

  function verificarAccessToken(token) {
    const config = configuracao();
    const payload = jwt.verify(token, config.secret, {
      algorithms: ['HS256'],
      issuer: ACCESS_TOKEN_ISSUER,
      audience: ACCESS_TOKEN_AUDIENCE
    });
    const idUtilizador = Number(payload.id_utilizador);

    if (
      payload.token_type !== ACCESS_TOKEN_TYPE
      || !Number.isSafeInteger(idUtilizador)
      || idUtilizador <= 0
      || String(payload.sub) !== String(idUtilizador)
    ) {
      throw criarErroHttp(401, 'Access token inválido.');
    }

    return { id_utilizador: idUtilizador };
  }

  function gerarRefreshToken() {
    const config = configuracao();
    const token = crypto.randomBytes(64).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(token, 'utf8').digest('hex');
    const expiresAt = new Date(
      agora().getTime() + config.refreshTtlDays * 24 * 60 * 60 * 1000
    );

    return { token, tokenHash, expiresAt };
  }

  function hashRefreshToken(token) {
    return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
  }

  function hashesIguais(first, second) {
    if (!/^[a-f0-9]{64}$/i.test(first || '') || !/^[a-f0-9]{64}$/i.test(second || '')) {
      return false;
    }

    const firstBuffer = Buffer.from(first, 'hex');
    const secondBuffer = Buffer.from(second, 'hex');
    return firstBuffer.length === secondBuffer.length
      && crypto.timingSafeEqual(firstBuffer, secondBuffer);
  }

  async function obterUtilizadorAutorizado(idUtilizador, transaction) {
    const [utilizador, consultor] = await Promise.all([
      db.Utilizador.findByPk(idUtilizador, { transaction }),
      db.Consultor.findOne({
        where: { id_utilizador: idUtilizador },
        transaction
      })
    ]);

    if (!utilizador) {
      throw criarErroHttp(401, 'Utilizador inválido.');
    }

    if (!consultor || utilizador.ativo !== true || consultor.ativo !== true) {
      throw criarErroHttp(403, 'Utilizador não autorizado para a aplicação mobile.');
    }

    return {
      utilizador,
      consultor,
      user: formatarUtilizador(utilizador, consultor)
    };
  }

  async function login({ email, password, deviceId }) {
    const emailInput = email.trim().toLowerCase();
    const utilizador = await db.Utilizador.findOne({
      where: db.Sequelize.where(
        db.Sequelize.fn('LOWER', db.Sequelize.col('email')),
        emailInput
      )
    });
    const passwordValida = utilizador
      ? await bcrypt.compare(password, utilizador.password)
      : false;

    if (!utilizador || !passwordValida) {
      throw criarErroHttp(401, 'Credenciais inválidas.');
    }

    const dadosUtilizador = await obterUtilizadorAutorizado(utilizador.id_utilizador);
    const accessToken = gerarAccessToken(utilizador);
    const refreshToken = gerarRefreshToken();

    await db.sequelize.transaction(async (transaction) => {
      const tokensAtivos = await db.MobileRefreshToken.findAll({
        where: {
          id_utilizador: utilizador.id_utilizador,
          device_id: deviceId,
          revoked_at: null
        },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      const criado = await db.MobileRefreshToken.create({
        id_utilizador: utilizador.id_utilizador,
        device_id: deviceId,
        token_hash: refreshToken.tokenHash,
        expires_at: refreshToken.expiresAt,
        revoked_at: null,
        replaced_by_token_id: null,
        created_at: agora(),
        updated_at: agora()
      }, { transaction });
      const instanteRevogacao = agora();

      for (const tokenAtivo of tokensAtivos) {
        await tokenAtivo.update({
          revoked_at: instanteRevogacao,
          replaced_by_token_id: criado.id_mobile_refresh_token,
          updated_at: instanteRevogacao
        }, { transaction });
      }
    });

    return {
      accessToken: accessToken.token,
      refreshToken: refreshToken.token,
      expiresIn: accessToken.expiresIn,
      user: dadosUtilizador.user
    };
  }

  async function refresh({ refreshToken: rawRefreshToken, deviceId }) {
    const tokenHash = hashRefreshToken(rawRefreshToken);

    return db.sequelize.transaction(async (transaction) => {
      const tokenAtual = await db.MobileRefreshToken.findOne({
        where: { token_hash: tokenHash },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!tokenAtual || !hashesIguais(tokenAtual.token_hash, tokenHash)) {
        throw criarErroHttp(401, 'Refresh token inválido.');
      }

      if (tokenAtual.device_id !== deviceId) {
        throw criarErroHttp(401, 'Refresh token inválido para este dispositivo.');
      }

      if (tokenAtual.revoked_at) {
        throw criarErroHttp(401, 'Refresh token revogado.');
      }

      if (new Date(tokenAtual.expires_at).getTime() <= agora().getTime()) {
        throw criarErroHttp(401, 'Refresh token expirado.');
      }

      const dadosUtilizador = await obterUtilizadorAutorizado(
        tokenAtual.id_utilizador,
        transaction
      );
      const novoAccessToken = gerarAccessToken(dadosUtilizador.utilizador);
      const novoRefreshToken = gerarRefreshToken();
      const novoTokenPersistido = await db.MobileRefreshToken.create({
        id_utilizador: tokenAtual.id_utilizador,
        device_id: deviceId,
        token_hash: novoRefreshToken.tokenHash,
        expires_at: novoRefreshToken.expiresAt,
        revoked_at: null,
        replaced_by_token_id: null,
        created_at: agora(),
        updated_at: agora()
      }, { transaction });
      const instanteRotacao = agora();

      await tokenAtual.update({
        revoked_at: instanteRotacao,
        replaced_by_token_id: novoTokenPersistido.id_mobile_refresh_token,
        updated_at: instanteRotacao
      }, { transaction });

      return {
        accessToken: novoAccessToken.token,
        refreshToken: novoRefreshToken.token,
        expiresIn: novoAccessToken.expiresIn
      };
    });
  }

  async function logout({ refreshToken: rawRefreshToken, deviceId }) {
    const tokenHash = hashRefreshToken(rawRefreshToken);

    await db.sequelize.transaction(async (transaction) => {
      const tokenAtual = await db.MobileRefreshToken.findOne({
        where: { token_hash: tokenHash },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!tokenAtual) {
        return;
      }

      if (!hashesIguais(tokenAtual.token_hash, tokenHash) || tokenAtual.device_id !== deviceId) {
        throw criarErroHttp(401, 'Refresh token inválido para este dispositivo.');
      }

      if (!tokenAtual.revoked_at) {
        const instanteRevogacao = agora();
        await tokenAtual.update({
          revoked_at: instanteRevogacao,
          updated_at: instanteRevogacao
        }, { transaction });
      }
    });

    return { success: true };
  }

  return {
    login,
    refresh,
    logout,
    verificarAccessToken,
    obterUtilizadorAutorizado
  };
}

let defaultService;

function obterServicePadrao() {
  if (!defaultService) {
    defaultService = criarMobileAuthService({
      db: require('../models'),
      bcrypt: require('bcrypt'),
      jwt: require('jsonwebtoken'),
      crypto: require('crypto'),
      env: process.env
    });
  }

  return defaultService;
}

module.exports = {
  login: (...args) => obterServicePadrao().login(...args),
  refresh: (...args) => obterServicePadrao().refresh(...args),
  logout: (...args) => obterServicePadrao().logout(...args),
  verificarAccessToken: (...args) => obterServicePadrao().verificarAccessToken(...args),
  obterUtilizadorAutorizado: (...args) => obterServicePadrao().obterUtilizadorAutorizado(...args),
  _criarParaTestes: criarMobileAuthService
};
