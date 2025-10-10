// models/Producto.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

export const Producto = sequelize.define(
  'producto',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  },
  { tableName: 'producto', timestamps: false }
);
