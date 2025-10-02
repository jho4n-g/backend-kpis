import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const VentasTotales = sequelize.define(
  'ventas_totales',
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
    PresMen: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'presupuesto_mensual',
    },
    VentMen: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'venta_mensual',
    },
    DifVentaMenvsPreMen: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'diferencia_venta_mensual_vs_presupuesto',
    },
    VenAcu: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'venta_acumulada',
    },
    PresAcu: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'presupuesto_acumulado',
    },
    DiffVentaAcuvsPresAcu: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'diferecia_venta_acumulada_vs_presupuesto_acumulado',
    },
    meta: { type: DataTypes.DECIMAL(18, 2), defaultValue: 1 },
    CumMen: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'cumplimiento_mensual',
    },
    CumAcu: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'cumplimiento_acumulado',
    },
  },
  {
    tableName: 'ventas_totales',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['periodo'] },
      { fields: ['created_at'] },
    ],
  }
);
