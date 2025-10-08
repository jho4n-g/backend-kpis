import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Calidad = sequelize.define(
  'calidad',
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
    produccionMensual: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'produccion_mensual',
    },
    presupusto: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'presupuesto',
    },
    produccionPrimeraMensual: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'produccion_primera_mensual',
    },
    produccionSegundaMensual: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'produccion_segunda_mensual',
    },
    produccionTerceraMensual: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'produccion_tercera_mensual',
    },
    produccionCascoteMensual: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'produccion_cascote_mensual',
    },
    primeraCalidad: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'primera_calidad',
    },
    segundaCalidad: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'segunda_calidad',
    },
    terceraCalidad: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'tercera_calidad',
    },
    cascote: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
      field: 'cascote',
    },
    produccionAcumulada: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'produccion_acumulada_mCuadrados',
    },
    primeraCalidadAcumulada: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'primera_calidad_acumulda',
    },
    cascoteCalidadAcumulado: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'cascote_calidad_acumulada',
    },
    primeraAcumulada: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'primera_acumulada',
    },
    cascoteAcumulado: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
      field: 'cascote_acumulada',
    },
    metaPrimera: {
      type: DataTypes.DECIMAL(6, 4),
      allowNull: false,
      field: 'meta_primera',
      defaultValue: 1.0,
      validate: { min: 0, max: 1 },
    },
    metaCascote: {
      type: DataTypes.DECIMAL(6, 4),
      allowNull: false,
      field: 'meta_cascote',
      defaultValue: 0.012,
      validate: { min: 0, max: 1 },
    },
  },
  {
    tableName: 'calidad',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['periodo'] },
      { fields: ['created_at'] },
    ],
  }
);
