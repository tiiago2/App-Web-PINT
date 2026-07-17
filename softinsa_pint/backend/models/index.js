const { Sequelize } = require('sequelize');
const sequelize = require('../config/db.config');

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// 2. Importar os 25 Modelos (Injeção de dependência)
db.Area = require('./area.js')(sequelize);
db.ServiceLine = require('./service_line.js')(sequelize);
db.LearningPath = require('./learning_path.js')(sequelize);
db.Nivel = require('./nivel.js')(sequelize);
db.Utilizador = require('./utilizador.js')(sequelize);
db.Consultor = require('./consultor.js')(sequelize);
db.Role = require('./role.js')(sequelize);
db.UtilizadorRoles = require('./utilizador_roles.js')(sequelize);
db.Permissoes = require('./permissoes.js')(sequelize);
db.RolePermissoes = require('./role_permissoes.js')(sequelize);
db.Badges = require('./badges.js')(sequelize);
db.Requisitos = require('./requisitos.js')(sequelize);
db.RequisitosBadge = require('./requisitos_badge.js')(sequelize);
db.RegistoBadges = require('./registo_badges.js')(sequelize);
db.Objetivos = require('./objetivos.js')(sequelize);
db.Submissoes = require('./submissoes.js')(sequelize);
db.Documentos = require('./documentos.js')(sequelize);
db.Historico = require('./historico.js')(sequelize);
db.Assinatura = require('./assinatura.js')(sequelize);
db.BadgesAssinatura = require('./badges_assinatura.js')(sequelize);
db.Logs = require('./logs.js')(sequelize);
db.Defs_notificacao = require('./defs_notificacao.js')(sequelize);
db.Notificacoes = require('./notificacoes.js')(sequelize);
db.Recetor = require('./recetor.js')(sequelize);
db.PoliticasRgpd = require('./politicas_rgpd.js')(sequelize);
db.Sla = require('./sla.js')(sequelize);


// =========================================================================
// 3. DEFINIR AS RELAÇÕES (FOREIGN KEYS) BASEADAS NO TEU SCRIPT SQL
// =========================================================================

// --- Herança: Utilizador <-> Consultor (1 para 1) ---
db.Utilizador.hasOne(db.Consultor, { foreignKey: 'id_utilizador' });
db.Consultor.belongsTo(db.Utilizador, { foreignKey: 'id_utilizador' });

// --- Estrutura da Empresa ---
db.LearningPath.hasMany(db.ServiceLine, { foreignKey: 'id_learning_path' });
db.ServiceLine.belongsTo(db.LearningPath, { foreignKey: 'id_learning_path' });

db.ServiceLine.hasMany(db.Area, { foreignKey: 'id_service_line' });
db.Area.belongsTo(db.ServiceLine, { foreignKey: 'id_service_line' });

db.ServiceLine.belongsTo(db.Utilizador, { foreignKey: 'id_lider', as: 'Lider' });
db.Utilizador.hasMany(db.ServiceLine, { foreignKey: 'id_lider' });

db.Area.hasMany(db.Consultor, { foreignKey: 'id_area' });
db.Consultor.belongsTo(db.Area, { foreignKey: 'id_area' });

// --- Estrutura de Badges ---
db.Area.hasMany(db.Badges, { foreignKey: 'id_area' });
db.Badges.belongsTo(db.Area, { foreignKey: 'id_area' });

db.Nivel.hasMany(db.Badges, { foreignKey: 'id_nivel' });
db.Badges.belongsTo(db.Nivel, { foreignKey: 'id_nivel' });

// --- Submissões e Documentos ---
db.Utilizador.hasMany(db.Submissoes, { foreignKey: 'id_utilizador' });
db.Submissoes.belongsTo(db.Utilizador, { foreignKey: 'id_utilizador' });

db.Badges.hasMany(db.Submissoes, { foreignKey: 'id_badge' });
db.Submissoes.belongsTo(db.Badges, { foreignKey: 'id_badge' });

db.Submissoes.hasMany(db.Documentos, { foreignKey: 'id_submissao' });
db.Documentos.belongsTo(db.Submissoes, { foreignKey: 'id_submissao' });

db.Requisitos.hasMany(db.Documentos, { foreignKey: 'id_requisito' });
db.Documentos.belongsTo(db.Requisitos, { foreignKey: 'id_requisito' });

// --- Objetivos e Registos ---
db.Utilizador.hasMany(db.Objetivos, { foreignKey: 'id_utilizador' });
db.Objetivos.belongsTo(db.Utilizador, { foreignKey: 'id_utilizador' });

db.Badges.hasMany(db.Objetivos, { foreignKey: 'id_badge' });
db.Objetivos.belongsTo(db.Badges, { foreignKey: 'id_badge' });

db.Utilizador.hasMany(db.RegistoBadges, { foreignKey: 'id_utilizador' });
db.RegistoBadges.belongsTo(db.Utilizador, { foreignKey: 'id_utilizador' });

db.Badges.hasMany(db.RegistoBadges, { foreignKey: 'id_badge' });
db.RegistoBadges.belongsTo(db.Badges, { foreignKey: 'id_badge' });

// --- Notificações, Políticas, SLA e Logs ---
db.Utilizador.hasMany(db.Notificacoes, { foreignKey: 'id_utilizador' }); // Utilizador como Emissor
db.Notificacoes.belongsTo(db.Utilizador, { foreignKey: 'id_utilizador' });

db.Utilizador.hasMany(db.PoliticasRgpd, { foreignKey: 'id_utilizador' });
db.PoliticasRgpd.belongsTo(db.Utilizador, { foreignKey: 'id_utilizador' });

db.Utilizador.hasMany(db.Sla, { foreignKey: 'id_utilizador' });
db.Sla.belongsTo(db.Utilizador, { foreignKey: 'id_utilizador' });

// =========================================================================
// 4. RELAÇÕES MUITOS-PARA-MUITOS (N:M) COM TABELAS INTERMÉDIAS
// =========================================================================

// Utilizador <-> Roles
db.Utilizador.belongsToMany(db.Role, { through: db.UtilizadorRoles, foreignKey: 'id_utilizador' });
db.Role.belongsToMany(db.Utilizador, { through: db.UtilizadorRoles, foreignKey: 'id_role' });

// Roles <-> Permissões
db.Role.belongsToMany(db.Permissoes, { through: db.RolePermissoes, foreignKey: 'id_role' });
db.Permissoes.belongsToMany(db.Role, { through: db.RolePermissoes, foreignKey: 'id_permissao' });

// Badges <-> Requisitos
db.Badges.belongsToMany(db.Requisitos, { through: db.RequisitosBadge, foreignKey: 'id_badge' });
db.Requisitos.belongsToMany(db.Badges, { through: db.RequisitosBadge, foreignKey: 'id_requisito' });

// Assinatura <-> Badges
db.Assinatura.belongsToMany(db.Badges, { through: db.BadgesAssinatura, foreignKey: 'id_assinatura' });
db.Badges.belongsToMany(db.Assinatura, { through: db.BadgesAssinatura, foreignKey: 'id_badge' });

// Utilizador <-> Submissões (Tabela Historico)
db.Utilizador.belongsToMany(db.Submissoes, { through: db.Historico, foreignKey: 'id_utilizador' });
db.Submissoes.belongsToMany(db.Utilizador, { through: db.Historico, foreignKey: 'id_submissao' });
db.Submissoes.hasMany(db.Historico, { foreignKey: 'id_submissao' });
db.Historico.belongsTo(db.Submissoes, { foreignKey: 'id_submissao' });
db.Utilizador.hasMany(db.Historico, { foreignKey: 'id_utilizador' });
db.Historico.belongsTo(db.Utilizador, { foreignKey: 'id_utilizador' });

// Notificações <-> Utilizador (Tabela Recetor)
db.Notificacoes.belongsToMany(db.Utilizador, { through: db.Recetor, foreignKey: 'id_notificacao' });
db.Utilizador.belongsToMany(db.Notificacoes, { through: db.Recetor, foreignKey: 'id_utilizador' });


// =========================================================================
// 6. GATILHOS GLOBAIS (SEQUELIZE HOOKS) E INTEGRAÇÃO DO FIREBASE (NON-INVASIVE)
// =========================================================================
const firebaseService = require('../services/firebaseService');

let syncDebounceTimeout = null;
const scheduleSyncNotification = () => {
  if (syncDebounceTimeout) {
    clearTimeout(syncDebounceTimeout);
  }
  // Debounce de 2 segundos para evitar sobrecarga no Firebase se houverem alterações em massa
  syncDebounceTimeout = setTimeout(() => {
    firebaseService.notifySyncAvailable();
  }, 2000);
};

// Lista de hooks de mutação de dados para monitorizar a base de dados
const globalMutationHooks = [
  'afterCreate', 
  'afterUpdate', 
  'afterDestroy', 
  'afterRestore', 
  'afterBulkCreate', 
  'afterBulkUpdate', 
  'afterBulkDestroy'
];

// Registo de hooks globais na instância do Sequelize
globalMutationHooks.forEach(hookName => {
  sequelize.addHook(hookName, (instanceOrOptions) => {
    console.log(`[Sequelize Global Hook] Disparado: ${hookName}. Agendando notificação de Sync...`);
    scheduleSyncNotification();
  });
});


// 5. Exportar a base de dados montada e pronta a usar
module.exports = db;