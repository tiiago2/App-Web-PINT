const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('MobileRefreshToken', {
    id_mobile_refresh_token: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_utilizador: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'utilizador',
        key: 'id_utilizador'
      }
    },
    device_id: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    token_hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    replaced_by_token_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'mobile_refresh_tokens',
        key: 'id_mobile_refresh_token'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'mobile_refresh_tokens',
    timestamps: false,
    indexes: [
      {
        name: 'uq_mobile_refresh_tokens_token_hash',
        unique: true,
        fields: ['token_hash']
      },
      {
        name: 'idx_mobile_refresh_tokens_user_device',
        fields: ['id_utilizador', 'device_id', 'revoked_at']
      },
      {
        name: 'idx_mobile_refresh_tokens_expires_at',
        fields: ['expires_at']
      },
      {
        name: 'idx_mobile_refresh_tokens_replaced_by',
        fields: ['replaced_by_token_id']
      }
    ]
  });
};
