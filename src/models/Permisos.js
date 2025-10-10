// models/permission.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Permission = sequelize.define(
  'Permission',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_permiso: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    }, // ej: "users:create"
    descripcion_permiso: { type: DataTypes.STRING(255) },
  },
  {
    tableName: 'permissions',
    underscored: true,
    timestamps: false,
  }
);
