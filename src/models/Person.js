// models/person.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
export const Person = sequelize.define(
  'Person',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_person: { type: DataTypes.STRING(80), allowNull: false },
    apellido_person: { type: DataTypes.STRING(80), allowNull: false },
    status_person: { type: DataTypes.BOOLEAN, defaultValue: true },

    date_create: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },

    fk_user_person: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // 1-1 con users
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    fk_section_person: {
      type: DataTypes.INTEGER,
      allowNull: true, // puede ser null si no está asignada
      references: { model: 'sections', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
  },
  { tableName: 'persons', underscored: true, timestamps: false }
);
