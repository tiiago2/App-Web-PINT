const firebaseAdmin = require('firebase-admin');

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
      const serviceAccountJson = String(env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim();
      const applicationCredentials = String(env.GOOGLE_APPLICATION_CREDENTIALS || '').trim();
      let credential;

      if (serviceAccountJson) {
        const serviceAccount = parseServiceAccount(serviceAccountJson);
        if (!serviceAccount) {
          warnOnce('invalid_service_account_json');
          return false;
        }
        credential = admin.credential.cert(serviceAccount);
      } else if (applicationCredentials) {
        credential = admin.credential.applicationDefault();
      } else {
        warnOnce('credentials_not_configured');
        return false;
      }

      const app = Array.isArray(admin.apps) && admin.apps.length > 0
        ? admin.app()
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
