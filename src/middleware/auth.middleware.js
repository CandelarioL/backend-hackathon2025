import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verificarToken = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token)
    return res.status(401).json({ msg: "Acceso denegado. Token requerido." });

  try {
    const tokenLimpio = token.replace("Bearer ", "");
    const verificado = jwt.verify(tokenLimpio, process.env.JWT_SECRET);
    req.user = verificado;
    next();
  } catch (error) {
    res.status(401).json({ msg: "Token inválido o expirado." });
  }
};
