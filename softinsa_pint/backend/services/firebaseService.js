const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ── AUTO-INICIALIZAÇÃO NO ARRANQUE DO FICHEIRO ──────────────────────────
if (!admin.apps || admin.apps.length === 0) {
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
        if (admin.credential && typeof admin.credential.cert === 'function') {
          credentialObj = admin.credential.cert(serviceAccount);
        } else if (admin.default && admin.default.credential) {
          credentialObj = admin.default.credential.cert(serviceAccount);
        }
      }

      admin.initializeApp({ credential: credentialObj });
      console.log('🚀 [Firebase Service] SDK Inicializado com SUCESSO via Secret File!');
    } else {
      console.warn('⚠️ [Firebase Service] Ficheiro de credenciais não encontrado.');
    }
  } catch (err) {
    console.error('❌ [Firebase Service] Erro ao auto-inicializar:', err.message);
  }
}

// ── FUNÇÃO DE ENVIO SEGURA ──────────────────────────────────────────────
async function sendSyncPush() {
  const activeApps = admin.apps || (admin.default && admin.default.apps) || [];
  if (activeApps.length === 0) {
    console.warn('⚠️ [FCM Push] Notificação ignorada: Firebase ainda não foi inicializado.');
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

    // Enviamos ambos os campos (SYNC_NOW e DATABASE_CHANGE) para manter compatibilidade total
    await messaging.send({
      topic: 'sync_updates',
      data: {
        action: 'SYNC_NOW',
        type: 'DATABASE_CHANGE',
        timestamp: new Date().toISOString()
      }
    });
    console.log('🚀 [FCM Push] Notificação de Sync enviada para o tópico!');
  } catch (err) {
    console.error('❌ [FCM Push] Erro ao enviar mensagem:', err.message);
  }
}

module.exports = {
  sendSyncPush,
  notifySyncAvailable: sendSyncPush
};
