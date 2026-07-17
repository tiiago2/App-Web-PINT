const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('MobileOperation', {
  id_mobile_operation: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_utilizador: { type: DataTypes.INTEGER, allowNull: false },
  client_operation_id: { type: DataTypes.STRING(128), allowNull: false },
  operation_type: { type: DataTypes.STRING(64), allowNull: false },
  request_hash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    validate: { is: /^[0-9a-f]{64}$/ }
  },
  status: {
    type: DataTypes.STRING(32),
    allowNull: false,
    validate: {
      isIn: [['processing', 'completed', 'failed_retryable', 'failed_permanent']]
    }
  },
  http_status: {
    type: DataTypes.SMALLINT,
    allowNull: true,
    validate: { min: 100, max: 599 }
  },
  response_json: { type: DataTypes.JSONB, allowNull: true },
  error_code: { type: DataTypes.STRING(128), allowNull: true },
  started_at: { type: DataTypes.DATE, allowNull: false },
  completed_at: { type: DataTypes.DATE, allowNull: true },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  created_at: { type: DataTypes.DATE, allowNull: false },
  updated_at: { type: DataTypes.DATE, allowNull: false }
}, {
  tableName: 'mobile_operations',
  timestamps: false,
  indexes: [
    {
      unique: true,
      name: 'uq_mobile_operations_user_client_operation',
      fields: ['id_utilizador', 'client_operation_id']
    },
    { name: 'idx_mobile_operations_status', fields: ['status'] },
    { name: 'idx_mobile_operations_expires_at', fields: ['expires_at'] }
  ]
});
