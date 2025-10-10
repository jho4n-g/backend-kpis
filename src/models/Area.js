// models/area.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
export const Area = sequelize.define(
  'Area',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_area: { type: DataTypes.STRING(80), allowNull: false },
    descripcion_area: { type: DataTypes.STRING(255) },
  },
  { tableName: 'areas', underscored: true, timestamps: false }
);
