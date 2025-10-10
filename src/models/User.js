import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username_user: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    password_user: { type: DataTypes.STRING(255), allowNull: false },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: 'users',
    underscored: true,
    timestamps: false,
  }
);
