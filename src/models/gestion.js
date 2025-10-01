// models/gestion.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Gestion = sequelize.define(
  'gestion',
  {
    id_gestion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    startYear: { type: DataTypes.INTEGER, allowNull: false },
    endYear: { type: DataTypes.INTEGER, allowNull: false },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    label: { type: DataTypes.STRING, unique: true, allowNull: false },
    is_archived: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: 'gestion',
    underscored: true,
  }
);
