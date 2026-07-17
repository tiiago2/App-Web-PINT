const express = require('express');
const mobileAuthMiddleware = require('../middleware/mobile_auth_middleware');
const mobileIdempotencyMiddleware = require('../middleware/mobile_idempotency_middleware');
const mobileEvidenceUploadMiddleware = require('../middleware/mobile_evidence_upload_middleware');
const mobileSubmissionController = require('../controllers/mobile_submission_controller');

const router = express.Router();

router.post(
  '/',
  mobileAuthMiddleware,
  mobileIdempotencyMiddleware({
    operationType: 'submission.create',
    logicalRoute: '/api/mobile/submissions'
  }),
  mobileSubmissionController.create
);
router.post(
  '/:idSubmissao/evidences',
  mobileAuthMiddleware,
  mobileIdempotencyMiddleware.requireKey({ multipart: true }),
  mobileEvidenceUploadMiddleware,
  mobileIdempotencyMiddleware({
    operationType: 'submission.evidence.create',
    logicalRoute: '/api/mobile/submissions/:idSubmissao/evidences',
    multipart: true
  }),
  mobileSubmissionController.addEvidence
);
router.delete(
  '/:idSubmissao/evidences/:idFicheiro',
  mobileAuthMiddleware,
  mobileIdempotencyMiddleware({
    operationType: 'submission.evidence.delete',
    logicalRoute: '/api/mobile/submissions/:idSubmissao/evidences/:idFicheiro'
  }),
  mobileSubmissionController.removeEvidence
);
router.post(
  '/:idSubmissao/submit',
  mobileAuthMiddleware,
  mobileIdempotencyMiddleware({
    operationType: 'submission.submit',
    logicalRoute: '/api/mobile/submissions/:idSubmissao/submit'
  }),
  mobileSubmissionController.submit
);
router.get('/:idSubmissao', mobileAuthMiddleware, mobileSubmissionController.get);

module.exports = router;
