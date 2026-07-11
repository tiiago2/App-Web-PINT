const { Utilizador } = require('../models');
const bcrypt = require('bcrypt');

async function run() {
  try {
    const saltRounds = 10;
    const newPassword = await bcrypt.hash("123456", saltRounds);

    const emails = ['admin@softinsa.pt', 'consultor@softinsa.pt', 'lider@softinsa.pt', 'tm@softinsa.pt'];
    for (const email of emails) {
      const user = await Utilizador.findOne({ where: { email } });
      if (user) {
        user.password = newPassword;
        await user.save();
        console.log(`Password reset successfully for ${email}`);
      } else {
        console.log(`User not found: ${email}`);
      }
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

run();
