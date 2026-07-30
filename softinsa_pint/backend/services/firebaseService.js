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

  // 3. Verificação Segura de Apps Inicializadas (à prova de undefined)
  const existingApps = (admin && Array.isArray(admin.apps)) ? admin.apps : [];

  if (serviceAccount && existingApps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    isInitialized = true;
    console.log("Firebase Admin SDK inicializado com sucesso.");
  } else if (existingApps.length > 0) {
    isInitialized = true;
    console.log('ℹ️ [Firebase Admin SDK] Já se encontrava inicializado.');
  } else {
    console.warn("Aviso: Credenciais do Firebase não detetadas. O envio de notificações automáticas de sync estará inativo.");
  }
} catch (error) {
  console.error("Erro fatal ao inicializar Firebase Admin SDK:", error);
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
    const response = await admin.messaging().send(message);
    console.log(`[Firebase Cloud Messaging] Notificação de sync enviada com sucesso para o tópico "${topic}":`, response);
  } catch (error) {
    // Envolvido em try/catch robusto para que falhas de rede ou credenciais do Firebase
    // nunca deitem abaixo a API ou impeçam a gravação da transação do Sequelize.
    console.error("[Firebase Cloud Messaging] Erro ao disparar notificação silenciosa de sync:", error.message);
  }
};
