const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

function inicializarFirebaseSeNecessario() {
  // 1. Se já existirem apps inicializadas no admin, retorna true
  if (admin.apps && admin.apps.length > 0) {
    return true;
  }

  // Tentar via getApps() modular
  try {
    const { getApps } = require('firebase-admin/app');
    if (getApps().length > 0) {
      return true;
    }
  } catch (e) {
    // Ignorar se o módulo de app não estiver disponível
  }

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
    } else if (!serviceAccount) {
      const localPath = path.join(__dirname, 'aplicacaopint-firebase-adminsdk-fbsvc-6e8dee6143.json');
      if (fs.existsSync(localPath)) {
        serviceAccount = require(localPath);
      }
    }

    if (serviceAccount) {
      let credentialObj;
      try {
        const { cert } = require('firebase-admin/app');
        credentialObj = cert(serviceAccount);
      } catch (e) {
        if (admin.credential && typeof admin.credential.cert === 'function') {
          credentialObj = admin.credential.cert(serviceAccount);
        } else if (admin.default && admin.default.credential) {
          credentialObj = admin.default.credential.cert(serviceAccount);
        }
      }

      admin.initializeApp({ credential: credentialObj });
      console.log('🚀 [Firebase] SDK Inicializado com SUCESSO!');
      return true;
    }
  } catch (err) {
    // 🌟 SE O ERRO FOR QUE O DEFAULT JÁ EXISTE, SIGNIFICA QUE ESTÁ PRONTO!
    if (err.message && err.message.includes('already exists')) {
      return true;
    }
    console.error('❌ [Firebase] Erro ao inicializar SDK:', err.message);
  }

  return false;
}

// Tentar inicializar imediatamente ao carregar o módulo
inicializarFirebaseSeNecessario();

async function sendSyncPush() {
  const pronto = inicializarFirebaseSeNecessario();

  if (!pronto) {
    console.warn('⚠️ [FCM Push] Envio ignorado: Firebase não pôde ser inicializado.');
    return;
  }

  try {
    let messaging;
    try {
      const { getMessaging } = require('firebase-admin/messaging');
      messaging = getMessaging();
    } catch (e) {
      if (admin.messaging && typeof admin.messaging === 'function') {
        messaging = admin.messaging();
      } else if (admin.default && typeof admin.default.messaging === 'function') {
        messaging = admin.default.messaging();
      }
    }

    if (!messaging) {
      console.warn('⚠️ [FCM Push] Não foi possível obter a instância do Messaging.');
      return;
    }

    await messaging.send({
      topic: 'sync_updates',
      data: {
        action: 'SYNC_NOW',
        type: 'DATABASE_CHANGE',
        timestamp: new Date().toISOString()
      }
    });

    console.log('🚀 [FCM Push] Notificação silenciosa enviada com SUCESSO para o tópico sync_updates!');
  } catch (err) {
    console.error('❌ [FCM Push] Erro ao disparar mensagem no Firebase:', err.message);
  }
}

module.exports = {
  sendSyncPush,
  notifySyncAvailable: sendSyncPush,
  inicializarFirebaseSeNecessario
};
