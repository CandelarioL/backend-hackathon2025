import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // necesario para Supabase
  },
});

pool.connect()
  .then(() => console.log("✅ Conectado correctamente a Supabase PostgreSQL"))
  .catch((err) => console.error("❌ Error al conectar con Supabase:", err));
