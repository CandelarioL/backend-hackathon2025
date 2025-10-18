import { pool } from "../config/db.js";

// 🔹 Buscar usuario por correo (incluye rol)
export const findUserByEmail = async (email) => {
  const result = await pool.query(
    "SELECT id, nombre, email, password, rol FROM usuarios WHERE email = $1",
    [email]
  );
  return result.rows[0];
};

// 🔹 Crear usuario nuevo (incluye rol)
export const createUser = async ({ name, email, password, rol }) => {
  const result = await pool.query(
    "INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING *",
    [name, email, password, rol]
  );
  return result.rows[0];
};

// 🔹 Guardar token de recuperación
export const updateResetToken = async (email, token, expira) => {
  await pool.query(
    "UPDATE usuarios SET token_reset=$1, token_expira=$2 WHERE email=$3",
    [token, expira, email]
  );
};

// 🔹 Cambiar contraseña (y limpiar token)
export const updateUserPassword = async (email, newPassword) => {
  await pool.query(
    "UPDATE usuarios SET password=$1, token_reset=NULL, token_expira=NULL WHERE email=$2",
    [newPassword, email]
  );
};
