const { Utilizador } = require('../models');

async function run() {
  try {
    const users = await Utilizador.findAll();
    console.log("Users in database:");
    users.forEach(u => {
      console.log(`- ID: ${u.id_utilizador}, Email: ${u.email}, Hashed: ${u.password ? u.password.startsWith('$2') : false}`);
    });
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

run();
