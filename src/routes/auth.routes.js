import { Router } from "express";
import {
  register,
  login,
  perfil,
  solicitarReset,
  verificarTokenReset,
  cambiarPassword,
} from "../controllers/auth.controller.js";
import { verificarToken } from "../middleware/auth.middleware.js";

const router = Router();

// 🔹 Rutas de autenticación básica
router.post("/register", register);
router.post("/login", login);
router.get("/perfil", verificarToken, perfil);

// 🔹 Rutas para recuperación de contraseña
router.post("/solicitar-reset", solicitarReset);
router.get("/verificar-reset/:token", verificarTokenReset);
router.post("/cambiar-password", cambiarPassword);

export default router;
