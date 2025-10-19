import { Router } from "express";
import { verificarToken } from "../middleware/auth.middleware.js";
import {
  crearActividad,
  listarActividades,
  editarActividad,
  eliminarActividad,
  progresoPorActividad,
} from "../controllers/actividad.controller.js";

const router = Router();

router.post("/", verificarToken, crearActividad);
router.get("/:id_aula", verificarToken, listarActividades);
router.put("/:id", verificarToken, editarActividad);
router.delete("/:id", verificarToken, eliminarActividad);
router.get("/:id_aula/progreso", verificarToken, progresoPorActividad);

export default router;
