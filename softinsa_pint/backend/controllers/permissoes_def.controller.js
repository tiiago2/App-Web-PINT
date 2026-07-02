const { Permissoes } = require('../models');

module.exports = {
  async getPermissoesDefs(req, res) {
    try {
      const perms = await Permissoes.findAll({
        where: {
          id_permissao: [1, 2, 3, 4, 5, 6, 7]
        },
        order: [['id_permissao', 'ASC']]
      });
      return res.status(200).json(perms);
    } catch (error) {
      console.error("Erro ao obter definições de permissões:", error);
      return res.status(500).json({ error: "Erro no servidor ao obter permissões." });
    }
  },

  async updatePermissoesDefs(req, res) {
    try {
      const { alteracoes } = req.body; // Array no formato [{ id_permissao, toggle }]

      if (!alteracoes || !Array.isArray(alteracoes)) {
        return res.status(400).json({ error: "Alterações inválidas ou não fornecidas." });
      }

      // Atualiza de forma eficiente apenas as permissões que sofreram alterações
      for (const item of alteracoes) {
        await Permissoes.update(
          { toggle: item.toggle },
          { where: { id_permissao: item.id_permissao } }
        );
      }

      return res.status(200).json({ message: "Permissões atualizadas com sucesso." });
    } catch (error) {
      console.error("Erro ao atualizar definições de permissões:", error);
      return res.status(500).json({ error: "Erro no servidor ao atualizar permissões." });
    }
  }
};
