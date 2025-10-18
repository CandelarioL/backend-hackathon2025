import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";

// ✅ Crear una nueva actividad o juego
export const crearActividad = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id_usuario = decoded.id;

    const { titulo, descripcion, tipo, nivel, contenido, retroalimentacion, id_aula } = req.body;

    const result = await pool.query(
      `INSERT INTO actividades (titulo, descripcion, tipo, nivel, contenido, retroalimentacion, id_aula, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [titulo, descripcion, tipo, nivel, contenido, retroalimentacion, id_aula, id_usuario]
    );

    res.status(201).json({ msg: "Actividad creada ✅", actividad: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al crear actividad", error: err.message });
  }
};

// ✅ Listar actividades por aula o tipo
export const listarActividades = async (req, res) => {
  try {
    const { id_aula, tipo } = req.query;
    let query = "SELECT * FROM actividades WHERE 1=1";
    const values = [];

    if (id_aula) {
      query += " AND id_aula = $1";
      values.push(id_aula);
    }
    if (tipo) {
      query += values.length ? " AND tipo = $" + (values.length + 1) : " AND tipo = $1";
      values.push(tipo);
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: "Error al listar actividades", error: err.message });
  }
};
