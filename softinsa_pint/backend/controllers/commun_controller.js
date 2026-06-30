const {
  Utilizador,
  Consultor,
  Area
} = require("../models");

module.exports = {
    async getRanking(req, res){
        try {
            const ranking = await Consultor.findAll({
                attributes: ['pontos_totais'], 
                order: [
                    ['pontos_totais', 'DESC'] 
                ],
                include: [
                    {
                        model: Utilizador,
                        attributes: ['nome_user', 'imagem_perfil'] 
                    },
                    {
                        model: Area,
                        attributes: ['nome_area'] 
                    }
                ]
            });
            const rankingLimpo = ranking.map(registo => ({
                nome: registo.Utilizador.nome_user,
                imagem: registo.Utilizador.imagem_prefil,
                area: registo.Area.nome_area,
                pontos: registo.pontos_totais
            }));
            return res.status(200).json({
                ranking: rankingLimpo
            });

        } catch (error) {
            console.error("Erro ao procurar ranking:", error);
            return res.status(500).json({ error: "Ocorreu um erro ao obter o ranking." });
        }
    }
}