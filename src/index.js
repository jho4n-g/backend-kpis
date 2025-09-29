import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, sequelize } from "./config/database.js"; // Asegúrate de exportar sequelize

import userRoutes from "./routes/user.routes.js";
import personRoutes from "./routes/person.routes.js";
import rolRoutes from "./routes/rol.routes.js";
import permisosRoutes from "./routes/permisos.routes.js";
import seccionRoutes from "./routes/seccion.routes.js";
import areaRoutes from "./routes/area.routes.js";

// Importar modelos y asociaciones
import "./models/index.js";

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
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Servidor funcionando correctamente 🚀",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/users", userRoutes);
app.use("/api/persons", personRoutes);
app.use("/api/roles", rolRoutes);
app.use("/api/permisos", permisosRoutes);
app.use("/api/secciones", seccionRoutes);
app.use("/api/areas", areaRoutes);

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
    error: process.env.NODE_ENV === "development" ? err.message : "Error interno",
  });
});



// Iniciar servidor y sincronizar tablas
async function startServer() {
  try {
    await connectDB();
    console.log("✅ Base de datos conectada correctamente");

    await sequelize.sync({ alter: true }); // sincroniza y crea/actualiza tablas
    console.log("✅ Tablas sincronizadas correctamente");

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
      console.log(`📊 Health check: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
    process.exit(1);
  }
}

startServer();
