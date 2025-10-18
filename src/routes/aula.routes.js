import { Router } from "express";
import { verificarToken } from "../middleware/auth.middleware.js";
import {
  crearAulaController,
  listarAulas,
  unirAulaController,
  listarAlumnosPorAula,
  eliminarAula, // ✅ Nuevo import
} from "../controllers/aula.controller.js";

const router = Router();

// ==================================================
// 🧑‍🏫 Crear aula (solo maestros)
// ==================================================
router.post("/crear", verificarToken, crearAulaController);

// ==================================================
// 📋 Listar todas las aulas (maestro o alumno)
// ==================================================
router.get("/", verificarToken, listarAulas);

// ==================================================
// 🎓 Unirse a un aula (solo alumnos)
// ==================================================
router.post("/unirse", verificarToken, unirAulaController);

// ==================================================
// 👥 Listar alumnos de un aula específica (solo maestro)
// ==================================================
router.get("/:id/alumnos", verificarToken, listarAlumnosPorAula);

// ==================================================
// 🗑️ Eliminar aula (solo maestro)
// ==================================================
router.delete("/:id", verificarToken, eliminarAula);

export default router;
