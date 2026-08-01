const db = require('./softinsa_pint/backend/models');

async function run() {
  try {
    const [results, metadata] = await db.sequelize.query(`
      UPDATE utilizador 
      SET email = 'jose@softinsa.pt',
          ativo = true
      WHERE id_utilizador = 15 OR LOWER(email) = 'jose.silva@exemplo.com';
    `);
    console.log("Update successful. Metadata:", metadata);
    process.exit(0);
  } catch (err) {
    console.error("Update failed:", err);
    process.exit(1);
  }
}

run();
