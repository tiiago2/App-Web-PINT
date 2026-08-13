const db = require('./models');

async function test() {
  try {
    const utilizadores = await db.Utilizador.findAll({ raw: true });
    console.log('UTILIZADORES:', utilizadores.map(u => ({ id: u.id_utilizador, nome: u.nome_user, email: u.email })));
    
    const consultores = await db.Consultor.findAll({ raw: true });
    console.log('CONSOLES/CONSULTORES:', consultores.map(c => ({ id: c.id_utilizador, nome: c.nome_user, ativo: c.ativo })));
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    process.exit(0);
  }
}
test();
