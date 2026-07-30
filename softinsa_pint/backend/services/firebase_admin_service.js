const firebaseAdmin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

function createFirebaseAdminService({
  admin = firebaseAdmin,
  env = process.env,
  warn = (code) => console.warn(`[Firebase] indisponivel: ${code}`)
} = {}) {
  let initialized = false;
  let available = false;
  let messaging = null;
  let warningShown = false;

  function warnOnce(code) {
    if (warningShown) return;
    warningShown = true;
    warn(code);
  }

  function parseServiceAccount(rawValue) {
    try {
      const parsed = JSON.parse(rawValue);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
      if (typeof parsed.private_key === 'string') {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function initializeFirebaseAdmin() {
    if (initialized) return available;
    initialized = true;

    try {
      let serviceAccount = null;
      const secretsDir = '/etc/secrets';

      // 1. Procurar dinamicamente por qualquer ficheiro .json na pasta /etc/secrets do Render
      if (fs.existsSync(secretsDir)) {
        const files = fs.readdirSync(secretsDir);
        const jsonFile = files.find(f => f.endsWith('.json'));
        
        if (jsonFile) {
          const fullPath = path.join(secretsDir, jsonFile);
          serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          console.log(`📂 [Firebase Admin SDK] Credenciais carregadas de: ${fullPath}`);
        }
      }

      // 2. Fallbacks secundários (Variáveis de Ambiente)
      if (!serviceAccount) {
        const envCreds = env.FIREBASE_SERVICE_ACCOUNT || env.FIREBASE_SERVICE_ACCOUNT_JSON || env.FIREBASE_CREDENTIALS;
        if (envCreds) {
          const parsed = parseServiceAccount(envCreds);
          if (parsed) {
            serviceAccount = parsed;
            console.log('📂 [Firebase Admin SDK] Credenciais carregadas de variável de ambiente.');
          } else {
            // Se não for JSON válido, tenta carregar como path
            try {
              serviceAccount = JSON.parse(fs.readFileSync(envCreds, 'utf8'));
              console.log(`📂 [Firebase Admin SDK] Credenciais carregadas de ficheiro da variável de ambiente: ${envCreds}`);
            } catch (_) {
              serviceAccount = envCreds;
            }
          }
        }
      }

      // 3. Fallbacks para ficheiros locais por omissão
      if (!serviceAccount) {
        const localPaths = [
          path.join(__dirname, 'aplicacaopint-firebase-adminsdk-fbsvc-6e8dee6143.json'),
          path.join(__dirname, '..', 'firebase-adminsdk.json')
        ];
        for (const p of localPaths) {
          if (fs.existsSync(p)) {
            try {
              serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8'));
              console.log(`📂 [Firebase Admin SDK] Credenciais carregadas do caminho local: ${p}`);
              break;
            } catch (_) {}
          }
        }
      }

      const activeApps = admin.apps || (admin.default && admin.default.apps) || [];

      let credential;
      if (serviceAccount) {
        if (admin.credential && typeof admin.credential.cert === 'function') {
          credential = admin.credential.cert(serviceAccount);
        } else if (admin.default && admin.default.credential) {
          credential = admin.default.credential.cert(serviceAccount);
        } else {
          const { cert } = require('firebase-admin/app');
          credential = cert(serviceAccount);
        }
      } else if (env.GOOGLE_APPLICATION_CREDENTIALS) {
        credential = admin.credential.applicationDefault();
      } else {
        warnOnce('credentials_not_configured');
        return false;
      }

      const app = activeApps.length > 0
        ? (admin.app ? admin.app() : admin.default.app())
        : admin.initializeApp({ credential });
      messaging = app.messaging();
      available = Boolean(messaging);
      return available;
    } catch (_) {
      available = false;
      messaging = null;
      warnOnce('firebase_initialization_failed');
      return false;
    }
  }

  function isFirebaseAvailable() {
    return initializeFirebaseAdmin();
  }

  function getMessaging() {
    return initializeFirebaseAdmin() ? messaging : null;
  }

  return {
    getMessaging,
    initializeFirebaseAdmin,
    isFirebaseAvailable
  };
}

const service = createFirebaseAdminService();

module.exports = {
  ...service,
  _createForTests: createFirebaseAdminService
};
