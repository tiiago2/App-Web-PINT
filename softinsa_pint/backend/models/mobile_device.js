const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('MobileDevice', {
    id_mobile_device: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_utilizador: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    device_id: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    fcm_token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    platform: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
    tableName: 'mobile_devices',
    timestamps: false,
    indexes: [
      {
        name: 'uq_mobile_devices_user_device',
        unique: true,
        fields: ['id_utilizador', 'device_id']
      },
      {
        name: 'idx_mobile_devices_user_active',
        fields: ['id_utilizador', 'ativo']
      },
      {
        name: 'idx_mobile_devices_fcm_token',
        fields: ['fcm_token']
      },
      {
        name: 'idx_mobile_devices_device_id',
        fields: ['device_id']
      }
    ]
  });
};
