const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Def_notificacao', {
    id_definicao: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    titulo_def_not: { type: DataTypes.TEXT, allowNull: false },
    estado: {type: DataTypes.BOOLEAN, allowNull: false},
    last_update_def: {type: DataTypes.DATE, allowNull: false}
  }, { tableName: 'defs_notificacao', timestamps: false });
};