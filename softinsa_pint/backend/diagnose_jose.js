const db = require('./models');
const { QueryTypes } = require('sequelize');
const bcrypt = require('bcrypt');

async function run() {
  try {
    console.log("--- PASSO 1: SQL DIRECT INQUIRY ---");
    const sqlQuery = `
      SELECT 
        id_utilizador, 
        email, 
        nome_user,
        ativo, 
        password, 
        LENGTH(password) AS tamanho_hash_password 
      FROM utilizador 
      WHERE LOWER(email) LIKE '%jose%' OR LOWER(nome_user) LIKE '%jose%';
    `;
    
    const results = await db.sequelize.query(sqlQuery, { type: QueryTypes.SELECT });
    console.log("Results from DB:", JSON.stringify(results, null, 2));

    if (results.length > 0) {
      console.log("\n--- PASSO 3: BCRYPT TEST ---");
      for (const row of results) {
        const passEnviada = '123';
        const hashDaBD = row.password;
        if (hashDaBD) {
          const match = await bcrypt.compare(passEnviada, hashDaBD);
          console.log(`Email: "${row.email}" | Hash: "${hashDaBD}" | Length: ${row.tamanho_hash_password} | Match with "123": ${match}`);
        } else {
          console.log(`Email: "${row.email}" has no password defined.`);
        }
      }
    } else {
      console.log("No users found containing 'jose' in email or name.");
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Error during diagnosis:", err);
    process.exit(1);
  }
}

run();
