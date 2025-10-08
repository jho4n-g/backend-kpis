import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const IndicePolvoAtomizado = sequelize.define(
  'indice_polvo_atomizado',
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
    produccion: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      field: 'produccion',
    },
    consumoMensualTN: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'consumo_mensual_tn',
    },

    ratioConsumo: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'ratio_consumo_kgr_sobre_m2',
    },
    meta: { type: DataTypes.DECIMAL(18, 2), defaultValue: 1 },
    cumplimientoMensual: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'cumplimiento_mensual',
    },
    produccionAcumulada: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'produccion_acumulada',
    },
    consumoAcumulado: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'consumo_acumulado',
    },
    ratioConsumoAcumulado: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'ratio_consumo_acumulado',
    },
    cumplimientoAcumulado: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'cumplimiento_acumulado',
    },
    metaAcumulada: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'meta_acumulada',
    },
  },
  {
    tableName: 'indice_polvo_atomizado',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['periodo'] },
      { fields: ['created_at'] },
    ],
  }
);
