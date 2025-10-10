// models/person_role.js (tabla puente Person <-> Role) — si tu Person puede tener varios roles
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const PersonRole = sequelize.define(
  'PersonRole',
  {
    fk_person: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'persons', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    fk_rol: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'roles', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  },
  {
    tableName: 'person_roles',
    underscored: true,
    timestamps: false,
    indexes: [{ unique: true, fields: ['fk_person', 'fk_rol'] }],
  }
);
