const {
  Objetivos,
  Badges,
  Area,
  ServiceLine,
  LearningPath,
  Nivel,
  Submissoes,
  RequisitosBadge,
  Documentos,
  RegistoBadges
} = require("../models");

const { Op } = require("sequelize");
const { scheduleUsersDataChanged } = require('../services/sync_push_service');

// Include comum para trazer toda a hierarquia do Badge (Nível, Área, Service Line e Learning Path)
// 1. O teu objeto (mantém-se igual, pois estava muito bem estruturado)
const includeBadgesCompleto = {
  model: Badges,
  attributes: ["id_badge", "nome_badge", "descricao_badge", "imagem", "pontos_badge", "especial", "id_nivel", "id_area", "validade"],
  include: [
    {
      model: Nivel,
      attributes: ["id_nivel", "nome_nivel"]
    },
    {
      model: Area,
      attributes: ["id_area", "nome_area", "id_service_line"],
      include: [
        {
          model: ServiceLine,
          attributes: ["id_service_line", "nome_service_line", "id_learning_path"],
          include: [
            {
              model: LearningPath,
              attributes: ["id_learning_path", "nome_learning_path"]
            }
          ]
        }
      ]
    }
  ]
};



function formatarBadgePayload(badge) {
  if (!badge) return null;

  const area = badge.Area;
  const serviceLine = area?.ServiceLine;
  const learningPath = serviceLine?.LearningPath;
  const nivel = badge.Nivel;

  return {
    id_badge: badge.id_badge,
    nome_badge: badge.nome_badge,
    descricao_badge: badge.descricao_badge,
    imagem: badge.imagem,
    pontos_badge: badge.pontos_badge,
    validade: badge.validade ?? null,
    especial: badge.especial ?? false,
    id_nivel: nivel?.id_nivel ?? badge.id_nivel ?? null,
    nome_nivel: nivel?.nome_nivel ?? null,
    id_area: area?.id_area ?? badge.id_area ?? null,
    nome_area: area?.nome_area ?? 'Geral',
    id_service_line: serviceLine?.id_service_line ?? null,
    nome_service_line: serviceLine?.nome_service_line ?? null,
    id_learning_path: learningPath?.id_learning_path ?? null,
    nome_learning_path: learningPath?.nome_learning_path ?? null
  };
}

module.exports = {
  // 1. Obter todos os objetivos do consultor autenticado (em progresso e histórico)
  async getObjetivos(req, res) {
    try {
      const id_utilizador = req.utilizadorLogado.id_utilizador;

      const objetivos = await Objetivos.findAll({
        where: {
          id_utilizador,
          deleted_objetivo: false
        },
        include: [includeBadgesCompleto],
        order: [["data_final", "ASC"]]
      });

      const objetivosFormatados = [];

      for (const obj of objetivos) {
        const badge = obj.Badge;
        if (!badge) continue;

        let progresso = 0;

        if (obj.data_conclusao) {
          progresso = 100;
        } else {
          const submissao = await Submissoes.findOne({
            where: {
              id_utilizador,
              id_badge: badge.id_badge,
              status: {
                [Op.notIn]: ["Aceite", "Concluído"]
              }
            }
          });

          if (submissao) {
            const totalRequisitos = await RequisitosBadge.count({
              where: { id_badge: badge.id_badge }
            });

            const documentosSubmetidos = await Documentos.count({
              where: {
                id_submissao: submissao.id_submissao,
                deleted_file: false
              }
            });

            progresso = totalRequisitos > 0
              ? Math.round((documentosSubmetidos / totalRequisitos) * 100)
              : 0;
          }
        }

        const badgeFormatado = formatarBadgePayload(badge);

        objetivosFormatados.push({
          id: obj.id_objetivo,
          id_objetivo: obj.id_objetivo,
          id_badge: badge.id_badge,
          id_utilizador: obj.id_utilizador,
          titulo: badge.nome_badge,
          data: obj.data_final,
          data_inicial: obj.data_inicial,
          data_final: obj.data_final,
          data_conclusao: obj.data_conclusao,
          deleted_objetivo: obj.deleted_objetivo,
          progresso,
          imagem: badge.imagem,
          badge: badgeFormatado
        });
      }

      return res.status(200).json(objetivosFormatados);
    } catch (error) {
      console.error("Erro ao buscar objetivos:", error);
      return res.status(500).json({ error: "Erro ao buscar objetivos." });
    }
  },

  // 2. Criar um novo objetivo para o consultor autenticado
  async criarObjetivo(req, res) {
    try {
      const id_utilizador = req.utilizadorLogado.id_utilizador;
      const { id_badge, data_final } = req.body;

      if (!id_badge || !data_final) {
        return res.status(400).json({ error: "O id_badge e a data_final são obrigatórios." });
      }

      const badgeObj = await Badges.findOne({
        where: { id_badge, deleted_badge: false }
      });

      if (!badgeObj) {
        return res.status(404).json({ error: "Badge não encontrado." });
      }

      // Impedir objetivos duplicados ativos para o mesmo badge
      const objetivoExistente = await Objetivos.findOne({
        where: {
          id_utilizador,
          id_badge,
          deleted_objetivo: false,
          data_conclusao: null
        }
      });

      if (objetivoExistente) {
        return res.status(409).json({
          error: "Já existe um objetivo ativo para este badge.",
          code: "OBJETIVO_DUPLICADO"
        });
      }

      const novoObjetivo = await Objetivos.create({
        id_badge: badgeObj.id_badge,
        id_utilizador,
        data_inicial: new Date(),
        data_final,
        deleted_objetivo: false,
        data_conclusao: null
      });

      const objetivoCriado = await Objetivos.findOne({
        where: { id_objetivo: novoObjetivo.id_objetivo },
        include: [includeBadgesCompleto]
      });

      const badgeInfo = objetivoCriado.Badge;
      const badgeFormatado = formatarBadgePayload(badgeInfo);

      const payload = {
        id: objetivoCriado.id_objetivo,
        id_objetivo: objetivoCriado.id_objetivo,
        id_badge: badgeInfo.id_badge,
        id_utilizador: objetivoCriado.id_utilizador,
        titulo: badgeInfo.nome_badge,
        data: objetivoCriado.data_final,
        data_inicial: objetivoCriado.data_inicial,
        data_final: objetivoCriado.data_final,
        data_conclusao: objetivoCriado.data_conclusao,
        deleted_objetivo: objetivoCriado.deleted_objetivo,
        progresso: 0,
        imagem: badgeInfo.imagem,
        badge: badgeFormatado
      };

      scheduleUsersDataChanged({ userIds: [id_utilizador], entity: 'objectives' });
      return res.status(201).json(payload);
    } catch (error) {
      console.error("Erro ao criar objetivo:", error);
      return res.status(500).json({ error: "Erro ao criar objetivo." });
    }
  },

  // 3. Eliminar (soft delete) um objetivo do consultor autenticado
  async removerObjetivo(req, res) {
    try {
      const id_utilizador = req.utilizadorLogado.id_utilizador;
      const { id } = req.params;

      const objetivo = await Objetivos.findOne({
        where: {
          id_objetivo: id,
          id_utilizador,
          deleted_objetivo: false
        }
      });

      if (!objetivo) {
        return res.status(404).json({ error: "Objetivo não encontrado ou já removido." });
      }

      await objetivo.update({
        deleted_objetivo: true,
        data_eliminacao: new Date()
      });

      scheduleUsersDataChanged({ userIds: [id_utilizador], entity: 'objectives' });
      return res.status(200).json({ message: "Objetivo removido com sucesso.", id_objetivo: Number(id) });
    } catch (error) {
      console.error("Erro ao remover objetivo:", error);
      return res.status(500).json({ error: "Erro ao remover objetivo." });
    }
  },

  // 4. Obter badges disponíveis para propor como objetivo (com Nível, Área, Service Line e Learning Path)
  async getBadgesDisponiveis(req, res) {
    try {
      const id_utilizador = req.utilizadorLogado.id_utilizador;

      // 1. Obter badges que o utilizador já obteve e que ainda estão válidos
      const registos = await RegistoBadges.findAll({
        where: { id_utilizador, expirado: false },
        include: [{
          model: Badges,
          attributes: ["validade"]
        }]
      });

      const agora = new Date();
      const obtidosEValidosIds = registos
        .filter(reg => {
          const badge = reg.Badge;
          if (!badge) return false;
          if (badge.validade === null || badge.validade === undefined) return true; // Sem validade = eterno
          const validade = Number(badge.validade);
          if (!Number.isInteger(validade) || validade <= 0) return true; // Eterno
          const dataExpiracao = new Date(reg.data_obtencao);
          dataExpiracao.setDate(dataExpiracao.getDate() + validade);
          return dataExpiracao > agora;
        })
        .map(reg => reg.id_badge);

      // 2. Obter badges com objetivos em curso (ativos e não concluídos)
      const objetivosAtivos = await Objetivos.findAll({
        where: {
          id_utilizador,
          deleted_objetivo: false,
          data_conclusao: null
        },
        attributes: ["id_badge"]
      });
      const emProgressoIds = objetivosAtivos.map(obj => obj.id_badge);

      const excludeIds = [...new Set([...obtidosEValidosIds, ...emProgressoIds])];

      const badges = await Badges.findAll({
        where: {
          deleted_badge: false,
          ...(excludeIds.length > 0 && {
            id_badge: {
              [Op.notIn]: excludeIds
            }
          })
        },
        include: [
          {
            model: Nivel,
            attributes: ["id_nivel", "nome_nivel"]
          },
          {
            model: Area,
            attributes: ["id_area", "nome_area", "id_service_line"],
            include: [
              {
                model: ServiceLine,
                attributes: ["id_service_line", "nome_service_line", "id_learning_path"],
                include: [
                  {
                    model: LearningPath,
                    attributes: ["id_learning_path", "nome_learning_path"]
                  }
                ]
              }
            ]
          }
        ],
        order: [["nome_badge", "ASC"]]
      });

      const badgesFormatados = badges.map(formatarBadgePayload);

      return res.status(200).json(badgesFormatados);
    } catch (error) {
      console.error("Erro ao buscar badges disponíveis:", error);
      return res.status(500).json({ error: "Erro ao buscar badges disponíveis." });
    }
  }
};
