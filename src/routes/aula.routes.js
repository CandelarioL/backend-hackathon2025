import { Router } from "express";
import { verificarToken } from "../middleware/auth.middleware.js";
import {
  crearAulaController,
  listarAulas,
  unirAulaController,
  listarAlumnosPorAula,
  eliminarAula,
} from "../controllers/aula.controller.js";

import {
  crearActividad,
  listarActividades,
  editarActividad,
  eliminarActividad,
  progresoPorActividad,
  listarActividadesPorAula,
  registrarProgreso,
  obtenerActividadPorId, // ✅ Nueva función
} from "../controllers/actividad.controller.js";

const router = Router();

// ==================================================
// 🧑‍🏫 AULAS (solo maestros y alumnos)
// ==================================================

// 📘 Crear aula (solo maestros)
router.post("/crear", verificarToken, crearAulaController);

// 📋 Listar todas las aulas (maestro o alumno)
router.get("/", verificarToken, listarAulas);

// 🎓 Unirse a un aula (solo alumnos)
router.post("/unirse", verificarToken, unirAulaController);

// 👥 Listar alumnos de un aula específica (solo maestro)
router.get("/:id/alumnos", verificarToken, listarAlumnosPorAula);

// 🗑️ Eliminar aula (solo maestro)
router.delete("/:id", verificarToken, eliminarAula);

// ==================================================
// 🧩 ACTIVIDADES (solo maestros y alumnos)
// ==================================================

// 📘 Crear nueva actividad (solo maestro)
router.post("/:id/actividades", verificarToken, crearActividad);

// 📋 Listar actividades de un aula (para maestro y alumno)
router.get("/:id/actividades", verificarToken, listarActividades);

// ✏️ Editar actividad (solo maestro)
router.put("/actividades/:id", verificarToken, editarActividad);

// 🗑️ Eliminar actividad (solo maestro)
router.delete("/actividades/:id", verificarToken, eliminarActividad);

// 📊 Ver progreso general de los alumnos (solo maestro)
router.get("/:id/progreso", verificarToken, progresoPorActividad);

// 🎯 Listar actividades disponibles para el alumno
router.get("/:id/actividades/listar", verificarToken, listarActividadesPorAula);

// 💾 Registrar progreso del alumno en una actividad
router.post("/:id/actividades/:idActividad/progreso", verificarToken, registrarProgreso);

// 🔹 Obtener detalle de una actividad (para mostrarla al alumno)
router.get("/actividades/:id", verificarToken, obtenerActividadPorId);

export default router;
