import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";

// ==================================================
// 🧑‍🏫 CREAR AULA (solo maestros)
// ==================================================
export const crearAulaController = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "Token requerido." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id_maestro = decoded.id;

    // Verificar rol
    const rolRes = await pool.query("SELECT rol FROM usuarios WHERE id = $1", [id_maestro]);
    if (rolRes.rows.length === 0 || rolRes.rows[0].rol !== "maestro") {
      return res.status(403).json({ msg: "Solo los maestros pueden crear aulas." });
    }

    const { nombre, descripcion } = req.body;
    if (!nombre || nombre.trim() === "")
      return res.status(400).json({ msg: "El nombre del aula es obligatorio." });

    // Verificar duplicado
    const existe = await pool.query(
      "SELECT id FROM aulas WHERE LOWER(nombre) = LOWER($1) AND id_maestro = $2",
      [nombre, id_maestro]
    );
    if (existe.rows.length > 0)
      return res.status(400).json({ msg: "Ya tienes un aula con ese nombre." });

    // Código aleatorio
    const codigo_acceso = Math.random().toString(36).substring(2, 8).toUpperCase();

    const result = await pool.query(
      `INSERT INTO aulas (nombre, descripcion, codigo_acceso, id_maestro)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, descripcion, codigo_acceso, creado_en`,
      [nombre.trim(), descripcion || null, codigo_acceso, id_maestro]
    );

    res.status(201).json({
      msg: "✅ Aula creada correctamente",
      aula: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al crear aula:", error);
    res.status(500).json({ msg: "Error al crear el aula.", error: error.message });
  }
};

// ==================================================
// 📋 LISTAR AULAS (para maestro o alumno)
// ==================================================
export const listarAulas = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "Token requerido." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id_usuario = decoded.id;

    const rolRes = await pool.query("SELECT rol FROM usuarios WHERE id = $1", [id_usuario]);
    if (rolRes.rows.length === 0) return res.status(404).json({ msg: "Usuario no encontrado." });

    const rol = rolRes.rows[0].rol;
    let query, values;

    if (rol === "maestro") {
      query = `
        SELECT a.id, a.nombre, a.descripcion, a.codigo_acceso, a.creado_en,
               COUNT(aa.id_alumno) AS total_alumnos
        FROM aulas a
        LEFT JOIN aula_alumnos aa ON a.id = aa.id_aula
        WHERE a.id_maestro = $1
        GROUP BY a.id
        ORDER BY a.creado_en DESC
      `;
      values = [id_usuario];
    } else {
      query = `
        SELECT a.id, a.nombre, a.descripcion, a.codigo_acceso, a.creado_en
        FROM aula_alumnos aa
        JOIN aulas a ON a.id = aa.id_aula
        WHERE aa.id_alumno = $1
        ORDER BY a.creado_en DESC
      `;
      values = [id_usuario];
    }

    const result = await pool.query(query, values);
    const aulas = result.rows.map((a) => ({
      ...a,
      total_alumnos: a.total_alumnos ? parseInt(a.total_alumnos, 10) : undefined,
    }));

    res.json(aulas);
  } catch (error) {
    console.error("❌ Error al listar aulas:", error);
    res.status(500).json({ msg: "Error al obtener las aulas.", error: error.message });
  }
};

// ==================================================
// 🎓 UNIRSE A AULA (solo alumnos)
// ==================================================
export const unirAulaController = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "Token requerido." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id_alumno = decoded.id;

    const rolRes = await pool.query("SELECT rol FROM usuarios WHERE id = $1", [id_alumno]);
    if (rolRes.rows.length === 0 || rolRes.rows[0].rol !== "alumno") {
      return res.status(403).json({ msg: "Solo los alumnos pueden unirse a aulas." });
    }

    const { codigo } = req.body;
    if (!codigo) return res.status(400).json({ msg: "Código de aula requerido." });

    const aulaRes = await pool.query("SELECT id FROM aulas WHERE codigo_acceso = $1", [codigo]);
    if (aulaRes.rows.length === 0)
      return res.status(404).json({ msg: "Código de aula no encontrado." });

    const id_aula = aulaRes.rows[0].id;

    // Evitar duplicados
    const existe = await pool.query(
      "SELECT id FROM aula_alumnos WHERE id_aula = $1 AND id_alumno = $2",
      [id_aula, id_alumno]
    );
    if (existe.rows.length > 0)
      return res.status(400).json({ msg: "Ya estás inscrito en este aula." });

    await pool.query(
      "INSERT INTO aula_alumnos (id_aula, id_alumno) VALUES ($1, $2)",
      [id_aula, id_alumno]
    );

    res.json({ msg: "✅ Te has unido correctamente al aula" });
  } catch (error) {
    console.error("❌ Error al unirse al aula:", error);
    res.status(500).json({ msg: "Error al unirse al aula.", error: error.message });
  }
};

// ==================================================
// 👥 LISTAR ALUMNOS POR AULA (solo maestro)
// ==================================================
export const listarAlumnosPorAula = async (req, res) => {
  try {
    const idAula = req.params.id;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "Token requerido." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que el aula pertenezca al maestro
    const aula = await pool.query(
      "SELECT * FROM aulas WHERE id = $1 AND id_maestro = $2",
      [idAula, decoded.id]
    );

    if (aula.rows.length === 0)
      return res.status(403).json({ msg: "No tienes permiso para ver esta aula." });

    // Obtener alumnos del aula con su progreso promedio
    const alumnosRes = await pool.query(
      `
      SELECT 
        u.id, 
        u.nombre, 
        u.email, 
        COALESCE(ROUND(AVG(p.puntaje), 2), 0) AS promedio,
        COUNT(p.id) FILTER (WHERE p.completado = true) AS completadas
      FROM aula_alumnos aa
      JOIN usuarios u ON u.id = aa.id_alumno
      LEFT JOIN actividades act ON act.id_aula = aa.id_aula
      LEFT JOIN progreso p ON p.id_usuario = u.id AND p.id_actividad = act.id
      WHERE aa.id_aula = $1
      GROUP BY u.id, u.nombre, u.email
      ORDER BY u.nombre ASC
      `,
      [idAula]
    );

    res.json({
      aula: aula.rows[0],
      alumnos: alumnosRes.rows,
    });
  } catch (error) {
    console.error("❌ Error al listar alumnos:", error);
    res.status(500).json({ msg: "Error al obtener alumnos.", error: error.message });
  }
};

// ==================================================
// 🗑️ ELIMINAR AULA (solo maestro)
// ==================================================
export const eliminarAula = async (req, res) => {
  try {
    const idAula = req.params.id;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "Token requerido." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que el aula pertenezca al maestro
    const aula = await pool.query(
      "SELECT * FROM aulas WHERE id = $1 AND id_maestro = $2",
      [idAula, decoded.id]
    );

    if (aula.rows.length === 0)
      return res.status(403).json({ msg: "No tienes permiso para eliminar este aula." });

    // Eliminar relaciones primero (FK)
    await pool.query("DELETE FROM aula_alumnos WHERE id_aula = $1", [idAula]);
    await pool.query("DELETE FROM actividades WHERE id_aula = $1", [idAula]);
    await pool.query(
      "DELETE FROM progreso WHERE id_actividad IN (SELECT id FROM actividades WHERE id_aula = $1)",
      [idAula]
    );

    // Eliminar aula
    await pool.query("DELETE FROM aulas WHERE id = $1", [idAula]);

    res.json({ msg: "🗑️ Aula eliminada correctamente ✅" });
  } catch (error) {
    console.error("❌ Error al eliminar aula:", error);
    res.status(500).json({ msg: "Error al eliminar aula.", error: error.message });
  }
};
