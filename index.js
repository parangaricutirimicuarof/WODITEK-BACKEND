import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import gimnasioRouter from "./services/gimnasio/gimnasio.js";
import reservasRouter from "./services/reservas/reservas.js";
import sqlRouter from "./services/sql_server/sql_server.js";
import smiRouter from "./services/SMI/smi.js";
import landingRouter from "./services/SMI-LandingPage/landing.js";
import ccpRouter from "./services/CCP/ccp.js";
import pushRouter from "./services/push_notifications/push.js";
import srmRouter from "./SRM-Registros/srm.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Manejar errores de sintaxis JSON (ej. body vacío con Content-Type json)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("Error de parsing JSON:", err.message);
    return res.status(400).json({ error: "Petición inválida: El cuerpo JSON está mal formado o vacío." });
  }
  next(err);
});
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rutas
app.use("/gimnasio", gimnasioRouter);
app.use("/reservas", reservasRouter);
app.use("/sql", sqlRouter);
app.use("/smi", smiRouter);
app.use("/landing", landingRouter);
app.use("/ccp", ccpRouter);
app.use("/push", pushRouter);
app.use("/srm", srmRouter);
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
