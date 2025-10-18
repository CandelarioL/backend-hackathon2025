import { pool } from "../config/db.js";
import crypto from "crypto";

// Crear aula
export const crearAula = async (nombre, descripcion, id_maestro) => {
  const codigo = crypto.randomBytes(3).toString("hex").toUpperCase();
  const result = await pool.query(
    "INSERT INTO aulas (nombre, descripcion, codigo_acceso, id_maestro) VALUES ($1, $2, $3, $4) RETURNING *",
    [nombre, descripcion, codigo, id_maestro]
  );
  return result.rows[0];
};

// Listar aulas del maestro
export const obtenerAulasPorMaestro = async (id_maestro) => {
  const result = await pool.query("SELECT * FROM aulas WHERE id_maestro = $1", [id_maestro]);
  return result.rows;
};

// Unirse a un aula con código
export const unirAlumnoAula = async (codigo, id_alumno) => {
  const aula = await pool.query("SELECT * FROM aulas WHERE codigo_acceso = $1", [codigo]);
  if (aula.rows.length === 0) return null;

  const id_aula = aula.rows[0].id;
  await pool.query(
    "INSERT INTO aula_alumnos (id_aula, id_alumno) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [id_aula, id_alumno]
  );
  return aula.rows[0];
};

// Listar aulas del alumno
export const obtenerAulasPorAlumno = async (id_alumno) => {
  const result = await pool.query(
    `SELECT a.* FROM aulas a
     JOIN aula_alumnos aa ON a.id = aa.id_aula
     WHERE aa.id_alumno = $1`,
    [id_alumno]
  );
  return result.rows;
};
