const {
  Utilizador,
  Consultor,
  Area,
  Historico
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
    },
    async getCandidaturasSemana(req, res){
        try{
            const userId = req.user?.id || req.params.id;

            if (!userId) {
                return res.status(400).json({ error: "ID do utilizador não fornecido ou não autorizado." });
            }

            const quantidadeAceites = await Historico.count({
                where: {
                    id_utilizador: userId,
                    aceite: true
                }
            });

            const quantidadeRejeitadas = await Historico.count({
                where: {
                    id_utilizador: userId,
                    aceite: false
                }
            });

            return res.status(200).json({
                aceites: quantidadeAceites,
                rejeitadas: quantidadeRejeitadas,
            });
        } catch(error) {
            console.error("Erro ao buscar candidaturas:", error);
            return res.status(500).json({ 
                error: "Ocorreu um erro ao procurar as candidaturas realizadas esta semana." 
            });
        }
    },
    async getEstatisticasMensais(req, res) {
        try {
            const estatisticasBrutas = await Historico.findAll({
                attributes: [
                    [Sequelize.fn('MONTH', Sequelize.col('Historico.createdAt')), 'mes'],
                    [Sequelize.fn('COUNT', Sequelize.col('Historico.id')), 'atribuicoes'],
                    [Sequelize.fn('SUM', Sequelize.col('Badge.pontos')), 'pontos'],
                    [Sequelize.literal('COUNT(Historico.id) / COUNT(DISTINCT Historico.id_utilizador)'), 'media_badges']
                ],
                include: [
                    {
                        model: Badge,
                        attributes: [],
                        required: true  
                    }
                ],
                group: [Sequelize.fn('MONTH', Sequelize.col('Historico.createdAt'))],
                order: [[Sequelize.fn('MONTH', Sequelize.col('Historico.createdAt')), 'ASC']],
                raw: true // Muito importante: devolve um array de objetos limpos!
            });
            const nomesMeses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

            const dados_linhas = estatisticasBrutas.map(linha => {
                return {
                    // Converte o número do mês (1 a 12) para a string do array (índice 0 a 11)
                    periodo: nomesMeses[linha.mes - 1], 
                    
                    // Garante que os números vêm no formato certo (ex: 2.1 em vez de "2.1000")
                    media_badges: parseFloat(Number(linha.media_badges).toFixed(1)),
                    pontos: Number(linha.pontos),
                    atribuicoes: Number(linha.atribuicoes)
                };
            });

            // Devolve o array exatamente como o teu gráfico precisa!
            return res.status(200).json(dados_linhas);

        } catch (error) {
            console.error("Erro ao gerar estatísticas mensais:", error);
            return res.status(500).json({ error: "Erro interno ao processar o gráfico." });
        }
    }
}