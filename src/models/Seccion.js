// models/section.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
export const Section = sequelize.define(
  'Section',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_seccion: { type: DataTypes.STRING(80), allowNull: false },
    descripcion_seccion: { type: DataTypes.STRING(255) },
    fk_area: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'areas', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
  },
  { tableName: 'sections', underscored: true, timestamps: false }
);
