const { Utilizador, Role } = require('../models');
const jwt = require('jsonwebtoken');

module.exports = {
    // auth_controller.js (No Backend)
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // 1. Procura o user, junta as Roles (para o ecrã do React)
            const user = await Utilizador.findOne({ 
                where: { email: email },
                include: [{ model: Role, attributes: ['nome_role', 'icone_role'], through: { attributes: [] } }]
            });

            // 2. Verifica a password (idealmente com bcrypt)
            if (!user || user.password !== password) {
                return res.status(401).json({ error: "Email ou password incorretos!" });
            }

            // 3. Fabrica o Token
            const token = jwt.sign({ id_utilizador: user.id_utilizador }, process.env.JWT_SECRET, { expiresIn: '8h' });

            const listaRoles = user.Roles.map(role => role.nome_role.toLowerCase());

            return res.status(200).json({
                token: token,
                utilizador: {
                    nome: user.nome_user,
                    id: user.id_utilizador,
                    roles: listaRoles
                }
            });
        } catch (error) {
            return res.status(500).json({ error: "Erro no servidor." });
        }
    },
    async getUser(req, res) {
        try {
            const { id } = req.body;

            const user = await Utilizador.findOne({ 
                where: { id_utilizador: id },
                atributes: ['nome_user', 'imagem_perfil', 'last_login']
            });
            if(!user){
                return res.status(404).json({ error: "utilizador não encontrado." });
            }
            return res.status(200).json({
                nome: user.nome_user, 
                foto: user.imagem_perfil,
                ultimoLogin: user.last_login,
            });
        } catch (error) {
            return res.status(500).json({ error: "Erro no servidor, get_user." });
        }
    }
}