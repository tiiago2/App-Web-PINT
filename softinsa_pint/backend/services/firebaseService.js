const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

/**
 * Tenta inicializar o Firebase apenas quando for necessário (Lazy Load)
 */
function inicializarFirebaseSeNecessario() {
  // 1. Se já existirem apps inicializadas, considera PRONTO
  try {
    if (admin.apps && admin.apps.length > 0) return true;

    const { getApps } = require('firebase-admin/app');
    if (getApps().length > 0) return true;
  } catch (e) {
    // Ignorar erro de verificação modular
  }

  // 2. Se não estiver inicializado, tenta ler as credenciais
  try {
    let serviceAccount = null;
    const secretsDir = '/etc/secrets';

    if (fs.existsSync(secretsDir)) {
      const files = fs.readdirSync(secretsDir);
      const jsonFile = files.find(f => f.endsWith('.json'));
      if (jsonFile) {
        serviceAccount = JSON.parse(fs.readFileSync(path.join(secretsDir, jsonFile), 'utf8'));
      }
    }

    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }

    if (serviceAccount) {
      let credentialObj;
      try {
        const { cert } = require('firebase-admin/app');
        credentialObj = cert(serviceAccount);
      } catch (e) {
        credentialObj = admin.credential.cert(serviceAccount);
      }

      admin.initializeApp({ credential: credentialObj });
      console.log('🚀 [Firebase] SDK Inicializado com SUCESSO!');
      return true;
    }
  } catch (err) {
    // Se disser que já existe (default app already exists), é um SUCESSO
    if (err.message && err.message.includes('already exists')) {
      return true;
    }
    console.error('❌ [Firebase] Erro ao inicializar SDK:', err.message);
  }

  return false;
}

// ⚠️ NOTA: Não chamamos nada no topo do ficheiro para não bloquear o boot do servidor!

/**
 * Função de envio de Push Silencioso para a app Flutter
 */
async function sendSyncPush() {
  try {
    const pronto = inicializarFirebaseSeNecessario();

    if (!pronto) {
      console.warn('⚠️ [FCM Push] Envio ignorado: Firebase não pôde ser inicializado.');
      return;
    }

    let messaging;
    try {
      const { getMessaging } = require('firebase-admin/messaging');
      messaging = getMessaging();
    } catch (e) {
      messaging = admin.messaging();
    }

    await messaging.send({
      topic: 'sync_updates',
      data: {
        type: 'DATABASE_CHANGE',
        timestamp: new Date().toISOString()
      }
    });

    console.log('🚀 [FCM Push] Notificação silenciosa enviada com SUCESSO para o tópico sync_updates!');
  } catch (err) {
    console.error('❌ [FCM Push] Erro ao disparar mensagem no Firebase:', err.message);
  }
}

module.exports = { sendSyncPush };