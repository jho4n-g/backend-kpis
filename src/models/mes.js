import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Gestion } from './gestion.js';

export const Mes = sequelize.define(
  'mes',
  {
    id_mes: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    numero: { type: DataTypes.INTEGER, allowNull: false }, // 1..12 (abr=1)
    periodo: { type: DataTypes.DATEONLY, allowNull: false },
    fk_gestion_mes: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: 'mes',
    underscored: true,
    indexes: [{ unique: true, fields: ['fk_gestion_mes', 'numero'] }],
    validate: {
      numeroEnRango() {
        if (this.numero < 1 || this.numero > 12) {
          throw new Error(
            'numero debe estar entre 1 y 12 (abril=1 … marzo=12)'
          );
        }
      },
    },
  }
);
