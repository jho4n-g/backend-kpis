import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Utilidades = sequelize.define(
  'utilities',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    periodo: { type: DataTypes.DATEONLY },
    mensualidad_mensual: { type: DataTypes.DECIMAL(10, 2) },
    meta_mensual: { type: DataTypes.DECIMAL(10, 2) },
    utilidades_acumuladas: { type: DataTypes.DECIMAL(10, 2) },
    meta_acumulada: { type: DataTypes.DECIMAL(10, 2) },
    meta: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.1 }, // en porcentaje
    cumplimento_mensual: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // en porcentaje
    cumplimiento_acumulado: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // en porcentaje
  },
  {
    freezeTableName: true,
    tableName: 'utilities',
    timestamps: false,
  }
);
