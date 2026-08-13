const db = require('./models');
const { calcularRanking } = require('./helpers/rankingHelper');

async function test() {
  try {
    const ranking = await calcularRanking();
    console.log('RANKING COUNT:', ranking.length);
    console.log('RANKING USERS:', ranking.map(u => ({ id: u.id, nome: u.nome })));
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    process.exit(0);
  }
}
test();
