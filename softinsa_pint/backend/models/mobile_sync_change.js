const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('MobileSyncChange', {
    change_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    entity: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    record_id: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    id_utilizador: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    operation: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [['insert', 'update', 'delete']]
      }
    },
    changed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    metadata_json: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'mobile_sync_changes',
    timestamps: false,
    indexes: [
      {
        name: 'idx_mobile_sync_changes_cursor',
        fields: ['changed_at', 'change_id']
      },
      {
        name: 'idx_mobile_sync_changes_user_cursor',
        fields: ['id_utilizador', 'changed_at', 'change_id']
      },
      {
        name: 'idx_mobile_sync_changes_entity_record',
        fields: ['entity', 'record_id']
      }
    ]
  });
};
