import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();
const config = {
  user: process.env.SQLSERVER_USER,
  password: process.env.SQLSERVER_PASSWORD,
  server: process.env.SQLSERVER_SERVER,
  database: process.env.SQLSERVER_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

let pool;

export const getConnection = async () => {
  try {
    if (pool) return pool;

    pool = await sql.connect(config);
    return pool;
  } catch (error) {
    console.error("Error al conectar con SQL Server:", error);
    throw error; // Propaga el error para que el controlador lo maneje
  }
};
