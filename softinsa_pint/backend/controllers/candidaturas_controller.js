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
  Logs,
  Permissoes,
  Recetor
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
      let whereClause = {
        status: { [Op.in]: ['pendente', 'aceite talent', 'aceite', 'recusada'] }
      };

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

      const submissao = await Submissoes.findByPk(id);
      if (!submissao) {
        return res.status(404).json({ error: "Candidatura não encontrada." });
      }

      // Impedir alterações em candidaturas que já foram finalizadas
      if (submissao.status === 'aceite' || submissao.status === 'recusada') {
        return res.status(400).json({ error: "Esta candidatura já foi finalizada." });
      }

      // Buscar as permissões ativas associadas às roles do utilizador
      const rolesParaVerificar = roleAtiva ? [roleAtiva] : roles;
      const rolesComPermissoes = await Role.findAll({
        where: {
          nome_role: { [Op.or]: rolesParaVerificar.map(r => ({ [Op.iLike]: r })) }
        },
        include: [{
          model: Permissoes,
          where: { toggle: true }, // apenas permissões ativas (toggle = true)
          through: { attributes: [] }
        }]
      });

      const permissoesAtivas = [];
      for (const r of rolesComPermissoes) {
        if (r.Permissoes) {
          for (const p of r.Permissoes) {
            if (!permissoesAtivas.includes(p.id_permissao)) {
              permissoesAtivas.push(p.id_permissao);
            }
          }
        }
      }

      let dbStatus = '';
      if (status === 'Aceite') {
        if (isTalent && !isAdmin) {
          // Talent Manager faz validação inicial (precisa de id_permissao: 4 -> "Validar Evidências")
          if (!permissoesAtivas.includes(4)) {
            return res.status(403).json({ error: "Não tens permissões para validar evidências (Validação Inicial)." });
          }
          dbStatus = 'aceite talent';
        } else {
          // Admin ou SLL faz validação final (precisa de id_permissao: 6 -> "Validação Final")
          if (!permissoesAtivas.includes(6)) {
            return res.status(403).json({ error: "Não tens permissões para realizar a Validação Final desta candidatura." });
          }
          dbStatus = 'aceite';
        }
      } else if (status === 'Recusada') {
        dbStatus = 'recusada';
        // Se a candidatura já foi pré-aceite pelo TM ('aceite talent'), apenas quem tem permissão de Validação Final (6) pode recusar
        if (submissao.status === 'aceite talent') {
          if (!permissoesAtivas.includes(6)) {
            return res.status(403).json({ error: "Apenas utilizadores com permissão de Validação Final podem recusar esta candidatura." });
          }
        } else {
          // Se está pendente, quem tem permissão 4 (Validar Evidências) ou 6 (Validação Final) pode recusar
          if (!permissoesAtivas.includes(4) && !permissoesAtivas.includes(6)) {
            return res.status(403).json({ error: "Não tens permissões para rejeitar esta candidatura." });
          }
        }
      }

      submissao.status = dbStatus;
      if (isTalent && !isAdmin) {
        submissao.notificacao_sla = false;
      } else {
        submissao.notificacao_sla = true;
      }
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
      let deveEnviarNotif = false;
      if (status === 'Recusada') {
        msgNotif = `O teu pedido de badge '${nomeBadge}' foi recusado. Motivo: ${motivo || 'Nenhum'}`;
        deveEnviarNotif = true;
      } else {
        if (isTalent && !isAdmin) {
          // Talent Manager aceitou (validação inicial) -> não envia notificação de imediato
          deveEnviarNotif = false;
        } else {
          // Service Line Leader ou Admin aceitou -> envia notificação
          msgNotif = `Parabéns! O teu pedido de badge '${nomeBadge}' foi totalmente aceite.`;
          deveEnviarNotif = true;
        }
      }

      if (deveEnviarNotif) {
        const notificacao = await Notificacoes.create({
          id_utilizador: submissao.id_utilizador, // ID do destinatário (consultor)
          descricao_notificacao: msgNotif,
          data_envio: new Date(),
          tipo_notificacao: 'AVALIACAO_STATUS'
        });

        await Recetor.create({
          id_notificacao: notificacao.id_notificacao,
          id_utilizador: submissao.id_utilizador,
          lida: false
        });
      }

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
