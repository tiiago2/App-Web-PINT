const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. Ir buscar o token ao cabeçalho (Header) do pedido ou query string
    const authHeader = req.headers.authorization;
    let token = req.query.token;

    if (authHeader) {
        token = authHeader.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: "Acesso negado. Token não fornecido." });
    }

    try {
        // 2. Verificar se a pulseira é verdadeira e está na validade
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Guardar os dados do utilizador no "req" para a rota poder usar
        req.utilizadorLogado = decodificado;
        
        // 4. Deixar passar para a rota!
        return next();
    } catch (error) {
        return res.status(401).json({ error: "Token inválido ou expirado." });
    }
};