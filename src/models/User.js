import { DataTypes } from "sequelize"
import { sequelize } from "../config/database.js"
import bcrypt from "bcrypt"

export const User = sequelize.define(
  "users",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username_user: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
      },
    },
    password_user: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 255],
      },
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "users",
    timestamps: false,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_user) {
          const rounds = Number.parseInt(process.env.BCRYPT_ROUNDS) || 12
          user.password_user = await bcrypt.hash(user.password_user, rounds)
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password_user")) {
          const rounds = Number.parseInt(process.env.BCRYPT_ROUNDS) || 12
          user.password_user = await bcrypt.hash(user.password_user, rounds)
        }
      },
    },
  }
)

// Método para verificar contraseña
User.prototype.verificarContrasena = async function (password) {
  return await bcrypt.compare(password, this.password_user)
}

// Método toJSON para ocultar campos sensibles
User.prototype.toJSON = function () {
  const values = { ...this.get() }
  delete values.password_user
  return values
}
