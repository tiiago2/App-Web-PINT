const mobileSubmissionService = require('../services/mobile_submission_service');

function respondError(res, error, operation) {
  if ([400, 403, 404, 409, 413, 415].includes(error.statusCode)) {
    const payload = { success: false, error: error.message };
    if (error.code) payload.code = error.code;
    for (const field of [
      'status_atual',
      'total_requisitos',
      'requisitos_anexados',
      'requisitos_em_falta'
    ]) {
      if (error[field] !== undefined) payload[field] = error[field];
    }
    return res.status(error.statusCode).json(payload);
  }

  console.error(`Erro interno numa operação de submissão mobile (${operation}).`);
  return res.status(500).json({
    success: false,
    error: 'Erro interno ao processar a submissão mobile.'
  });
}

function createMobileSubmissionController(service = mobileSubmissionService) {
  const userId = (req) => req.mobileAuth.id_utilizador;

  return {
    async create(req, res) {
      try {
        const submission = await service.createSubmission({
          idUser: userId(req),
          body: req.body
        });
        return res.status(201).json({ success: true, submission });
      } catch (error) {
        return respondError(res, error, 'criação');
      }
    },

    async addEvidence(req, res) {
      try {
        const result = await service.addEvidence({
          idUser: userId(req),
          idSubmission: req.params.idSubmissao,
          idRequirement: req.body?.id_requisito,
          file: req.file
        });
        return res.status(result.created ? 201 : 200).json({
          success: true,
          created: result.created,
          replaced: result.replaced,
          evidence: result.evidence
        });
      } catch (error) {
        return respondError(res, error, 'upload de evidência');
      }
    },

    async removeEvidence(req, res) {
      try {
        const result = await service.removeEvidence({
          idUser: userId(req),
          idSubmission: req.params.idSubmissao,
          idFile: req.params.idFicheiro
        });
        return res.status(200).json({ success: true, ...result });
      } catch (error) {
        return respondError(res, error, 'remoção de evidência');
      }
    },

    async submit(req, res) {
      try {
        const submission = await service.submit({
          idUser: userId(req),
          idSubmission: req.params.idSubmissao
        });
        return res.status(200).json({ success: true, submission });
      } catch (error) {
        return respondError(res, error, 'confirmação');
      }
    },

    async get(req, res) {
      try {
        const submission = await service.getSubmission({
          idUser: userId(req),
          idSubmission: req.params.idSubmissao
        });
        return res.status(200).json({ success: true, submission });
      } catch (error) {
        return respondError(res, error, 'consulta');
      }
    }
  };
}

module.exports = createMobileSubmissionController();
module.exports._createForTests = createMobileSubmissionController;

