const { Op } = require('sequelize');
const { 
  sequelize, 
  Badges, 
  Notificacoes, 
  Recetor, 
  Utilizador, 
  Consultor, 
  Submissoes, 
  Documentos, 
  Objetivos, 
  LearningPath, 
  RequisitosBadge, 
  RegistoBadges 
} = require('../models');

/**
 * 1. Rota GET /api/sync/pull
 * O telemóvel descarrega os deltas (dados novos/alterados/apagados) do servidor.
 */
exports.pull = async (req, res) => {
  try {
    const { last_sync } = req.query;
    let queryOptions = {
      // CRÍTICO: paranoid: false inclui registos soft-deleted (deletedAt não nulo) 
      // para que a app móvel saiba quais registos deve apagar localmente.
      paranoid: false 
    };

    // Se last_sync for fornecido, filtramos apenas registos atualizados após essa data
    if (last_sync) {
      const lastSyncDate = new Date(last_sync);
      if (isNaN(lastSyncDate.getTime())) {
        return res.status(400).json({ success: false, message: "Formato de last_sync inválido. Deve ser ISO 8601." });
      }
      queryOptions.where = {
        updatedAt: {
          [Op.gt]: lastSyncDate
        }
      };
    }

    // Executa as pesquisas em paralelo
    const [
      badges,
      notificacoes,
      recetor,
      utilizador,
      consultor,
      submissoes,
      documentos,
      objetivos,
      learningPaths,
      requisitosBadge,
      registoBadges
    ] = await Promise.all([
      Badges.findAll(queryOptions),
      Notificacoes.findAll(queryOptions),
      Recetor.findAll(queryOptions),
      Utilizador.findAll(queryOptions),
      Consultor.findAll(queryOptions),
      Submissoes.findAll(queryOptions),
      Documentos.findAll(queryOptions),
      Objetivos.findAll(queryOptions),
      LearningPath.findAll(queryOptions),
      RequisitosBadge.findAll(queryOptions),
      RegistoBadges.findAll(queryOptions)
    ]);

    return res.status(200).json({
      timestamp_servidor: new Date().toISOString(),
      dados: {
        badges,
        notificacoes,
        recetor,
        utilizador,
        consultor,
        submissoes,
        documentos,
        objetivos,
        learning_paths: learningPaths,
        requisitos_badges: requisitosBadge,
        registo_badges: registoBadges
      }
    });

  } catch (error) {
    console.error("Erro no pull de sincronização:", error);
    return res.status(500).json({ success: false, message: "Erro interno no servidor ao sincronizar (pull)." });
  }
};

/**
 * 2. Rota POST /api/sync/push
 * O telemóvel envia alterações pendentes criadas/alteradas offline.
 */
exports.push = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { submissoes_pendentes, recetores_lidos, perfil_editado } = req.body;
    
    const processedIds = {
      submissoes: [],
      recetores: [],
      perfil: []
    };

    // 2.1 Processar Submissões Pendentes
    if (Array.isArray(submissoes_pendentes)) {
      for (const sub of submissoes_pendentes) {
        if (sub.id_submissao) {
          // Tenta encontrar para decidir entre update ou create
          const exists = await Submissoes.findOne({ 
            where: { id_submissao: sub.id_submissao }, 
            paranoid: false,
            transaction 
          });

          if (exists) {
            await Submissoes.update(sub, { 
              where: { id_submissao: sub.id_submissao }, 
              transaction 
            });
          } else {
            await Submissoes.create(sub, { transaction });
          }
          processedIds.submissoes.push(sub.id_submissao);
        }
      }
    }

    // 2.2 Processar Recetores Lidos (Tabela de ligação Notificação <-> Utilizador)
    if (Array.isArray(recetores_lidos)) {
      for (const rec of recetores_lidos) {
        if (rec.id_notificacao && rec.id_utilizador) {
          const exists = await Recetor.findOne({
            where: { 
              id_notificacao: rec.id_notificacao,
              id_utilizador: rec.id_utilizador
            },
            transaction
          });

          if (exists) {
            await Recetor.update(rec, {
              where: { 
                id_notificacao: rec.id_notificacao,
                id_utilizador: rec.id_utilizador
              },
              transaction
            });
          } else {
            await Recetor.create(rec, { transaction });
          }
          processedIds.recetores.push({ 
            id_notificacao: rec.id_notificacao, 
            id_utilizador: rec.id_utilizador 
          });
        }
      }
    }

    // 2.3 Processar Perfil Editado (Tabela Utilizador)
    if (Array.isArray(perfil_editado)) {
      for (const perfil of perfil_editado) {
        if (perfil.id_utilizador) {
          const exists = await Utilizador.findOne({
            where: { id_utilizador: perfil.id_utilizador },
            paranoid: false,
            transaction
          });

          if (exists) {
            await Utilizador.update(perfil, {
              where: { id_utilizador: perfil.id_utilizador },
              transaction
            });
          } else {
            await Utilizador.create(perfil, { transaction });
          }
          processedIds.perfil.push(perfil.id_utilizador);
        }
      }
    }

    // Commit da transação após todas as operações bem sucedidas
    await transaction.commit();
    
    return res.status(200).json({
      success: true,
      processed_ids: processedIds
    });

  } catch (error) {
    // Rollback para garantir atomicidade e consistência da BD em caso de falha
    await transaction.rollback();
    console.error("Erro no push de sincronização:", error);
    return res.status(500).json({ success: false, message: "Erro interno no servidor ao sincronizar (push)." });
  }
};

/**
 * 3. Rota POST /api/sync/upload
 * Recebe ficheiros pesados enviados offline e associa-os à tabela Documentos.
 * Assume a utilização do middleware multer.
 */
exports.upload = async (req, res) => {
  try {
    const { id_submissao, id_requisito } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Nenhum ficheiro foi enviado." });
    }

    if (!id_submissao || !id_requisito) {
      return res.status(400).json({ success: false, message: "id_submissao e id_requisito são campos obrigatórios." });
    }

    // O caminho do ficheiro gerado pelo multer (ex: local ou URL do Cloudinary)
    const filePath = req.file.path || req.file.filename;

    // Cria o esqueleto associando o ficheiro à submissão e requisito respetivo
    const novoDocumento = await Documentos.create({
      id_submissao: parseInt(id_submissao),
      id_requisito: parseInt(id_requisito),
      ficheiro: filePath
    });

    return res.status(200).json({
      success: true,
      message: "Ficheiro carregado e registado com sucesso.",
      documento: novoDocumento
    });

  } catch (error) {
    console.error("Erro no upload de documento de sincronização:", error);
    return res.status(500).json({ success: false, message: "Erro interno no servidor ao efetuar upload." });
  }
};
