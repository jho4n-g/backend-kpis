import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
export const Role = sequelize.define(
  'Role',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_rol: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: true,
    },
    descripcion_rol: { type: DataTypes.STRING(255) },
  },
  { tableName: 'roles', underscored: true, timestamps: false }
);
