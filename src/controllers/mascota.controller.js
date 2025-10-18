import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";

// ✅ Obtener o crear mascota del usuario
export const obtenerMascota = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id_usuario = decoded.id;

    const result = await pool.query("SELECT * FROM mascotas WHERE id_usuario = $1", [id_usuario]);

    if (result.rows.length === 0) {
      const nueva = await pool.query(
        `INSERT INTO mascotas (id_usuario, nombre, imagen_url)
         VALUES ($1, 'Lumi', '/img/mascotas/lumi1.gif') RETURNING *`,
        [id_usuario]
      );
      return res.json(nueva.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener mascota", error: err.message });
  }
};

// ✅ Subir de nivel tras completar módulo
export const subirNivel = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id_usuario = decoded.id;

    await pool.query(
      `UPDATE mascotas
       SET nivel = nivel + 1, experiencia = experiencia + 100, actualizado_en = NOW()
       WHERE id_usuario = $1`,
      [id_usuario]
    );

    res.json({ msg: "🎉 ¡Tu mascota ha subido de nivel!" });
  } catch (err) {
    res.status(500).json({ msg: "Error al subir nivel", error: err.message });
  }
};
