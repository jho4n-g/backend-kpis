import { DataTypes } from "sequelize"
import { sequelize } from "../config/database.js"

export const Permisos = sequelize.define(
  "permisos",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_permiss: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    descripcion_permiss: {
      type: DataTypes.STRING(255),
    },
  },
  {
    tableName: "permisos",
    timestamps: false,
  }
)
