const {
  Utilizador,
  Role,
  Consultor,
  Logs,
  RegistoBadges,
  Submissoes,
  Badges,
  Area,
  ServiceLine,
  LearningPath,
  PoliticasRgpd
} = require("../models");
const { Op } = require("sequelize");

const TABELAS_LOG_PUBLICAS = ["area", "service_line", "learning_path", "badges"];
const TABELA_LOG_REGISTO = "registo_badges";

const PERFIL_CONFIG = {
  admin: {
    nomeReal: "Administrador",
    aliases: ["administrador", "admin"]
  },
  talent: {
    nomeReal: "Talent Manager",
    aliases: ["talent manager", "talent"]
  },
  service: {
    nomeReal: "Service Line Leader",
    aliases: ["service line leader", "service"]
  },
  consultor: {
    nomeReal: "Consultor",
    aliases: ["consultor"]
  }
};

const PRIORIDADE_PERFIL = ["admin", "talent", "service", "consultor"];

function normalizarTextoPerfil(valor) {
  if (valor === undefined || valor === null) return "";
  if (Array.isArray(valor)) {
    const primeiro = valor.find((v) => typeof v === "string" && v.trim() !== "");
    return primeiro ? primeiro.toString().toLowerCase().trim() : "";
  }
  return valor.toString().toLowerCase().trim();
}

function resolverPerfilCanonica(valor) {
  const normalizado = normalizarTextoPerfil(valor);
  if (!normalizado) return null;

  for (const [perfil, config] of Object.entries(PERFIL_CONFIG)) {
    const candidatos = [perfil, config.nomeReal.toLowerCase(), ...config.aliases];
    if (candidatos.includes(normalizado)) return perfil;
  }

  return null;
}

function determinarPerfilAtivo(roles, perfilQuery) {
  const perfisUtilizador = [
    ...new Set(
      roles
        .map((role) => resolverPerfilCanonica(role))
        .filter(Boolean)
    )
  ];

  const perfilSolicitado = resolverPerfilCanonica(perfilQuery);
  if (perfilSolicitado && perfisUtilizador.includes(perfilSolicitado)) {
    return perfilSolicitado;
  }

  for (const perfil of PRIORIDADE_PERFIL) {
    if (perfisUtilizador.includes(perfil)) return perfil;
  }

  return "consultor";
}

function normalizarTabela(tabela) {
  return (tabela || "").toLowerCase().trim();
}

async function getServiceLineDoLider(id_utilizador) {
  return ServiceLine.findOne({
    where: { id_lider: id_utilizador, deleted_service: false }
  });
}

async function getIdsAreasServiceLine(id_service_line) {
  const areas = await Area.findAll({
    where: { id_service_line, deleted_area: false },
    attributes: ["id_area"]
  });
  return areas.map((a) => a.id_area);
}

async function getIdsRegistosConsultor(id_utilizador) {
  const registos = await RegistoBadges.findAll({
    where: { id_utilizador },
    attributes: ["id_registo"]
  });
  return registos.map((r) => r.id_registo);
}

async function getIdsRegistosServiceLine(ids_areas) {
  if (!ids_areas || ids_areas.length === 0) return [];

  const badges = await Badges.findAll({
    where: { id_area: { [Op.in]: ids_areas } },
    attributes: ["id_badge"]
  });
  const ids_badges = badges.map((b) => b.id_badge);

  if (ids_badges.length === 0) return [];

  const registos = await RegistoBadges.findAll({
    where: { id_badge: { [Op.in]: ids_badges } },
    attributes: ["id_registo"]
  });
  return registos.map((r) => r.id_registo);
}

async function getIdsConsultoresServiceLine(ids_areas) {
  if (!ids_areas || ids_areas.length === 0) return [];

  const consultores = await Consultor.findAll({
    where: { id_area: { [Op.in]: ids_areas } },
    attributes: ["id_utilizador"]
  });
  return consultores.map((c) => c.id_utilizador);
}

exports.getAtividade = async (req, res) => {
  try {
    const id_utilizador = req.utilizadorLogado.id_utilizador;
    const perfilQuery = req.query.perfil;

    const utilizador = await Utilizador.findByPk(id_utilizador, {
      include: [
        {
          model: Role,
          attributes: ["nome_role"],
          through: { attributes: [] }
        }
      ]
    });

    if (!utilizador) {
      return res.status(404).json({ error: "Utilizador não encontrado." });
    }

    const roles = utilizador.Roles.map((r) => r.nome_role);
    const perfil = determinarPerfilAtivo(roles, perfilQuery);

    let idsRegistosPermitidos = null;

    if (perfil === "consultor") {
      idsRegistosPermitidos = await getIdsRegistosConsultor(id_utilizador);
    } else if (perfil === "service") {
      const serviceLine = await getServiceLineDoLider(id_utilizador);
      if (!serviceLine) {
        return res
          .status(403)
          .json({ error: "Utilizador não é líder de nenhuma service line." });
      }
      const ids_areas = await getIdsAreasServiceLine(serviceLine.id_service_line);
      idsRegistosPermitidos = await getIdsRegistosServiceLine(ids_areas);
    }

    const whereTipo = { tipo: { [Op.in]: [1, 2, 3] } };

    // 1. Logs públicos: area, service_line, learning_path, badges
    const wherePublico = {
      ...whereTipo,
      tabela: {
        [Op.or]: TABELAS_LOG_PUBLICAS.map((t) => ({ [Op.iLike]: t }))
      }
    };

    const logsPublicos = await Logs.findAll({
      where: wherePublico
    });

    // 2. Logs de registo_badges (filtrados por perfil)
    let logsRegistos = [];
    const whereRegistoBase = {
      ...whereTipo,
      tabela: { [Op.iLike]: TABELA_LOG_REGISTO }
    };

    if (perfil === "admin" || perfil === "talent") {
      logsRegistos = await Logs.findAll({
        where: whereRegistoBase
      });
    } else if (idsRegistosPermitidos && idsRegistosPermitidos.length > 0) {
      logsRegistos = await Logs.findAll({
        where: {
          ...whereRegistoBase,
          id_alvo: { [Op.in]: idsRegistosPermitidos }
        }
      });
    }

    // 3. Submissões rejeitadas (mesma regra por perfil que os received)
    const whereRejeitado = {
      status: { [Op.in]: ["recusada", "rejeitada", "rejeitado"] }
    };

    let submissoesRejeitadas = [];
    if (perfil === "admin" || perfil === "talent") {
      submissoesRejeitadas = await Submissoes.findAll({
        where: whereRejeitado,
        include: [
          { model: Utilizador, attributes: ["nome_user"] },
          { model: Badges, attributes: ["nome_badge"] }
        ]
      });
    } else if (perfil === "service") {
      const serviceLine = await getServiceLineDoLider(id_utilizador);
      if (serviceLine) {
        const ids_areas = await getIdsAreasServiceLine(serviceLine.id_service_line);
        const idsConsultores = await getIdsConsultoresServiceLine(ids_areas);
        if (idsConsultores.length > 0) {
          submissoesRejeitadas = await Submissoes.findAll({
            where: { ...whereRejeitado, id_utilizador: { [Op.in]: idsConsultores } },
            include: [
              { model: Utilizador, attributes: ["nome_user"] },
              { model: Badges, attributes: ["nome_badge"] }
            ]
          });
        }
      }
    } else {
      submissoesRejeitadas = await Submissoes.findAll({
        where: { ...whereRejeitado, id_utilizador: id_utilizador },
        include: [
          { model: Utilizador, attributes: ["nome_user"] },
          { model: Badges, attributes: ["nome_badge"] }
        ]
      });
    }

    const atividadesRejeitadas = submissoesRejeitadas.map((s) => ({
      id: `submissao-${s.id_submissao}`,
      type: "rejected",
      user: s.Utilizador?.nome_user || "Utilizador",
      item: s.Badge?.nome_badge || "Badge",
      timestamp: s.data_submissao
    }));

    const todosLogs = [...logsPublicos, ...logsRegistos];

    const idsArea = [];
    const idsServiceLine = [];
    const idsLearningPath = [];
    const idsBadges = [];
    const idsRegistos = [];

    todosLogs.forEach((log) => {
      const tabela = normalizarTabela(log.tabela);
      switch (tabela) {
        case "area":
          idsArea.push(log.id_alvo);
          break;
        case "service_line":
          idsServiceLine.push(log.id_alvo);
          break;
        case "learning_path":
          idsLearningPath.push(log.id_alvo);
          break;
        case "badges":
          idsBadges.push(log.id_alvo);
          break;
        case "registo_badges":
          idsRegistos.push(log.id_alvo);
          break;
      }
    });

    const [areas, serviceLines, learningPaths, badges, registos] = await Promise.all([
      idsArea.length > 0
        ? Area.findAll({ where: { id_area: { [Op.in]: idsArea } }, attributes: ["id_area", "nome_area"] })
        : Promise.resolve([]),
      idsServiceLine.length > 0
        ? ServiceLine.findAll({ where: { id_service_line: { [Op.in]: idsServiceLine } }, attributes: ["id_service_line", "nome_service_line"] })
        : Promise.resolve([]),
      idsLearningPath.length > 0
        ? LearningPath.findAll({ where: { id_learning_path: { [Op.in]: idsLearningPath } }, attributes: ["id_learning_path", "nome_learning_path"] })
        : Promise.resolve([]),
      idsBadges.length > 0
        ? Badges.findAll({ where: { id_badge: { [Op.in]: idsBadges } }, attributes: ["id_badge", "nome_badge"] })
        : Promise.resolve([]),
      idsRegistos.length > 0
        ? RegistoBadges.findAll({
            where: { id_registo: { [Op.in]: idsRegistos } },
            attributes: ["id_registo", "id_utilizador"],
            include: [
              { model: Badges, attributes: ["nome_badge"] },
              { model: Utilizador, attributes: ["nome_user"] }
            ]
          })
        : Promise.resolve([])
    ]);

    const mapArea = new Map(areas.map((a) => [a.id_area, a]));
    const mapServiceLine = new Map(serviceLines.map((s) => [s.id_service_line, s]));
    const mapLearningPath = new Map(learningPaths.map((l) => [l.id_learning_path, l]));
    const mapBadges = new Map(badges.map((b) => [b.id_badge, b]));
    const mapRegistos = new Map(registos.map((r) => [r.id_registo, r]));

    const atividadesLogs = todosLogs.map((log) => {
      const tabela = normalizarTabela(log.tabela);
      let type = "updated";
      let user = "Sistema";
      let item = null;

      switch (tabela) {
        case "area":
          item = mapArea.get(log.id_alvo)?.nome_area || "Área";
          break;
        case "service_line":
          item = mapServiceLine.get(log.id_alvo)?.nome_service_line || "Service Line";
          break;
        case "learning_path":
          item = mapLearningPath.get(log.id_alvo)?.nome_learning_path || "Learning Path";
          break;
        case "badges":
          item = mapBadges.get(log.id_alvo)?.nome_badge || "Badge";
          break;
        case "registo_badges": {
          const registo = mapRegistos.get(log.id_alvo);
          type = "received";
          user = registo?.Utilizador?.nome_user || "Utilizador";
          item = registo?.Badge?.nome_badge || "Badge";
          break;
        }
      }

      if (tabela !== "registo_badges") {
        let entidade = "";
        let acao = "atualizado";
        
        if (log.tipo === 1) acao = "criado";
        if (log.tipo === 3) acao = "removido";

        switch (tabela) {
          case "area":
            entidade = "Área";
            acao = acao === "criado" ? "criada" : acao === "atualizado" ? "atualizada" : "removida";
            break;
          case "service_line":
            entidade = "Service Line";
            acao = acao === "criado" ? "criada" : acao === "atualizado" ? "atualizada" : "removida";
            break;
          case "learning_path":
            entidade = "Learning Path";
            break;
          case "badges":
            entidade = "Badge";
            break;
          default:
            entidade = "Item";
        }

        user = `${entidade} "${item}"`;
        item = `foi ${acao}`;
      }

      return {
        id: `log-${log.id_log}`,
        type,
        user,
        item,
        timestamp: log.data_log
      };
    });

    // 3. Políticas RGPD diretamente da tabela
    const politicas = await PoliticasRgpd.findAll({
      attributes: ["id_politica", "data_alteracao"]
    });

    const atividadesPoliticas = politicas.map((p) => ({
      id: `politica-${p.id_politica}`,
      type: "policy",
      user: "Políticas RGPD",
      item: "foram atualizadas",
      timestamp: p.data_alteracao
    }));

    const todasAtividades = [
      ...atividadesLogs,
      ...atividadesRejeitadas,
      ...atividadesPoliticas
    ];
    todasAtividades.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const stats = {
      total: todasAtividades.length,
      received: todasAtividades.filter((a) => a.type === "received").length,
      rejected: todasAtividades.filter((a) => a.type === "rejected").length,
      updated: todasAtividades.filter((a) => a.type === "updated").length,
      policy: todasAtividades.filter((a) => a.type === "policy").length
    };

    // Paginação para scroll infinito
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const offset = (page - 1) * limit;
    const total = todasAtividades.length;
    const atividadesPaginadas = todasAtividades.slice(offset, offset + limit);

    return res.json({
      data: atividadesPaginadas,
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + limit < total
      },
      stats,
      perfilAtivo: perfil
    });
  } catch (err) {
    console.error("Erro no AtividadeController:", err);
    return res.status(500).json({ error: "Erro interno ao consultar atividades." });
  }
};
