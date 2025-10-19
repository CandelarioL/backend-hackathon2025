import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import aulaRoutes from "./routes/aula.routes.js";
import actividadRoutes from "./routes/actividad.routes.js";
import mascotaRoutes from "./routes/mascota.routes.js";
import progresoRoutes from "./routes/progreso.routes.js";
import retroRoutes from "./routes/retro.routes.js";
import matematicasRoutes from "./routes/matematicas.routes.js";
import { pool } from "./config/db.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Rutas principales
app.use("/api/auth", authRoutes);

app.use("/api/aulas", aulaRoutes);

app.use("/api/actividades", actividadRoutes);
app.use("/api/mascotas", mascotaRoutes);
app.use("/api/progreso", progresoRoutes);
app.use("/api/retro", retroRoutes);

app.use("/api/matematicas", matematicasRoutes);


// Ruta base de prueba
app.get("/", (req, res) => {
  res.send("✅ API funcionando correctamente");
});

// Ruta de prueba de conexión
app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ ok: true, time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));




