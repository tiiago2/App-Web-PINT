const { Utilizador, Role } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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
            if (!user) {
                return res.status(401).json({ error: "Email ou password incorretos!" });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: "Email ou password incorretos!" });
            }

            // 3. Fabrica o Token
            const token = jwt.sign({ id_utilizador: user.id_utilizador }, process.env.JWT_SECRET, { expiresIn: '8h' });

            const listaRoles = user.Roles.map(role => ({
                nome: role.nome_role,
                icone_role: role.icone_role || 'fi-br-user'
            }));

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
    async esqueciPassword(req, res) {
        try {
            const { email, password, confirmPassword } = req.body;

            if (!email || !password || !confirmPassword) {
                return res.status(400).json({ error: "Todos os campos são obrigatórios." });
            }

            const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#^~_\-+=])[A-Za-z\d@$!%*?&.#^~_\-+=]{8,}$/;
            if (!regexPassword.test(password)) {
                return res.status(400).json({ error: "A palavra-passe não cumpre os requisitos mínimos." });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({ error: "As palavras-passe não coincidem." });
            }

            const user = await Utilizador.findOne({ where: { email: email } });
            if (!user) {
                return res.status(404).json({ error: "Email não encontrado." });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            await user.update({
                password: hashedPassword,
                update_user: new Date()
            });

            return res.status(200).json({ message: "Palavra-passe alterada com sucesso." });
        } catch (error) {
            console.error("Erro ao recuperar password:", error);
            return res.status(500).json({ error: "Erro no servidor." });
        }
    },

    async getUser(req, res) {
        try {
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ error: "ID não fornecido no pedido." });
            }

            const user = await Utilizador.findOne({
                where: { id_utilizador: id },
                attributes: ['nome_user', 'imagem_perfil', 'last_login']
            });
            if (!user) {
                return res.status(404).json({ error: "utilizador não encontrado." });
            }
            return res.status(200).json({
                nome: user.nome_user,
                foto: user.imagem_perfil,
                ultimoLogin: user.last_login,
            });
        } catch (error) {
            console.error("Erro no get_user:", error);
            return res.status(500).json({ error: "Erro no servidor, get_user." });
        }
    }
}