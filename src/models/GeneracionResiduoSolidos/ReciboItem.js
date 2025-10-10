// models/ReciboItem.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

export const ReciboItem = sequelize.define(
  'recibo_item',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    recibo_id: { type: DataTypes.INTEGER, allowNull: false },
    producto_id: { type: DataTypes.INTEGER, allowNull: false },
    cantidad: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    precio_unitario: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    unidadMedida: { type: DataTypes.STRING(120), allowNull: false },
    total_linea: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  },
  {
    tableName: 'recibo_item',
    timestamps: false,
    indexes: [
      // Evita duplicar el mismo producto en el mismo recibo (opcional)
      { unique: false, fields: ['recibo_id', 'producto_id'] },
    ],
  }
);
