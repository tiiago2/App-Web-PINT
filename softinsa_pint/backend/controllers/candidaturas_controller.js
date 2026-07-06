const {
  Utilizador,
  Role,
  Submissoes,
  Badges,
  Area,
  ServiceLine,
  Requisitos,
  Historico,
  Notificacoes,
  Objetivos,
  RegistoBadges,
  Logs
} = require("../models");
const { Op } = require("sequelize");

module.exports = {
  // GET /api/candidaturas
  async getCandidaturas(req, res) {
    try {
      const id_utilizador = req.utilizadorLogado.id_utilizador;

      // 1. Obter as roles do utilizador na base de dados
      const userWithRoles = await Utilizador.findByPk(id_utilizador, {
        include: [{ model: Role, through: { attributes: [] } }]
      });

      const roles = userWithRoles ? userWithRoles.Roles.map(r => r.nome_role ? r.nome_role.toLowerCase() : "") : [];

      // Ler a role ativa enviada pelo frontend no cabeçalho x-user-role
      const activeRoleHeader = req.headers['x-user-role'] ? req.headers['x-user-role'].toLowerCase() : null;

      // Segurança: verificar se a role enviada no header pertence ao utilizador
      const roleAtiva = (activeRoleHeader && roles.includes(activeRoleHeader))
        ? activeRoleHeader
        : null;

      const isAdmin = roleAtiva
        ? (roleAtiva === 'admin' || roleAtiva === 'administrador')
        : (roles.includes('admin') || roles.includes('administrador'));

      const isTalent = roleAtiva
        ? (roleAtiva === 'talent' || roleAtiva === 'talent manager')
        : (roles.includes('talent') || roles.includes('talent manager'));

      const isServiceLeader = roleAtiva
        ? (roleAtiva === 'service' || roleAtiva === 'service line leader')
        : (roles.includes('service') || roles.includes('service line leader'));

      const isConsultor = roleAtiva
        ? (roleAtiva === 'consultor')
        : (roles.includes('consultor'));

      // Cláusula where principal de submissões
      let whereClause = {};

      // Se for Service Line Leader e não for Admin/Talent:
      if (isServiceLeader && !isAdmin && !isTalent) {
        const serviceLine = await ServiceLine.findOne({
          where: { id_lider: id_utilizador, deleted_service: false }
        });

        if (!serviceLine) {
          // Se for SLL mas não tiver nenhuma Service Line associada, retorna vazio
          return res.status(200).json([]);
        }

        // Buscar as áreas pertencentes a esta Service Line
        const areas = await Area.findAll({
          where: { id_service_line: serviceLine.id_service_line, deleted_area: false }
        });
        const areaIds = areas.map(a => a.id_area);

        // Buscar os badges correspondentes
        const badges = await Badges.findAll({
          where: { id_area: areaIds, deleted_badge: false }
        });
        const badgeIds = badges.map(b => b.id_badge);

        // Filtrar submissões que pertençam a estes badges e que tenham estado 'aceite talent', 'aceite' ou 'recusada'
        whereClause.id_badge = { [Op.in]: badgeIds };
        whereClause.status = { [Op.in]: ['aceite talent', 'aceite', 'recusada'] };
      } else if (isConsultor && !isAdmin && !isTalent) {
        // Consultor só vê as suas candidaturas
        whereClause.id_utilizador = id_utilizador;
      }

      // 2. Definir os relacionamentos para a query
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
        },
        {
          model: Historico,
          include: [
            {
              model: Utilizador,
              attributes: ['id_utilizador', 'nome_user', 'imagem_perfil']
            }
          ]
        }
      ];

      const submissoes = await Submissoes.findAll({
        where: whereClause,
        include: includeOption,
        order: [['data_submissao', 'DESC']]
      });

      // 3. Normalizar dados para o formato esperado pelo frontend
      const formatadas = submissoes.map(sub => {
        let mappedStatus = 'Pendente';
        const dbStatus = sub.status ? sub.status.toLowerCase() : 'pendente';

        if (isServiceLeader && !isAdmin && !isTalent) {
          // Para o Service Line Leader: 'aceite talent' é visto como Pendente (para ele aprovar)
          if (dbStatus === 'aceite talent') mappedStatus = 'Pendente';
          else if (dbStatus === 'aceite') mappedStatus = 'Aceite';
          else if (dbStatus === 'recusada' || dbStatus === 'rejeitada') mappedStatus = 'Recusada';
          else mappedStatus = 'Pendente';
        } else if (isTalent && !isAdmin) {
          // Para o Talent Manager: 'pendente' é Pendente. 'aceite talent' (que ele já aceitou) é visto como Aceite
          if (dbStatus === 'pendente') mappedStatus = 'Pendente';
          else if (dbStatus === 'aceite talent' || dbStatus === 'aceite') mappedStatus = 'Aceite';
          else if (dbStatus === 'recusada' || dbStatus === 'rejeitada') mappedStatus = 'Recusada';
        } else if (isAdmin) {
          // Para o Admin: vê 'pendente' como Pendente, e 'aceite'/'aceite talent' como Aceite
          if (dbStatus === 'pendente') mappedStatus = 'Pendente';
          else if (dbStatus === 'aceite talent' || dbStatus === 'aceite') mappedStatus = 'Aceite';
          else if (dbStatus === 'recusada' || dbStatus === 'rejeitada') mappedStatus = 'Recusada';
        } else {
          // Para Consultor ou outros: 'pendente' e 'aceite talent' aparecem como Pendente
          if (dbStatus === 'pendente' || dbStatus === 'aceite talent') mappedStatus = 'Pendente';
          else if (dbStatus === 'aceite') mappedStatus = 'Aceite';
          else if (dbStatus === 'recusada' || dbStatus === 'rejeitada') mappedStatus = 'Recusada';
        }

        const requisitos = sub.Badge?.Requisitos
          ? sub.Badge.Requisitos.map(r => r.descricao_requisito || r.nome_requisito)
          : [];

        const historicos = sub.Historicos
          ? sub.Historicos.map(h => ({
              idUtilizador: h.id_utilizador,
              avaliador: h.Utilizador?.nome_user || 'Avaliador',
              aceite: h.aceite,
              feedback: h.feedback,
              dataAvaliacao: h.data_avaliacao
            }))
          : [];

        return {
          id: sub.id_submissao,
          userId: sub.id_utilizador,
          badgeId: sub.id_badge,
          submetido: sub.data_submissao,
          status: mappedStatus,
          dbStatus: dbStatus, // Raw state from database
          progresso: dbStatus === 'aceite' ? 100 : 80,
          requisitos: requisitos,
          historico: historicos,
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
      const { status, motivo } = req.body; // 'Aceite' ou 'Recusada' e o motivo/feedback

      if (!['Aceite', 'Recusada'].includes(status)) {
        return res.status(400).json({ error: "Estado inválido." });
      }

      const id_utilizador = req.utilizadorLogado.id_utilizador;
      
      // Obter as roles do utilizador na base de dados
      const userWithRoles = await Utilizador.findByPk(id_utilizador, {
        include: [{ model: Role, through: { attributes: [] } }]
      });
      const roles = userWithRoles ? userWithRoles.Roles.map(r => r.nome_role ? r.nome_role.toLowerCase() : "") : [];

      // Ler a role ativa enviada pelo frontend
      const activeRoleHeader = req.headers['x-user-role'] ? req.headers['x-user-role'].toLowerCase() : null;
      const roleAtiva = (activeRoleHeader && roles.includes(activeRoleHeader))
        ? activeRoleHeader
        : null;

      const isAdmin = roleAtiva
        ? (roleAtiva === 'admin' || roleAtiva === 'administrador')
        : (roles.includes('admin') || roles.includes('administrador'));

      const isTalent = roleAtiva
        ? (roleAtiva === 'talent' || roleAtiva === 'talent manager')
        : (roles.includes('talent') || roles.includes('talent manager'));

      let dbStatus = '';
      if (status === 'Recusada') {
        dbStatus = 'recusada';
      } else if (status === 'Aceite') {
        // Se for Talent Manager (e não Admin), passa a 'aceite talent'. Se for Admin ou SLL, passa a 'aceite'
        if (isTalent && !isAdmin) {
          dbStatus = 'aceite talent';
        } else {
          dbStatus = 'aceite';
        }
      }

      const submissao = await Submissoes.findByPk(id);
      if (!submissao) {
        return res.status(404).json({ error: "Candidatura não encontrada." });
      }

      submissao.status = dbStatus;
      await submissao.save();

      // 1. Atualizar ou Criar registo na tabela de Historico de Avaliações
      const aceiteBool = status === 'Aceite';
      const [hist, created] = await Historico.findOrCreate({
        where: { id_utilizador: id_utilizador, id_submissao: submissao.id_submissao },
        defaults: {
          aceite: aceiteBool,
          feedback: motivo || '',
          data_avaliacao: new Date()
        }
      });

      if (!created) {
        hist.aceite = aceiteBool;
        hist.feedback = motivo || '';
        hist.data_avaliacao = new Date();
        await hist.save();
      }

      // 2. Enviar notificação ao consultor/candidato
      const badgeObj = await Badges.findByPk(submissao.id_badge);
      const nomeBadge = badgeObj ? badgeObj.nome_badge : 'Badge';

      let msgNotif = '';
      if (status === 'Recusada') {
        msgNotif = `O teu pedido de badge '${nomeBadge}' foi recusado. Motivo: ${motivo || 'Nenhum'}`;
      } else {
        if (isTalent && !isAdmin) {
          msgNotif = `O teu pedido de badge '${nomeBadge}' foi pré-aceite pelo Talent Manager e aguarda validação do Líder.`;
        } else {
          msgNotif = `Parabéns! O teu pedido de badge '${nomeBadge}' foi totalmente aceite.`;
        }
      }

      await Notificacoes.create({
        id_utilizador: submissao.id_utilizador, // ID do destinatário (consultor)
        descricao_notificacao: msgNotif,
        data_envio: new Date(),
        tipo_notificacao: 'AVALIACAO_STATUS'
      });

      // 3. Verificar e concluir objetivos relacionados com este badge
      if (dbStatus === 'aceite') {
        const objetivosRelacionados = await Objetivos.findAll({
          where: {
            id_utilizador: submissao.id_utilizador,
            id_badge: submissao.id_badge,
            deleted_objetivo: false,
            data_conclusao: null
          }
        });

        for (const obj of objetivosRelacionados) {
          obj.data_conclusao = new Date();
          obj.notificacao_fim = false;
          await obj.save();
        }

        // 4. Criar registo do badge atribuído e log de atividade
        try {
          const novoRegisto = await RegistoBadges.create({
            id_badge: submissao.id_badge,
            id_utilizador: submissao.id_utilizador,
            data_obtencao: new Date()
          });

          await Logs.create({
            tabela: 'registo_badges',
            tipo: 1,
            id_alvo: novoRegisto.id_registo,
            data_log: new Date()
          });
        } catch (erroRegisto) {
          console.error('Erro ao criar registo de badge/log de atividade:', erroRegisto);
          // Não falhar a operação principal se o log falhar
        }
      }

      return res.status(200).json({ message: "Estado, histórico e objetivos atualizados com sucesso.", submissao });
    } catch (error) {
      console.error("Erro ao atualizar candidatura:", error);
      return res.status(500).json({ error: "Erro ao atualizar candidatura." });
    }
  }
};
