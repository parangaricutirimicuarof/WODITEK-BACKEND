import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import gimnasioRouter from "./services/gimnasio/gimnasio.js";
import reservasRouter from "./services/reservas/reservas.js";   

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares base
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use("/gimnasio", gimnasioRouter);
app.use("/reservas", reservasRouter);
// 404 (si ninguna ruta coincidió)
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Error global
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(port, () =>
  console.log(`Servidor corriendo en el puerto: ${port}`)
);
