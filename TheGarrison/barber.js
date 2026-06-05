import { Router } from "express";
import barberAiRouter from "./GAR_BarberAI.js";
import estilosRouter from "./GAR_Estilos.js";

const router = Router();

// Agrupar rutas de la IA (BarberAI)
router.use("/ia", barberAiRouter);

// Agrupar rutas del CRUD de estilos de The Garrison
router.use("/estilos", estilosRouter);

export default router;
