import { DataTypes } from "sequelize"
import { sequelize } from "../config/database.js"

export const Area = sequelize.define(
  "areas",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_area: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    descripcion_area: {
      type: DataTypes.STRING(255),
    },
  },
  {
    tableName: "areas",
    timestamps: false,
  }
)
