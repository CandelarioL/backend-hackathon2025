import express from "express";
import { pool } from "../config/db.js";


const router = express.Router();

// ✅ Guardar o actualizar progreso
router.post("/guardar-progreso", async (req, res) => {
  try {
    const { id_usuario, nivel, experiencia, monedas, personaje } = req.body;

    const existe = await pool.query(
      "SELECT * FROM jugador_progreso WHERE id_usuario = $1",
      [id_usuario]
    );

    if (existe.rows.length > 0) {
      await pool.query(
        `UPDATE jugador_progreso
         SET nivel = $1, experiencia = $2, monedas = $3, personaje = $4, actualizado = NOW()
         WHERE id_usuario = $5`,
        [nivel, experiencia, monedas, personaje, id_usuario]
      );
    } else {
      await pool.query(
        `INSERT INTO jugador_progreso (id_usuario, nivel, experiencia, monedas, personaje)
         VALUES ($1, $2, $3, $4, $5)`,
        [id_usuario, nivel, experiencia, monedas, personaje]
      );
    }

    res.json({ ok: true, msg: "Progreso guardado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: "Error al guardar progreso" });
  }
});

// ✅ Obtener ranking
router.get("/ranking", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.nombre, j.nivel, j.experiencia, j.monedas, j.personaje
       FROM jugador_progreso j
       INNER JOIN usuarios u ON u.id = j.id_usuario
       ORDER BY j.experiencia DESC, j.monedas DESC
       LIMIT 20`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: "Error al obtener ranking" });
  }
});

export default router;
