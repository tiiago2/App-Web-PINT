const {
  Utilizador,
  Consultor,
  Badges,
  Area,
  Submissoes,
  RegistoBadges,
  Historico
} = require("../models");
const registo_badges = require("../models/registo_badges");
const { Op } = require('sequelize');

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
    async getDados4Month(req, res) {
    try {
        // 1. Calcular a data limite (Dia 1 do mês, há 4 meses atrás)
        const dataLimite = new Date();
        dataLimite.setMonth(dataLimite.getMonth() - 4);
        dataLimite.setDate(1);
        dataLimite.setHours(0, 0, 0, 0);

        // 2. Buscar os dados à BD com o filtro de datas ativo
        const dadosBrutos = await RegistoBadges.findAll({
            where: {
                // O PostgreSQL precisa do nome real da coluna na base de dados
                data_obtencao: { 
                    [Op.gte]: dataLimite
                }
            },
            include: [
                { model: Utilizador, attributes: ['id_utilizador'] },
                // 🚨 Associação corrigida para Badges
                { model: Badges, attributes: ['pontos_badge'] } 
            ]
        });

        const registos = JSON.parse(JSON.stringify(dadosBrutos));

        const nomesMeses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        const agrupado = {};

        registos.forEach(registo => {
            const dataReal = registo.data_submissao || registo.data_obtencao;
            
            if (!dataReal) return; 

            const data = new Date(dataReal);
            const mesIndex = data.getMonth();
            const ano = data.getFullYear();
            const periodo = nomesMeses[mesIndex];
            const chave = ano * 100 + mesIndex; 

            if (!agrupado[chave]) {
                agrupado[chave] = {
                    periodo: periodo,
                    pontos: 0,
                    atribuicoes: 0,
                    utilizadores: new Set(), 
                    chaveOrdenacao: chave
                };
            }

            agrupado[chave].pontos += registo.Badge?.pontos_badge || 0;
            agrupado[chave].atribuicoes += 1;
            
            if (registo.Utilizador?.id_utilizador) {
                agrupado[chave].utilizadores.add(registo.Utilizador.id_utilizador);
            }
        });

        // 4. Formatação final para o array perfeito
        const dados_linhas = Object.values(agrupado)
            .sort((a, b) => a.chaveOrdenacao - b.chaveOrdenacao) // Ordenar do mais antigo para o mais recente
            .map(mes => {
                const totalUtilizadoresAtivos = mes.utilizadores.size;
                const media = totalUtilizadoresAtivos > 0 ? (mes.atribuicoes / totalUtilizadoresAtivos) : 0;

                return {
                    periodo: mes.periodo,
                    media_badges: parseFloat(media.toFixed(1)),
                    pontos: mes.pontos,
                    atribuicoes: mes.atribuicoes
                };
            });

        // 5. Retornar ao Frontend/Postman
        return res.status(200).json(dados_linhas);

    } catch (error) {
        console.error("Erro ao gerar gráfico de linhas:", error);
        return res.status(500).json({ error: "Ocorreu um erro ao processar os dados do gráfico." });
    }
}
};
