const db = require('./models');

async function listUsers() {
  try {
    const users = await db.Utilizador.findAll({
      attributes: ['id_utilizador', 'email', 'ativo']
    });

    console.log('--- ALL USERS IN DB ---');
    users.forEach(u => {
      console.log(`- ID: ${u.id_utilizador} | Email: "${u.email}" | Ativo: ${u.ativo}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('💥 Erro:', err);
    process.exit(1);
  }
}

listUsers();
