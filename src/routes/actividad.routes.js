import { Router } from "express";
import { verificarToken } from "../middleware/auth.middleware.js";
import {
  crearActividad,
  listarActividades,
} from "../controllers/actividad.controller.js";

const router = Router();

// ✅ Crear una nueva actividad (solo maestro)
router.post("/", verificarToken, crearActividad);

// ✅ Listar actividades (por tipo o aula)
router.get("/", verificarToken, listarActividades);

// 👇 ESTA LÍNEA ES FUNDAMENTAL
export default router;
