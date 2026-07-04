const express = require('express');
const router = express.Router();
const editarController = require('../controllers/editar_controller');
const badgesController = require('../controllers/badges_controller');
const authMiddleware = require('../middleware/auth_middleware');

// Aplicar autenticação a todas as rotas de edição
router.use(authMiddleware);

// --- 1. Utilizadores Elegíveis para Líder ---
router.get('/utilizadores-lideres', editarController.obterLideresElegiveis);

// --- 2. Learning Paths ---
router.get('/learning-paths', editarController.listarLearningPaths);
router.post('/learning-paths', editarController.criarLearningPath);
router.put('/learning-paths/:id', editarController.atualizarLearningPath);
router.delete('/learning-paths/:id', editarController.removerLearningPath);

// --- 3. Service Lines ---
router.get('/service-lines', editarController.listarServiceLines);
router.post('/service-lines', editarController.criarServiceLine);
router.put('/service-lines/:id', editarController.atualizarServiceLine);
router.delete('/service-lines/:id', editarController.removerServiceLine);

// --- 4. Áreas ---
router.get('/areas', editarController.listarAreas);
router.post('/areas', editarController.criarArea);
router.put('/areas/:id', editarController.atualizarArea);
router.delete('/areas/:id', editarController.removerArea);

// --- 5. Badges (Sem POST) ---
router.get('/badges', badgesController.listarBadgesAdmin);
router.put('/badges/:id', badgesController.atualizarBadge);
router.delete('/badges/:id', badgesController.removerBadge);

module.exports = router;
