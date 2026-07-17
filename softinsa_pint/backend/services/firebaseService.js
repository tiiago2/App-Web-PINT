const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let isInitialized = false;

try {
  let credential;

  // 1. Tentar ler as credenciais do Firebase a partir das Variáveis de Ambiente
  if (process.env.FIREBASE_CREDENTIALS) {
    try {
      // Se for uma string JSON contendo as credenciais completas
      const parsedCreds = JSON.parse(process.env.FIREBASE_CREDENTIALS);
      credential = admin.credential.cert(parsedCreds);
    } catch (e) {
      // Se não for JSON válido, assume-se que é o caminho absoluto/relativo para o ficheiro JSON
      credential = admin.credential.cert(process.env.FIREBASE_CREDENTIALS);
    }
  } else {
    // 2. Se não houver variável de ambiente, tenta carregar o ficheiro padrão no projeto
    const defaultPath = path.join(__dirname, '..', 'firebase-adminsdk.json');
    if (fs.existsSync(defaultPath)) {
      credential = admin.credential.cert(defaultPath);
    } else {
      console.warn("Aviso: Credenciais do Firebase não detetadas. O envio de notificações automáticas de sync estará inativo.");
    }
  }

  // Inicializar o SDK apenas se conseguirmos obter credenciais válidas
  if (credential) {
    admin.initializeApp({
      credential: credential
    });
    isInitialized = true;
    console.log("Firebase Admin SDK inicializado com sucesso.");
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
