const { PoliticasRgpd, Utilizador, Consultor } = require('../models');

module.exports = {
  async getRGPDDetails(req, res) {
    try {
      // 1. Procurar o registo estático de ID = 1 e incluir o criador/editor
      const policy = await PoliticasRgpd.findOne({
        where: { id_politica: 1 },
        include: [{
          model: Utilizador,
          attributes: ['nome_user']
        }]
      });

      // 2. Calcular estatísticas de adesão (apenas consultores ativos)
      const activeConsultores = await Utilizador.findAll({
        where: { ativo: true },
        include: [{
          model: Consultor,
          required: true // Garante que apenas traz utilizadores que existem na tabela Consultor
        }]
      });

      let aceites = 0;
      let pendentes = 0;

      activeConsultores.forEach(user => {
        if (user.aceitacao_politicas) {
          aceites++;
        } else {
          pendentes++;
        }
      });

      const total = activeConsultores.length;
      const taxaAdesao = total > 0 ? Math.round((aceites / total) * 100) : 0;

      return res.status(200).json({
        textoConsentimento: policy ? policy.descricao_rgpd : "",
        dataAlteracao: policy ? policy.data_alteracao : new Date(),
        nomeAutor: policy && policy.Utilizador ? policy.Utilizador.nome_user : "Sistema",
        estatisticas: {
          aceites,
          pendentes,
          taxaAdesao
        }
      });
    } catch (error) {
      console.error("Erro ao obter detalhes de RGPD:", error);
      return res.status(500).json({ error: "Erro no servidor ao obter detalhes de RGPD." });
    }
  },

  async updateRGPDText(req, res) {
    try {
      const { textoConsentimento } = req.body;
      const idUtilizadorLogado = req.utilizadorLogado.id_utilizador;

      if (!textoConsentimento) {
        return res.status(400).json({ error: "Texto de consentimento não fornecido." });
      }

      // 1. Atualizar o registo estático ID = 1 na tabela politicas_rgpd
      const [updatedRows] = await PoliticasRgpd.update({
        descricao_rgpd: textoConsentimento,
        id_utilizador: idUtilizadorLogado,
        data_alteracao: new Date()
      }, {
        where: { id_politica: 1 }
      });

      // Se por algum motivo o registo 1 não existir, criamo-lo
      if (updatedRows === 0) {
        await PoliticasRgpd.create({
          id_politica: 1,
          descricao_rgpd: textoConsentimento,
          id_utilizador: idUtilizadorLogado,
          data_alteracao: new Date()
        });
      }

      // 2. Repor aceitação de políticas de todos os utilizadores ativos para false (Opção A)
      // (Será feito pelo trigger na BD no futuro, mas mantemos no código por segurança imediata)
      const agora = new Date();
      await Utilizador.update(
        { aceitacao_politicas: false, update_user: agora },
        { where: { ativo: true } }
      );

      return res.status(200).json({ message: "Políticas RGPD atualizadas com sucesso." });
    } catch (error) {
      console.error("Erro ao atualizar políticas de RGPD:", error);
      return res.status(500).json({ error: "Erro no servidor ao atualizar políticas de RGPD." });
    }
  }
};
