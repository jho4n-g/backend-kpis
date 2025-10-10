// models/Recibo.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

export const Recibo = sequelize.define(
  'recibo',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nro_recibo: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    nombre_cliente: { type: DataTypes.STRING(150), allowNull: false },
    descripcion: { type: DataTypes.STRING(150) },
    total_recibo: { type: DataTypes.DECIMAL(14, 2), allowNull: true }, // opcional
  },
  { tableName: 'recibo', timestamps: false }
);
