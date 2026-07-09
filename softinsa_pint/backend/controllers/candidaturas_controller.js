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
  Recetor,
  Documentos
} = require("../models");
const { Op } = require("sequelize");
const { enviarEmail } = require('../helpers/emailHelper');
const { getRolesFromRequest } = require("../helpers/roleHelper");
const { getBadgeIdsForServiceLeader } = require("../helpers/serviceLineHelper");

const emailValido = (email) => typeof email === 'string' && email.length > 5 && email.includes('@');

module.exports = {
  // GET /api/candidaturas
  async getCandidaturas(req, res) {
    try {
      const { id_utilizador, isAdmin, isTalent, isServiceLeader, isConsultor } = await getRolesFromRequest(req);

      // Cláusula where principal de submissões
      let whereClause = {
        status: { [Op.in]: ['pendente', 'aceite talent', 'aceite', 'recusada'] }
      };

      // Se for Service Line Leader e não for Admin/Talent:
      if (isServiceLeader && !isAdmin && !isTalent) {
        const badgeIds = await getBadgeIdsForServiceLeader(id_utilizador);

        if (!badgeIds) {
          // Se for SLL mas não tiver nenhuma Service Line associada, retorna vazio
          return res.status(200).json([]);
        }

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
        },
        {
          model: Documentos,
          attributes: ['id_ficheiro', 'id_requisito', 'ficheiro'],
          where: { deleted_file: false },
          required: false
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

        const documentosDaSubmissao = sub.Documentos || [];

        const requisitos = sub.Badge?.Requisitos
          ? sub.Badge.Requisitos.map(r => {
              const docAssociado = documentosDaSubmissao.find(d => d.id_requisito === r.id_requisito);
              return {
                 id: r.id_requisito,
                 nome: r.nome_requisito,
                 descricao: r.descricao_requisito,
                 temAnexo: !!docAssociado,
                 documento: docAssociado ? { id_ficheiro: docAssociado.id_ficheiro, ficheiro: docAssociado.ficheiro } : null
              };
            })
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

      const { id_utilizador, roles, roleAtiva, isAdmin, isTalent } = await getRolesFromRequest(req);

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

      const permissoesAtivas = new Set();
      for (const r of rolesComPermissoes) {
        if (r.Permissoes) {
          for (const p of r.Permissoes) {
            permissoesAtivas.add(p.id_permissao);
          }
        }
      }

      let dbStatus = '';
      if (status === 'Aceite') {
        if (isTalent && !isAdmin) {
          // Talent Manager faz validação inicial (precisa de id_permissao: 4 -> "Validar Evidências")
          if (!permissoesAtivas.has(4)) {
            return res.status(403).json({ error: "Não tens permissões para validar evidências (Validação Inicial)." });
          }
          dbStatus = 'aceite talent';
        } else {
          // Admin ou SLL faz validação final (precisa de id_permissao: 6 -> "Validação Final")
          if (!permissoesAtivas.has(6)) {
            return res.status(403).json({ error: "Não tens permissões para realizar a Validação Final desta candidatura." });
          }
          dbStatus = 'aceite';
        }
      } else if (status === 'Recusada') {
        dbStatus = 'recusada';
        // Se a candidatura já foi pré-aceite pelo TM ('aceite talent'), apenas quem tem permissão de Validação Final (6) pode recusar
        if (submissao.status === 'aceite talent') {
          if (!permissoesAtivas.has(6)) {
            return res.status(403).json({ error: "Apenas utilizadores com permissão de Validação Final podem recusar esta candidatura." });
          }
        } else {
          // Se está pendente, quem tem permissão 4 (Validar Evidências) ou 6 (Validação Final) pode recusar
          if (!permissoesAtivas.has(4) && !permissoesAtivas.has(6)) {
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

      // 2. Enviar notificação ao consultor/candidato (se a permissão de veredicto estiver ativa)
      const candidato = await Utilizador.findByPk(submissao.id_utilizador);
      const badgeObj = await Badges.findByPk(submissao.id_badge, {
        include: [{
          model: Area,
          include: [{
            model: ServiceLine,
            include: [{
              model: Utilizador,
              as: 'Lider'
            }]
          }]
        }]
      });
      const nomeBadge = badgeObj ? badgeObj.nome_badge : 'Badge';
      const lider = badgeObj?.Area?.ServiceLine?.Lider;

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

      // Permissão 9: Veredito avaliação
      const perm9 = await Permissoes.findByPk(9);
      if (deveEnviarNotif && perm9?.toggle !== false) {
        const notificacao = await Notificacoes.create({
          id_utilizador: id_utilizador, // Emissor (avaliador)
          descricao_notificacao: msgNotif,
          data_envio: new Date(),
          tipo_notificacao: 'AVALIACAO_STATUS'
        });

        await Recetor.create({
          id_notificacao: notificacao.id_notificacao,
          id_utilizador: submissao.id_utilizador, // Recetor (candidato)
          lida: false
        });

        if (candidato?.email && emailValido(candidato.email)) {
          await enviarEmail({
            to: candidato.email,
            subject: `Resultado da candidatura - ${nomeBadge}`,
            text: msgNotif,
            html: `<p>${msgNotif}</p>`
          });
        }
      }

      // Permissão 11: Alerta validação final (para Service Line Leaders)
      if (dbStatus === 'aceite talent' && lider) {
        const perm11 = await Permissoes.findByPk(11);
        if (perm11?.toggle !== false) {
          const msgSLL = `A candidatura de ${candidato?.nome_user || 'Consultor'} ao badge "${nomeBadge}" foi pré-aceite pelo Talent Manager e aguarda a sua validação final.`;
          const notificacaoSLL = await Notificacoes.create({
            id_utilizador: id_utilizador, // Emissor (TM)
            descricao_notificacao: msgSLL,
            data_envio: new Date(),
            tipo_notificacao: 'VALIDACAO_FINAL_PENDENTE'
          });

          await Recetor.create({
            id_notificacao: notificacaoSLL.id_notificacao,
            id_utilizador: lider.id_utilizador, // Recetor (SLL)
            lida: false
          });

          if (lider.email && emailValido(lider.email)) {
            await enviarEmail({
              to: lider.email,
              subject: `Nova validação final pendente - ${nomeBadge}`,
              text: msgSLL,
              html: `<p>${msgSLL}</p>`
            });
          }
        }
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
