const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

/**
 * Função interna para garantir que o Firebase Admin SDK está inicializado
 */
function inicializarFirebaseSeNecessario() {
  const activeApps = admin.apps || (admin.default && admin.default.apps) || [];
  if (activeApps.length > 0) {
    return true;
  }

  try {
    let serviceAccount = null;
    const secretsDir = '/etc/secrets';

    // 1. Procurar por ficheiro .json na pasta de segredos do Render
    if (fs.existsSync(secretsDir)) {
      const files = fs.readdirSync(secretsDir);
      const jsonFile = files.find(f => f.endsWith('.json'));
      if (jsonFile) {
        const fullPath = path.join(secretsDir, jsonFile);
        serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        console.log(`📂 [Firebase] Credenciais carregadas de: ${fullPath}`);
      }
    }

    // 2. Fallback para variável de ambiente ou ficheiro local por omissão
    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else if (!serviceAccount) {
      const localPath = path.join(__dirname, 'aplicacaopint-firebase-adminsdk-fbsvc-6e8dee6143.json');
      if (fs.existsSync(localPath)) {
        serviceAccount = require(localPath);
      }
    }

    // 3. Tentar inicializar se encontrou credenciais
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
    } else {
      console.warn('⚠️ [Firebase] Nenhum ficheiro .json encontrado em /etc/secrets/ nem em variáveis de ambiente.');
    }
  } catch (err) {
    console.error('❌ [Firebase] Erro ao inicializar SDK:', err.message);
  }

  return false;
}

// Tentar inicializar imediatamente ao carregar o módulo
inicializarFirebaseSeNecessario();

/**
 * Função de envio de Push Silencioso para a app Flutter
 */
async function sendSyncPush() {
  // Garantir que está inicializado (Auto-Init em tempo de execução)
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
