// config/database.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: isProd
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {}, // ⬅️ sin SSL en local
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
});

export async function connectDB() {
  await sequelize.authenticate();
  console.log('✅ Conectado a PostgreSQL');
}
