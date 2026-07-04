const {
  Utilizador,
  Role,
  Submissoes,
  Badges,
  Area,
  ServiceLine,
  Requisitos
} = require("../models");

module.exports = {
  // GET /api/candidaturas
  async getCandidaturas(req, res) {
    try {
      const id_utilizador = req.utilizadorLogado.id_utilizador;

      // 1. Obter as roles do utilizador
      const userWithRoles = await Utilizador.findByPk(id_utilizador, {
        include: [{ model: Role, through: { attributes: [] } }]
      });

      const roles = userWithRoles ? userWithRoles.Roles.map(r => r.nome_role.toLowerCase()) : [];

      const isAdmin = roles.includes('admin') || roles.includes('administrador');
      const isTalent = roles.includes('talent') || roles.includes('talent manager');
      const isServiceLeader = roles.includes('service') || roles.includes('service line leader');
      const isConsultor = roles.includes('consultor');

      let serviceLine = null;
      if (isServiceLeader && !isAdmin && !isTalent) {
        serviceLine = await ServiceLine.findOne({
          where: { id_lider: id_utilizador, deleted_service: false }
        });
      }

      // 2. Definir filtros e relacionamentos
      const includeOption = [
        {
          model: Utilizador,
          attributes: ['id_utilizador', 'nome_user', 'imagem_perfil']
        },
        {
          model: Badges,
          attributes: ['id_badge', 'nome_badge', 'pontos_badge', 'descricao_badge', 'imagem'],
          include: [
            {
              model: Area,
              required: !!(isServiceLeader && !isAdmin && !isTalent && serviceLine),
              where: (isServiceLeader && !isAdmin && !isTalent && serviceLine) ? { id_service_line: serviceLine.id_service_line } : {},
              include: [
                {
                  model: ServiceLine,
                  attributes: ['id_service_line', 'nome_service_line', 'id_lider']
                }
              ]
            },
            {
              model: Requisitos,
              attributes: ['id_requisito', 'nome_requisito', 'descricao_requisito'],
              through: { attributes: [] }
            }
          ]
        }
      ];

      // Se for Service Line Leader e não tiver nenhuma Service Line associada, retorna vazio
      if (isServiceLeader && !isAdmin && !isTalent && !serviceLine) {
        return res.status(200).json([]);
      }

      // Cláusula where principal de submissões
      let whereClause = {};
      if (isConsultor && !isAdmin && !isTalent && !isServiceLeader) {
        whereClause.id_utilizador = id_utilizador;
      }

      const submissoes = await Submissoes.findAll({
        where: whereClause,
        include: includeOption,
        order: [['data_submissao', 'DESC']]
      });

      // 3. Normalizar dados para o formato esperado pelo frontend
      const formatadas = submissoes.map(sub => {
        let mappedStatus = 'Pendente';
        if (sub.status === 'Aceite') mappedStatus = 'Aceite';
        if (sub.status === 'Rejeitada') mappedStatus = 'Recusada';

        const requisitos = sub.Badge?.Requisitos
          ? sub.Badge.Requisitos.map(r => r.descricao_requisito || r.nome_requisito)
          : [];

        return {
          id: sub.id_submissao,
          userId: sub.id_utilizador,
          badgeId: sub.id_badge,
          submetido: sub.data_submissao,
          status: mappedStatus,
          progresso: sub.status === 'Aceite' ? 100 : 80,
          requisitos: requisitos,
          user: {
            id: sub.Utilizador?.id_utilizador || sub.id_utilizador,
            nome: sub.Utilizador?.nome_user || 'Utilizador',
            area: sub.Badge?.Area?.nome_area || '-',
            serviceLine: sub.Badge?.Area?.ServiceLine?.nome_service_line || '-'
          },
          badge: {
            id: sub.Badge?.id_badge,
            titulo: sub.Badge?.nome_badge || 'Badge',
            pontos: sub.Badge?.pontos_badge || 0,
            descricao: sub.Badge?.descricao_badge || '',
            imagem: sub.Badge?.imagem || ''
          }
        };
      });

      return res.status(200).json(formatadas);
    } catch (error) {
      console.error("Erro ao procurar candidaturas:", error);
      return res.status(500).json({ error: "Erro ao carregar as candidaturas." });
    }
  },

  // PUT /api/candidaturas/:id/status
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'Aceite' ou 'Recusada'

      if (!['Aceite', 'Recusada'].includes(status)) {
        return res.status(400).json({ error: "Estado inválido." });
      }

      const dbStatus = status === 'Recusada' ? 'Rejeitada' : 'Aceite';

      const submissao = await Submissoes.findByPk(id);
      if (!submissao) {
        return res.status(404).json({ error: "Candidatura não encontrada." });
      }

      submissao.status = dbStatus;
      await submissao.save();

      return res.status(200).json({ message: "Estado atualizado com sucesso.", submissao });
    } catch (error) {
      console.error("Erro ao atualizar candidatura:", error);
      return res.status(500).json({ error: "Erro ao atualizar candidatura." });
    }
  }
};
