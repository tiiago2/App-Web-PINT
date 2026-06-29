const {
  Utilizador,
  Consultor,
  Badges,
  Area,
  Submissoes,
  RegistoBadges,
  Historico
} = require("../models");

module.exports = {
    async getCandidaturas(req, res) {
       try {
            const candidaturas = await Submissoes.findAll({
                where: {
                    status: 'pendente'
                },
                attributes: ['data_submissao'],
                include: [
                    {
                        model: Utilizador,
                        attributes: ['id_utilizador', 'nome_user', 'imagem_perfil'] ,
                        where:{
                            ativo: true
                        }
                    },
                    {
                        model: Badges,
                        attributes: ['nome_badge', 'imagem', 'pontos_badge'],
                        include: [
                            {
                                model: Area,
                                attributes: ['nome_area']
                            }
                        ]
                    },
                ]
            });
            return res.status(200).json(candidaturas);
        } catch(error) {
            console.error("Erro ao buscar candidaturas:", error);
            return res.status(500).json({ 
                error: "Ocorreu um erro ao procurar as candidaturas pendentes." 
            });
        }
    },
    async getCandidaturasSemana(req, res){
        try{
            const dados_grafico = await Historico.findAll({
                
            })
        } catch(error) {
            console.error("Erro ao buscar candidaturas:", error);
            return res.status(500).json({ 
                error: "Ocorreu um erro ao procurar as candidaturas realizadas esta semana." 
            });
        }
    },
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
};
