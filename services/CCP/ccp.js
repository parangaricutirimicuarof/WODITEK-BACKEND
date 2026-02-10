import { Router } from "express";
import ancianoRouter from "./CCP_Anciano.js";
import bautizoRouter from "./CCP_Bautizo.js";
import salaOracionRouter from "./CCP_SalaOracion.js";
import santaCenaRouter from "./CCP_SantaCena.js";
import usuarioRouter from "./CCP_Usuarios.js";


const router = Router();

router.use("/ancianos", ancianoRouter);
router.use("/bautizos", bautizoRouter);
router.use("/sala-oracion", salaOracionRouter);
router.use("/santa-cena", santaCenaRouter);
router.use("/usuarios", usuarioRouter);


export default router;