import { Router } from "express";
import { verificarToken } from "../middleware/auth.middleware.js";
import {
  registrarProgreso,
  listarProgresoUsuario,
} from "../controllers/progreso.controller.js";

const router = Router();

// ✅ Registrar progreso de una actividad
router.post("/", verificarToken, registrarProgreso);

// ✅ Listar progreso del usuario logueado
router.get("/", verificarToken, listarProgresoUsuario);

// 👇 IMPORTANTE
export default router;
