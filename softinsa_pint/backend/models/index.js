const sequelize = require("../config/db.config");
const Utilizador = require("./utilizador.model");
const Badges = require("./badges.model");
const RegistoBadges = require("./registo_badges.model");
const Submissoes = require("./submissoes.model");
const Logs = require("./logs.model");
const PoliticasRGPD = require("./politicas_rgpd.model");

// Associações / Relacionamentos de Integridade
// 1. Registo de Badges -> Utilizador e Badges
RegistoBadges.belongsTo(Utilizador, { foreignKey: "id_utilizador" });
RegistoBadges.belongsTo(Badges, { foreignKey: "id_badge" });

// 2. Submissões -> Utilizador e Badges
Submissoes.belongsTo(Utilizador, { foreignKey: "id_utilizador" });
Submissoes.belongsTo(Badges, { foreignKey: "id_badge" });

// 3. Políticas RGPD -> Utilizador (quem alterou)
PoliticasRGPD.belongsTo(Utilizador, { foreignKey: "id_utilizador" });

// 4. Logs -> Badges (quando tabela = 'BADGES')
Logs.belongsTo(Badges, { foreignKey: "id_alvo", as: "badge" });

module.exports = {
  sequelize,
  Utilizador,
  Badges,
  RegistoBadges,
  Submissoes,
  Logs,
  PoliticasRGPD
};
