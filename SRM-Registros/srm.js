import { Router } from "express";
import usuariosRouter from "./SRM_Usuarios.js";
import piezasRouter from "./SRM_Piezas.js";
import incidenciasRouter from "./SRM_Incidencias.js";
const router = Router();

router.use("/usuarios", usuariosRouter);
router.use("/piezas", piezasRouter);
router.use("/incidencias", incidenciasRouter);
export default router;
