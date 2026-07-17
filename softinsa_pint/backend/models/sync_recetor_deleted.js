const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('SyncRecetorDeleted', {
    id_sync_delete: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_notificacao: { type: DataTypes.INTEGER, allowNull: false },
    id_utilizador: { type: DataTypes.INTEGER, allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: false }
  }, {
    tableName: 'sync_recetores_deleted',
    timestamps: false
  });
};
