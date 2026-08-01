const db = require('./softinsa_pint/backend/models');

async function checkPasswords() {
  try {
    const users = await db.Utilizador.findAll({
      limit: 10,
      attributes: ['id_utilizador', 'email', 'password', 'ativo']
    });

    console.log('--- USERS IN DB ---');
    users.forEach(u => {
      const isBcrypt = u.password.startsWith('$2b$') || u.password.startsWith('$2a$');
      console.log(`ID: ${u.id_utilizador} | Email: ${u.email} | Pass: ${u.password} (Bcrypt? ${isBcrypt}) | Ativo: ${u.ativo}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error checking passwords:', err);
    process.exit(1);
  }
}

checkPasswords();
