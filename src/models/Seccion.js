import { DataTypes } from "sequelize"
import { sequelize } from "../config/database.js"

export const Seccion = sequelize.define(
  "secciones",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_seccion: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    descripcion_seccion: {
      type: DataTypes.STRING(255),
    },
    fk_area: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "secciones",
    timestamps: false,
  }
)
