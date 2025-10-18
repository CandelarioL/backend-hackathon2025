import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";

// ✅ Crear retroalimentación de una actividad
export const crearRetroalimentacion = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id_usuario = decoded.id;

    const { id_actividad, mensaje, tipo } = req.body;

    if (!id_actividad || !mensaje) {
      return res.status(400).json({ msg: "Faltan datos requeridos." });
    }

    await pool.query(
      `INSERT INTO retroalimentaciones (id_actividad, id_usuario, mensaje, tipo)
       VALUES ($1, $2, $3, $4)`,
      [id_actividad, id_usuario, mensaje, tipo || "general"]
    );

    res.json({ msg: "✅ Retroalimentación registrada correctamente." });
  } catch (err) {
    console.error("❌ Error al crear retroalimentación:", err);
    res.status(500).json({ msg: "Error al crear retroalimentación.", error: err.message });
  }
};

// ✅ Listar retroalimentaciones por usuario
export const listarRetroalimentaciones = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id_usuario = decoded.id;

    const result = await pool.query(
      `SELECT r.*, a.titulo AS actividad
       FROM retroalimentaciones r
       JOIN actividades a ON a.id = r.id_actividad
       WHERE r.id_usuario = $1
       ORDER BY r.id DESC`,
      [id_usuario]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al listar retroalimentaciones:", err);
    res.status(500).json({ msg: "Error al listar retroalimentaciones.", error: err.message });
  }
};
