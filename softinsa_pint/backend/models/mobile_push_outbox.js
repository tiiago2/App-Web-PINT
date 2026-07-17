const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => sequelize.define('MobilePushOutbox', {
  id_mobile_push: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_utilizador: { type: DataTypes.INTEGER, allowNull: false },
  event_type: {
    type: DataTypes.STRING(32),
    allowNull: false,
    validate: { isIn: [['data_changed']] }
  },
  entity: { type: DataTypes.STRING(64), allowNull: false },
  payload_json: { type: DataTypes.JSONB, allowNull: false },
  status: {
    type: DataTypes.STRING(32),
    allowNull: false,
    validate: {
      isIn: [[
        'pending',
        'processing',
        'sent',
        'retryable_error',
        'permanent_error'
      ]]
    }
  },
  attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 }
  },
  next_attempt_at: { type: DataTypes.DATE, allowNull: false },
  last_error_code: { type: DataTypes.STRING(128), allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false },
  sent_at: { type: DataTypes.DATE, allowNull: true },
  updated_at: { type: DataTypes.DATE, allowNull: false }
}, {
  tableName: 'mobile_push_outbox',
  timestamps: false,
  indexes: [
    {
      name: 'idx_mobile_push_outbox_due',
      fields: ['status', 'next_attempt_at']
    },
    {
      name: 'idx_mobile_push_outbox_user',
      fields: ['id_utilizador']
    },
    {
      name: 'uq_mobile_push_outbox_user_pending_event',
      unique: true,
      fields: ['id_utilizador', 'event_type'],
      where: { status: { [Op.in]: ['pending', 'retryable_error'] } }
    }
  ]
});
