import { Router } from "express";
import { verificarToken } from "../middleware/auth.middleware.js";
import {
  crearRetroalimentacion,
  listarRetroalimentaciones,
} from "../controllers/retro.controller.js";

const router = Router();

// ✅ Crear retroalimentación para una actividad
router.post("/", verificarToken, crearRetroalimentacion);

// ✅ Listar retroalimentaciones del usuario o aula
router.get("/", verificarToken, listarRetroalimentaciones);

// 👇 IMPORTANTE
export default router;
