import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Produccion = sequelize.define(
  'produccion',
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
    presu: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'presupuesto',
    },
    producMen: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'produccion_mensual',
    },
    producAcu: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'produccion_acumulada',
    },
    metaAcuPresu: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'meta_acumulada_presupuesto',
    },
    difProducAcuvsPresAcu: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'diferencia_produccion_acumulada_vs_presupuesto_acumulado',
    },
    meta: { type: DataTypes.DECIMAL(18, 2), defaultValue: 1 },
    cumplMen: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'cumplimiento_mensual',
    },
    cumpAcuPres: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'cumplimientos_acumulado_presupuesto',
    },
  },
  {
    tableName: 'produccion',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['periodo'] },
      { fields: ['created_at'] },
    ],
  }
);
