const mobileMutationService = require('../services/mobile_mutation_service');

function responderErro(res, error, operation) {
  if ([400, 403, 404, 409].includes(error.statusCode)) {
    const payload = { success: false, error: error.message };
    if (error.code) payload.code = error.code;
    return res.status(error.statusCode).json(payload);
  }

  console.error(`Erro interno numa mutação mobile (${operation}).`);
  return res.status(500).json({
    success: false,
    error: 'Erro interno ao processar a operação mobile.'
  });
}

function criarMobileMutationController(service = mobileMutationService) {
  function idUtilizador(req) {
    return req.mobileAuth.id_utilizador;
  }

  return {
    async criarObjetivo(req, res) {
      try {
        const objective = await service.criarObjetivo({
          idUtilizador: idUtilizador(req),
          body: req.body
        });
        return res.status(201).json({ success: true, objective });
      } catch (error) {
        return responderErro(res, error, 'criar objetivo');
      }
    },

    async eliminarObjetivo(req, res) {
      try {
        const result = await service.eliminarObjetivo({
          idUtilizador: idUtilizador(req),
          idObjetivo: req.params.idObjetivo
        });
        return res.status(200).json({ success: true, ...result });
      } catch (error) {
        return responderErro(res, error, 'eliminar objetivo');
      }
    },

    async atualizarPerfil(req, res) {
      try {
        const profile = await service.atualizarPerfil({
          idUtilizador: idUtilizador(req),
          body: req.body
        });
        return res.status(200).json({ success: true, profile });
      } catch (error) {
        return responderErro(res, error, 'atualizar perfil');
      }
    },

    async atualizarAssinatura(req, res) {
      try {
        const signature = await service.atualizarAssinatura({
          idUtilizador: idUtilizador(req),
          body: req.body
        });
        return res.status(200).json({ success: true, signature });
      } catch (error) {
        return responderErro(res, error, 'atualizar assinatura');
      }
    }
  };
}

module.exports = criarMobileMutationController();
module.exports._criarParaTestes = criarMobileMutationController;
