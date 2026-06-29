const {
  Utilizador,
  Badges,
  Area,
  Submissoes,
  RegistoBadges,
  Historico
} = require("../models");
const { Op } = require("sequelize");

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
                        attributes: ['id_utilizador', 'nome_user', 'imagem_perfil'] 
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
    }
};
