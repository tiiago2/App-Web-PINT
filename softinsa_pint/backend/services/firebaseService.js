const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let isInitialized = false;

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
      console.log(`📂 Credenciais do Firebase carregadas com sucesso de: ${fullPath}`);
    }
  }

  // 2. Fallbacks secundários (Variáveis de Ambiente)
  if (!serviceAccount) {
    const envCreds = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_CREDENTIALS;
    if (envCreds) {
      try {
        serviceAccount = JSON.parse(envCreds);
        console.log('📂 Credenciais do Firebase carregadas de variável de ambiente (JSON).');
      } catch (e) {
        try {
          serviceAccount = JSON.parse(fs.readFileSync(envCreds, 'utf8'));
          console.log(`📂 Credenciais do Firebase carregadas de ficheiro da variável de ambiente: ${envCreds}`);
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
          console.log(`📂 Credenciais do Firebase carregadas do caminho local: ${p}`);
          break;
        } catch (_) {}
      }
    }
  }

  // 3. Inicialização Resiliente do Firebase SDK
  if (serviceAccount) {
    try {
      const activeApps = admin.apps || (admin.default && admin.default.apps) || [];

      if (activeApps.length === 0) {
        // Obter a função cert de forma segura para qualquer versão do SDK
        let credentialObj;

        if (admin.credential && typeof admin.credential.cert === 'function') {
          credentialObj = admin.credential.cert(serviceAccount);
        } else if (admin.default && admin.default.credential) {
          credentialObj = admin.default.credential.cert(serviceAccount);
        } else {
          // Fallback para o módulo modern firebase-admin/app
          const { cert } = require('firebase-admin/app');
          credentialObj = cert(serviceAccount);
        }

        admin.initializeApp({
          credential: credentialObj
        });

        isInitialized = true;
        console.log('🚀 [Firebase Admin SDK] Inicializado com SUCESSO!');
      } else {
        isInitialized = true;
        console.log('ℹ️ [Firebase Admin SDK] Já se encontrava inicializado.');
      }
    } catch (initErr) {
      console.error('❌ Erro fatal ao inicializar Firebase Admin SDK:', initErr.message);
    }
  } else {
    console.warn('⚠️ Aviso: Credenciais do Firebase não detetadas. O envio de notificações automáticas de sync estará inativo.');
  }
} catch (error) {
  console.error("Erro fatal ao inicializar Firebase Admin SDK:", error);
}

/**
 * Obtém a instância do Firebase Messaging de forma compatível com todas as versões do SDK
 */
function getMessagingInstance() {
  try {
    // 1. Tentar o método moderno (firebase-admin/messaging)
    try {
      const { getMessaging } = require('firebase-admin/messaging');
      return getMessaging();
    } catch (e) {
      // Ignorar se a sub-biblioteca modular não estiver disponível
    }

    // 2. Tentar o método clássico admin.messaging()
    if (admin && typeof admin.messaging === 'function') {
      return admin.messaging();
    }

    // 3. Tentar via admin.default.messaging()
    if (admin && admin.default && typeof admin.default.messaging === 'function') {
      return admin.default.messaging();
    }

    throw new Error('Não foi possível obter a função de messaging do Firebase Admin SDK.');
  } catch (err) {
    console.error('❌ Erro ao obter instância do Messaging:', err.message);
    return null;
  }
}

/**
 * Envia uma mensagem silenciosa (Data Message) para o tópico 'sync_updates'
 * notificando a aplicação móvel de que existem novos dados para descarregar.
 */
exports.notifySyncAvailable = async () => {
  // Evitar erros se o Firebase não tiver sido configurado/inicializado com credenciais
  if (!isInitialized) {
    console.log("Notificação de sincronização ignorada: Firebase SDK não está configurado.");
    return;
  }

  const topic = 'sync_updates';
  const message = {
    // Apenas campo "data" para ser uma notificação silenciosa que acorda a app em background
    data: {
      action: 'SYNC_NOW'
    },
    topic: topic
  };

  try {
    const messaging = getMessagingInstance();
    if (!messaging) {
      console.warn('⚠️ [FCM] Notificação ignorada: Serviço de Messaging não disponível.');
      return;
    }
    const response = await messaging.send(message);
    console.log(`[Firebase Cloud Messaging] Notificação de sync enviada com sucesso para o tópico "${topic}":`, response);
  } catch (error) {
    // Envolvido em try/catch robusto para que falhas de rede ou credenciais do Firebase
    // nunca deitem abaixo a API ou impeçam a gravação da transação do Sequelize.
    console.error("[Firebase Cloud Messaging] Erro ao disparar notificação silenciosa de sync:", error.message);
  }
};
