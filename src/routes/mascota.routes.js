import { Router } from "express";
import { verificarToken } from "../middleware/auth.middleware.js";
import { obtenerMascota, subirNivel } from "../controllers/mascota.controller.js";

const router = Router();
router.get("/", verificarToken, obtenerMascota);
router.post("/subir-nivel", verificarToken, subirNivel);
export default router;
