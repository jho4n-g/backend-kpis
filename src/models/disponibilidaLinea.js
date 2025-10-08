import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Disponibilidad = sequelize.define(
  'disponibilidad',
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
    nroHorasProactivasPlanificadas: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'nro_horas_proactiva_planificadas',
    },
    nroHorasParadasLineaB: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'nro_horas_paradas_linea_b',
    },
    nroHorasParadasLineaC: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'nro_horas_paradas_linea_c',
    },
    nroHorasParadasLineaD: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'nro_horas_paradas_linea_d',
    },
    disponibilidadLineaB: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'disponibilidad_linea_b',
    },
    disponibilidadLineaC: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'disponibilidad_linea_c',
    },
    disponibilidadLineaD: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'disponibilidad_linea_d',
    },
    meta: { type: DataTypes.DECIMAL(18, 2), defaultValue: 1 },
  },
  {
    tableName: 'disponibilidad',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['periodo'] },
      { fields: ['created_at'] },
    ],
  }
);
