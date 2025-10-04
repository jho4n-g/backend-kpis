import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const PrecioUnitario = sequelize.define(
  'precio_unitario',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    mes_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: 'mes', key: 'id_mes' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    periodo: { type: DataTypes.DATEONLY },
    presMen: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'presupuesto_mensual',
    },
    precProm: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'precio_promedio',
    },
    regionCentro: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'region_centro',
    },
    regionEste: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'region_este',
    },
    regionOeste: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'region_oeste',
    },
    fabrica: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'fabrica',
    },
    exportacion: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'exportacion',
    },
    meta: { type: DataTypes.DECIMAL(18, 2), defaultValue: 1 },
    cumplimientoMensual: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'cumplimiento_mensual',
    },
  },
  {
    tableName: 'precio_unitario',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['periodo'] },
      { fields: ['created_at'] },
    ],
  }
);
