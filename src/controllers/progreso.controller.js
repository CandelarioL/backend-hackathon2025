import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";

// Registrar progreso
export const registrarProgreso = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id_usuario = decoded.id;

    const { id_actividad, puntaje, completado, tiempo_respuesta } = req.body;

    await pool.query(
      `INSERT INTO progreso (id_usuario, id_actividad, puntaje, completado, tiempo_respuesta)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id_usuario, id_actividad) DO UPDATE
       SET puntaje = EXCLUDED.puntaje,
           completado = EXCLUDED.completado,
           tiempo_respuesta = EXCLUDED.tiempo_respuesta,
           fecha = CURRENT_TIMESTAMP`,
      [id_usuario, id_actividad, puntaje, completado, tiempo_respuesta]
    );

    res.json({ msg: "✅ Progreso registrado correctamente." });
  } catch (err) {
    console.error("❌ Error al registrar progreso:", err);
    res.status(500).json({ msg: "Error al registrar progreso.", error: err.message });
  }
};

// Listar progreso del usuario
export const listarProgresoUsuario = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id_usuario = decoded.id;

    const result = await pool.query(
      `SELECT p.*, a.titulo
       FROM progreso p
       JOIN actividades a ON a.id = p.id_actividad
       WHERE p.id_usuario = $1
       ORDER BY p.fecha DESC`,
      [id_usuario]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener progreso:", err);
    res.status(500).json({ msg: "Error al obtener progreso.", error: err.message });
  }
};
