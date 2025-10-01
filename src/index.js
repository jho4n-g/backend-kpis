import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, sequelize } from './config/database.js'; // Asegúrate de exportar sequelize
import {
  startGestionScheduler,
  stopGestionScheduler,
} from './jobs/gestionJobs.js';

import userRoutes from './routes/user.routes.js';
import personRoutes from './routes/person.routes.js';
import rolRoutes from './routes/rol.routes.js';
import permisosRoutes from './routes/permisos.routes.js';
import seccionRoutes from './routes/seccion.routes.js';
import areaRoutes from './routes/area.routes.js';
import utilitesRoutes from './routes/uilities.routes.js';
import IngresosVentasTotalesRoutes from './routes/IngresosVentasTotales.routes.js';
import getionRoutes from './routes/gestion.route.js';
import MesRoutes from './routes/mes.routes.js';
// Importar modelos y asociaciones
import './models/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad
app.use(helmet());
app.use(cors());

// Middlewares de parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente 🚀',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/users', userRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/permisos', permisosRoutes);
app.use('/api/secciones', seccionRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/utlities', utilitesRoutes);
app.use('/api/ingresosVentasTotales', IngresosVentasTotalesRoutes);
app.use('/api/gestion', getionRoutes);
app.use('/api/mes', MesRoutes);

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error:
      process.env.NODE_ENV === 'development' ? err.message : 'Error interno',
  });
});

let server;

async function startServer() {
  try {
    await connectDB();
    console.log('✅ Base de datos conectada correctamente');

    // OJO: alter true es útil en dev, peligroso en prod
    await sequelize.sync({ alter: true });
    console.log('✅ Tablas sincronizadas correctamente');

    server = app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
      console.log(`📊 Health check: http://localhost:${PORT}/`);

      if (process.env.CRON_LEADER === 'true') {
        startGestionScheduler();
        console.log('[CRON] Iniciado (líder activo)');
      } else {
        console.log('[CRON] No iniciado (no líder)');
      }
    });

    // opcional: manejar errores del server http
    server.on('error', (err) => {
      console.error('❌ Error del servidor HTTP:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Apagado limpio
process.on('SIGINT', async () => {
  console.log('🛑 SIGINT recibido. Cerrando...');
  try {
    stopGestionScheduler();
    if (server) await new Promise((res) => server.close(res));
    await sequelize.close(); // cierra pool SQL
    if (mongoose?.connection?.close) {
      // si usas Mongo
      await mongoose.connection.close();
    }
    process.exit(0);
  } catch (e) {
    console.error('❌ Error al cerrar:', e);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM recibido. Cerrando...');
  try {
    stopGestionScheduler();
    if (server) await new Promise((res) => server.close(res));
    await sequelize.close();
    if (mongoose?.connection?.close) {
      await mongoose.connection.close();
    }
    process.exit(0);
  } catch (e) {
    console.error('❌ Error al cerrar:', e);
    process.exit(1);
  }
});

startServer();
