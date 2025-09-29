import { DataTypes } from "sequelize"
import { sequelize } from "../config/database.js"

export const Person = sequelize.define(
  "persons",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_person: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    apellido_person: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    fk_rol_person: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fk_user_person: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status_person: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    date_create: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    fk_seccion_person: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "persons",
    timestamps: false,
  }
)
