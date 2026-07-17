const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('SyncRequisitoBadgeDeleted', {
    id_sync_delete: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_badge: { type: DataTypes.INTEGER, allowNull: false },
    id_requisito: { type: DataTypes.INTEGER, allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: false }
  }, {
    tableName: 'sync_requisitos_badges_deleted',
    timestamps: false
  });
};
