import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";

// ==================================================
// 📘 CREAR ACTIVIDAD (solo maestros)
// ==================================================
export const crearActividad = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "Token requerido." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id_maestro = decoded.id;

    const { titulo, descripcion, tipo, nivel, contenido, id_aula } = req.body;

    if (!titulo || !id_aula)
      return res.status(400).json({ msg: "Falta título o aula." });

    // Verificar que el aula pertenezca al maestro
    const aula = await pool.query(
      "SELECT id FROM aulas WHERE id = $1 AND id_maestro = $2",
      [id_aula, id_maestro]
    );
    if (aula.rows.length === 0)
      return res.status(403).json({ msg: "No tienes permiso en esta aula." });

    const result = await pool.query(
      `INSERT INTO actividades (titulo, descripcion, tipo, nivel, contenido, id_aula, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        titulo,
        descripcion,
        tipo || "matematicas",
        nivel || 1,
        JSON.stringify(contenido || {}),
        id_aula,
        id_maestro,
      ]
    );

    res.status(201).json({
      msg: "✅ Actividad creada correctamente",
      actividad: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al crear actividad:", error);
    res.status(500).json({
      msg: "Error interno al crear actividad.",
      error: error.message,
    });
  }
};

// ==================================================
// 📋 LISTAR ACTIVIDADES DE UN AULA
// ==================================================
export const listarActividades = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, titulo, descripcion, tipo, nivel, creado_en
       FROM actividades
       WHERE id_aula = $1
       ORDER BY creado_en DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al listar actividades:", error);
    res.status(500).json({ msg: "Error al obtener actividades." });
  }
};

// ==================================================
// ✏️ EDITAR ACTIVIDAD (solo maestro)
// ==================================================
export const editarActividad = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, tipo, nivel } = req.body;

    await pool.query(
      `UPDATE actividades
       SET titulo = $1, descripcion = $2, tipo = $3, nivel = $4
       WHERE id = $5`,
      [titulo, descripcion, tipo, nivel, id]
    );

    res.json({ msg: "✏️ Actividad actualizada correctamente" });
  } catch (error) {
    console.error("❌ Error al editar actividad:", error);
    res.status(500).json({ msg: "Error al editar la actividad." });
  }
};

// ==================================================
// 🗑️ ELIMINAR ACTIVIDAD (solo maestro)
// ==================================================
export const eliminarActividad = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM actividades WHERE id = $1", [id]);
    res.json({ msg: "🗑️ Actividad eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar actividad:", error);
    res.status(500).json({ msg: "Error al eliminar la actividad." });
  }
};

// ==================================================
// 📊 VER PROGRESO DE LOS ALUMNOS (solo maestro)
// ==================================================
export const progresoPorActividad = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT u.nombre, u.email, 
             COALESCE(AVG(p.puntaje), 0) AS promedio,
             COUNT(p.id) FILTER (WHERE p.completado = true) AS completadas
      FROM aula_alumnos aa
      JOIN usuarios u ON u.id = aa.id_alumno
      LEFT JOIN actividades act ON act.id_aula = aa.id_aula
      LEFT JOIN progreso p ON p.id_usuario = u.id AND p.id_actividad = act.id
      WHERE aa.id_aula = $1
      GROUP BY u.id, u.nombre, u.email
      ORDER BY u.nombre ASC
      `,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener progreso:", error);
    res.status(500).json({ msg: "Error al obtener el progreso." });
  }
};

// ==================================================
// 🎯 LISTAR ACTIVIDADES DISPONIBLES PARA EL ALUMNO
// ==================================================
export const listarActividadesPorAula = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `
      SELECT id, titulo, descripcion, tipo, nivel
      FROM actividades
      WHERE id_aula = $1
      ORDER BY creado_en DESC
      `,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al listar actividades del alumno:", error);
    res.status(500).json({ msg: "Error al listar actividades del alumno." });
  }
};

// ==================================================
// 💾 REGISTRAR / ACTUALIZAR PROGRESO DEL ALUMNO
// ==================================================
export const registrarProgreso = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "Token requerido." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id_usuario = decoded.id;
    const { idActividad } = req.params;
    const { puntaje, completado, tiempo_respuesta } = req.body;

    if (!idActividad)
      return res.status(400).json({ msg: "ID de actividad requerido." });

    console.log("📩 Datos recibidos:", {
      id_usuario,
      idActividad,
      puntaje,
      completado,
      tiempo_respuesta,
    });

    const existe = await pool.query(
      "SELECT id FROM progreso WHERE id_usuario = $1 AND id_actividad = $2",
      [id_usuario, idActividad]
    );

    if (existe.rows.length > 0) {
      await pool.query(
        `UPDATE progreso
         SET puntaje = $1, completado = $2, tiempo_respuesta = $3, fecha = NOW()
         WHERE id_usuario = $4 AND id_actividad = $5`,
        [
          puntaje || 0,
          completado || false,
          tiempo_respuesta || null,
          id_usuario,
          idActividad,
        ]
      );
      res.json({ msg: "✅ Progreso actualizado correctamente" });
    } else {
      await pool.query(
        `INSERT INTO progreso (id_usuario, id_actividad, puntaje, completado, tiempo_respuesta, fecha)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          id_usuario,
          idActividad,
          puntaje || 0,
          completado || false,
          tiempo_respuesta || null,
        ]
      );
      res.json({ msg: "✅ Progreso registrado correctamente" });
    }
  } catch (error) {
    console.error("❌ Error al registrar progreso:", error);
    res.status(500).json({
      msg: "Error al registrar el progreso.",
      detalle: error.message,
      stack: error.stack,
    });
  }
};

// ==================================================
// 📘 OBTENER DETALLE DE UNA ACTIVIDAD POR ID
// ==================================================
export const obtenerActividadPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT id, titulo, descripcion, tipo, nivel, contenido, id_aula, creado_en
      FROM actividades
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ msg: "Actividad no encontrada." });

    const actividad = result.rows[0];
    if (typeof actividad.contenido === "string") {
      try {
        actividad.contenido = JSON.parse(actividad.contenido);
      } catch {
        actividad.contenido = {};
      }
    }

    res.json(actividad);
  } catch (error) {
    console.error("❌ Error al obtener actividad:", error);
    res.status(500).json({
      msg: "Error al obtener la actividad.",
      error: error.message,
    });
  }
};
