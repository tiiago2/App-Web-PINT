-- ==========================================
-- SCRIPT DE INSERÇÃO DE DADOS DE TESTE
-- ==========================================

-- Limpar dados anteriores para evitar duplicações
truncate table HISTORICO cascade;
truncate table DOCUMENTOS cascade;
truncate table REGISTO_BADGES cascade;
truncate table OBJETIVOS cascade;
truncate table SUBMISSOES cascade;
truncate table RECETOR cascade;
truncate table NOTIFICACOES cascade;
truncate table POLITICAS_RGPD cascade;
truncate table SLA cascade;
truncate table BADGES_ASSINATURA cascade;
truncate table ASSINATURA cascade;
truncate table CONSULTOR cascade;
truncate table UTILIZADOR cascade;
truncate table LOGS cascade;
truncate table REQUISITOS cascade;
truncate table BADGES cascade;
truncate table AREA cascade;
truncate table SERVICE_LINE cascade;
truncate table LEARNING_PATH cascade;
truncate table NIVEL cascade;
truncate table ROLE cascade;
truncate table USER_ROLES cascade;
truncate table PERMISSOES_ROLE cascade;
truncate table PERMISSOES cascade;

-- 1. NIVEIS
insert into NIVEL (ID_NIVEL, NOME_USER) values
(1, 'Iniciante'),
(2, 'Intermédio'),
(3, 'Avançado');

-- 2. ROLES
insert into ROLE (ID_ROLE, NOME_ROLE) values
(1, 'admin'),
(2, 'talent'),
(3, 'consultor'),
(4, 'service');

-- 3. LEARNING PATHS
insert into LEARNING_PATH (ID_LEARNING_PATH, NOME_LEARNING_PATH, DESCRICAO_LARNING_PATH, UPDATED_PATH, DELETED_PATH) values
(1, 'Jornada Técnica', 'Focada no desenvolvimento de competências tecnológicas de excelência.', '2026-01-01', false),
(2, 'Jornada de Gestão', 'Desenvolvimento de competências em gestão ágil, equipas e projetos.', '2026-01-01', false);

-- 4. SERVICE LINES
insert into SERVICE_LINE (ID_SERVICE_LINE, ID_LEARNING_PATH, NOME_SERVICE_LINE, DESCRICAO_SERVICE_LINE, UPDATED_SERVICE, DELETED_SERVICE, ID_LIDER) values
(1, 1, 'Hybrid Systems', 'Integração de infraestruturas híbridas e cloud.', '2026-01-01', false, 5),
(2, 1, 'Mobile Solutions', 'Desenvolvimento nativo e híbrido para iOS e Android.', '2026-01-01', false, 5),
(3, 2, 'Consulting', 'Gestão ágil de processos de negócio.', '2026-01-01', false, 5);

-- 5. AREAS
insert into AREA (ID_AREA, ID_SERVICE_LINE, NOME_AREA, DESCRICAO_AREA, UPDATED_AREA, DELETED_AREA) values
(1, 1, 'Hybrid Systems', 'Desenvolvimento de sistemas híbridos.', '2026-01-01', false),
(2, 2, 'Mobile Solutions', 'Desenvolvimento de soluções móveis.', '2026-01-01', false),
(3, 3, 'Consulting', 'Consultoria e gestão de processos.', '2026-01-01', false);

-- 6. UTILIZADORES
insert into UTILIZADOR (ID_UTILIZADOR, ID_ASSINATURA, NOME_USER, EMAIL, TELEFONE, LAST_LOGIN, LINGUA, PASSWORD, ACEITACAO_POLITICAS, ACEITACAO_SLA, UPDATE_USER, ATIVO, IMAGEM_PREFIL) values
(1, null, 'João Silva', 'joao.silva@softinsa.pt', 912345678, '2026-05-27', 'pt', '123456', true, true, '2026-05-27', true, 'utilizador.png'),
(2, null, 'Maria Santos', 'maria.santos@softinsa.pt', 923456789, '2026-05-27', 'pt', '123456', true, true, '2026-05-27', true, 'utilizador.png'),
(3, null, 'Pedro Costa', 'pedro.costa@softinsa.pt', 934567890, '2026-05-26', 'pt', '123456', true, true, '2026-05-26', true, 'utilizador.png'),
(4, null, 'Ana Rodrigues', 'ana.rodrigues@softinsa.pt', 965432100, '2026-05-26', 'pt', '123456', true, true, '2026-05-26', true, 'utilizador.png'),
(5, null, 'Sistema', 'sistema@softinsa.pt', 0, '2026-05-27', 'pt', '123456', true, true, '2026-05-27', true, 'utilizador.png');

-- 7. CONSULTORES (Mapeamento 1-para-1 com UTILIZADOR)
insert into CONSULTOR (ID_UTILIZADOR, ID_AREA, ID_ASSINATURA, NOME_USER, EMAIL, TELEFONE, LAST_LOGIN, LINGUA, PASSWORD, ACEITACAO_POLITICAS, ACEITACAO_SLA, UPDATE_USER, ATIVO, IMAGEM_PREFIL, PONTOS_TOTAIS) values
(1, 1, null, 'João Silva', 'joao.silva@softinsa.pt', 912345678, '2026-05-27', 'pt', '123456', true, true, '2026-05-27', true, 'utilizador.png', 374957),
(2, 2, null, 'Maria Santos', 'maria.santos@softinsa.pt', 923456789, '2026-05-27', 'pt', '123456', true, true, '2026-05-27', true, 'utilizador.png', 310500),
(3, 3, null, 'Pedro Costa', 'pedro.costa@softinsa.pt', 934567890, '2026-05-26', 'pt', '123456', true, true, '2026-05-26', true, 'utilizador.png', 295000),
(4, 1, null, 'Ana Rodrigues', 'ana.rodrigues@softinsa.pt', 965432100, '2026-05-26', 'pt', '123456', true, true, '2026-05-26', true, 'utilizador.png', 35200);

-- 8. BADGES
insert into BADGES (ID_BADGE, ID_AREA, ID_NIVEL, VALIDADE, ESPECIAL, PONTOS_BADGE, NOME_BADGE, IMAGEM, UPDATE_BADGE, DELETED_BADGE) values
(1, 1, 1, 365, false, 100, 'Low Code', 'badge_lowcode.png', '2026-01-01', false),
(2, 2, 2, 365, false, 85, 'Badge Premium', 'badge_premium.png', '2026-01-01', false),
(3, 3, 3, 365, true, 150, 'Badge Expert', 'badge_expert.png', '2026-01-01', false);

-- 9. REGISTO DE BADGES (Recebidos - received)
-- João Silva recebeu Low Code (Há 2 horas)
insert into REGISTO_BADGES (ID_REGISTO, ID_BADGE, ID_UTILIZADOR, DATA_OBTENCAO) values
(1, 1, 1, current_timestamp - interval '2 hours'),
-- Ana Rodrigues recebeu Badge Expert (Há 1 dia)
(2, 3, 4, current_timestamp - interval '1 day');

-- 10. SUBMISSOES (Rejeitadas - rejected)
-- João Silva rejeitado em Low Code (Há 2 horas)
insert into SUBMISSOES (ID_SUBMISSAO, ID_BADGE, ID_UTILIZADOR, STATUS, DATA_SUBMISSAO) values
(1, 1, 1, 'Rejeitada', current_timestamp - interval '2 hours'),
-- Pedro Costa rejeitado em Candidatura (Há 1 dia)
(2, 2, 3, 'Rejeitada', current_timestamp - interval '1 day');

-- 11. POLITICAS RGPD (Políticas - policy)
-- Sistema atualizou políticas RGPD (Há 2 horas)
insert into POLITICAS_RGPD (ID_POLITICA, ID_UTILIZADOR, DESCRICAO, DATA_ALTERACAO) values
(1, 5, 'Atualização das políticas globais de privacidade RGPD da Softinsa.', current_timestamp - interval '2 hours');

-- 12. LOGS (Atualizados - updated)
-- Sistema atualizou Low Code (Hǭ 2 horas)
insert into LOGS (ID_LOG, TABELA, TIPO, ID_ALVO, DATA_LOG) values
(1, 'BADGES', 2, 1, current_timestamp - interval '2 hours'),
-- Maria Santos atualizou Badge Premium (Hǭ 5 horas)
(2, 'BADGES', 2, 2, current_timestamp - interval '5 hours');

-- 13. USER ROLES
insert into USER_ROLES (ID_UTILIZADOR, ID_ROLE) values
(1, 3), -- João Silva (consultor)
(2, 2), -- Maria Santos (talent)
(3, 3), -- Pedro Costa (consultor)
(4, 3), -- Ana Rodrigues (consultor)
(5, 1); -- Sistema (admin)
