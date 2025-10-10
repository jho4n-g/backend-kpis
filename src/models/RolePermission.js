// models/role_permission.js (tabla puente Role <-> Permission)
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const RolePermission = sequelize.define(
  'RolePermission',
  {
    fk_rol: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'roles', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    fk_permiso: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'permissions', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    effect: { type: DataTypes.ENUM('allow', 'deny'), defaultValue: 'allow' }, // opcional
  },
  {
    tableName: 'roles_permisos',
    underscored: true,
    timestamps: false,
    indexes: [{ unique: true, fields: ['fk_rol', 'fk_permiso'] }],
  }
);
