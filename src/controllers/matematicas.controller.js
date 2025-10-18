import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";

// ==============================
// 🎯 OBTENER NIVELES DISPONIBLES
// ==============================
export const obtenerNiveles = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM niveles_matematicas ORDER BY nivel ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener niveles:", err);
    res.status(500).json({ msg: "Error al obtener niveles." });
  }
};

// ==============================
// 🧠 REGISTRAR RESULTADO DEL NIVEL
// ==============================
export const registrarIntento = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id_usuario = decoded.id;

    const { id_nivel, puntaje, tiempo_usado, completado } = req.body;

    // Guardar intento
    const retro = completado
      ? "Excelente trabajo 🎉"
      : "Sigue intentando, puedes mejorar 💪";

    await pool.query(
      `INSERT INTO intentos_matematicas (id_usuario, id_nivel, puntaje, tiempo_usado, completado, retroalimentacion)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id_usuario, id_nivel, puntaje, tiempo_usado, completado, retro]
    );

    // Actualizar experiencia de la mascota
    if (completado) {
      await pool.query(
        `UPDATE mascotas 
         SET experiencia = experiencia + 20, 
             nivel = nivel + CASE WHEN experiencia >= 100 THEN 1 ELSE 0 END,
             actualizado_en = CURRENT_TIMESTAMP
         WHERE id_usuario = $1`,
        [id_usuario]
      );
    }

    res.json({ msg: "Progreso guardado ✅", retro });
  } catch (err) {
    console.error("❌ Error al registrar intento:", err);
    res.status(500).json({ msg: "Error al registrar intento." });
  }
};

// ==============================
// 📊 CONSULTAR PROGRESO DE USUARIO
// ==============================
export const obtenerProgresoMatematicas = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id_usuario = decoded.id;

    const result = await pool.query(
      `SELECT n.nombre, n.nivel, i.puntaje, i.completado, i.retroalimentacion, i.fecha
       FROM intentos_matematicas i
       JOIN niveles_matematicas n ON i.id_nivel = n.id
       WHERE i.id_usuario = $1
       ORDER BY n.nivel ASC`,
      [id_usuario]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener progreso:", err);
    res.status(500).json({ msg: "Error al obtener progreso." });
  }
};
