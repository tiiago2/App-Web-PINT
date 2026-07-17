const db = require('./models');

async function debug() {
  try {
    const submissoes = await db.Submissoes.unscoped().findAll({
      where: { id_badge: 24 }
    });
    console.log('Submissoes (unscoped) for badge 24:', JSON.stringify(submissoes, null, 2));

    const submissoesScoped = await db.Submissoes.findAll({
      where: { id_badge: 24 }
    });
    console.log('Submissoes (scoped) for badge 24:', JSON.stringify(submissoesScoped, null, 2));

    const registos = await db.RegistoBadges.unscoped().findAll({
      where: { id_badge: 24 }
    });
    console.log('RegistoBadges (unscoped) for badge 24:', JSON.stringify(registos, null, 2));

    const badge = await db.Badges.unscoped().findOne({
      where: { id_badge: 24 }
    });
    console.log('Badge 24 (unscoped):', JSON.stringify(badge, null, 2));

    const badgeScoped = await db.Badges.findOne({
      where: { id_badge: 24 }
    });
    console.log('Badge 24 (scoped):', JSON.stringify(badgeScoped, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

debug();
