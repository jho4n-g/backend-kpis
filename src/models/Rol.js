import { DataTypes } from "sequelize"
import { sequelize } from "../config/database.js"

export const Rol = sequelize.define(
  "roles",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_rol: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    descripcion_rol: {
      type: DataTypes.STRING(255),
    },
    fk_permisos_rol: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "roles",
    timestamps: false,
  }
)
