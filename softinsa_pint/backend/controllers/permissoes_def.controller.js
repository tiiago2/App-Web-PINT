const { Permissoes } = require('../models');
const { scheduleAllActiveConsultantsDataChanged } = require('../services/sync_push_service');

module.exports = {
  async getPermissoesDefs(req, res) {
    try {
      const perms = await Permissoes.findAll({
        attributes: ['id_permissao', 'descricao_permissao', 'toggle'],
        where: {
          id_permissao: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
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
      const agora = new Date();
      for (const item of alteracoes) {
        await Permissoes.update(
          { toggle: item.toggle, updated_permissao: agora },
          { where: { id_permissao: item.id_permissao } }
        );
      }

      if (alteracoes.some((item) => [1, 2, 3].includes(Number(item.id_permissao)))) {
        scheduleAllActiveConsultantsDataChanged({ entity: 'permissions' });
      }
      return res.status(200).json({ message: "Permissões atualizadas com sucesso." });
    } catch (error) {
      console.error("Erro ao atualizar definições de permissões:", error);
      return res.status(500).json({ error: "Erro no servidor ao atualizar permissões." });
    }
  }
};
