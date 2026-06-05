import { Router } from "express";
import observacionesRouter from "./TKE_Observaciones.js";

const router = Router();

// El middleware de ipWhitelistMiddleware fue removido aquí, asumiendo que este es un servicio público 
// para subida de fotos, o al menos no especificado. Si se necesita restringir, se puede re-añadir.

// Integrar todas las rutas correspondientes al sistema TKE-OBS
router.use("/observaciones", observacionesRouter);

export default router;
