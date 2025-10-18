import { Router } from "express";
import { verificarToken } from "../middleware/auth.middleware.js";
import {
  obtenerNiveles,
  registrarIntento,
  obtenerProgresoMatematicas,
} from "../controllers/matematicas.controller.js";

const router = Router();

router.get("/niveles", verificarToken, obtenerNiveles);
router.post("/intento", verificarToken, registrarIntento);
router.get("/progreso", verificarToken, obtenerProgresoMatematicas);

export default router;
