import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import {
  createUser,
  findUserByEmail,
  updateUserPassword,
  updateResetToken,
} from "../models/user.model.js";
import { pool } from "../config/db.js";

dotenv.config();

// ======================================
// 🔹 REGISTRO DE USUARIO
// ======================================
export const register = async (req, res) => {
  try {
    const { name, email, password, rol } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ msg: "Todos los campos son obligatorios" });

    const userExist = await findUserByEmail(email);
    if (userExist)
      return res.status(400).json({ msg: "El usuario ya existe" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await createUser({
      name,
      email,
      password: hashed,
      rol: rol || "alumno", // 👈 por defecto 'alumno'
    });

    res.status(201).json({
      msg: "Usuario registrado correctamente",
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email,
        rol: newUser.rol,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Error al registrar usuario",
      error: error.message,
    });
  }
};

// ======================================
// 🔹 LOGIN DE USUARIO (incluye rol)
// ======================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(401).json({ msg: "Contraseña incorrecta" });

    const rol = user.rol || "alumno"; // 👈 aseguramos rol

    // Crear token con rol incluido
    const token = jwt.sign(
      { id: user.id, email: user.email, rol },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      msg: "Login exitoso",
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Error en el login",
      error: error.message,
    });
  }
};

// ======================================
// 🔹 PERFIL
// ======================================
export const perfil = async (req, res) => {
  try {
    const { id, email, rol } = req.user;
    res.json({
      msg: "Acceso autorizado",
      usuario: { id, email, rol },
    });
  } catch (error) {
    res.status(500).json({
      msg: "Error al obtener el perfil",
      error: error.message,
    });
  }
};

// ======================================
// 🔹 SOLICITAR RESET DE CONTRASEÑA
// ======================================
export const solicitarReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ msg: "Correo no encontrado" });

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const expira = new Date(Date.now() + 15 * 60 * 1000);

    await updateResetToken(email, token, expira);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const link = `http://localhost:5173/#/reset/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Recuperación de contraseña - Hackaton App",
      html: `
        <p>Hola 👋</p>
        <p>Has solicitado restablecer tu contraseña.</p>
        <p><a href="${link}" target="_blank">Haz clic aquí para restablecerla</a></p>
        <p>Este enlace expirará en 15 minutos.</p>
      `,
    });

    res.json({ msg: "Correo de recuperación enviado ✅" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al enviar correo", error: error.message });
  }
};

// ======================================
// 🔹 VERIFICAR TOKEN DE RESET
// ======================================
export const verificarTokenReset = async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE email=$1 AND token_reset=$2 AND token_expira > NOW()",
      [decoded.email, token]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ msg: "Token inválido o expirado" });

    res.json({ msg: "Token válido", email: decoded.email });
  } catch (error) {
    res.status(400).json({ msg: "Token inválido o expirado" });
  }
};

// ======================================
// 🔹 CAMBIAR CONTRASEÑA
// ======================================
export const cambiarPassword = async (req, res) => {
  const { token, nuevaPassword } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashed = await bcrypt.hash(nuevaPassword, 10);

    await updateUserPassword(decoded.email, hashed);

    res.json({ msg: "Contraseña actualizada correctamente ✅" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ msg: "Error al actualizar contraseña" });
  }
};
