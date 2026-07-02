const { Utilizador } = require('../models');
const bcrypt = require('bcrypt');

async function converterPasswords() {
    try {
        console.log("A iniciar conversão de passwords...");
        
        const utilizadores = await Utilizador.findAll();
        let contagem = 0;

        for (const user of utilizadores) {
            // Verifica se a password já não está encriptada
            // Os hashes do bcrypt começam tipicamente por "$2b$" ou "$2a$"
            if (user.password && !user.password.startsWith('$2')) {
                const saltRounds = 10;
                const passwordEncriptada = await bcrypt.hash(user.password, saltRounds);
                
                user.password = passwordEncriptada;
                await user.save();
                
                contagem++;
                console.log(`✅ Password do utilizador ${user.email} atualizada.`);
            } else {
                console.log(`⏩ Utilizador ${user.email} ignorado (já encriptado ou sem password).`);
            }
        }

        console.log(`\nConversão terminada! ${contagem} passwords foram encriptadas com sucesso.`);
        process.exit(0);
    } catch (error) {
        console.error("Erro durante a conversão:", error);
        process.exit(1);
    }
}

converterPasswords();
