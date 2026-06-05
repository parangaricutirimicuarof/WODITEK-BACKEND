import { Router } from "express";
import { ipWhitelistMiddleware } from "../middleware/ipWhitelistMiddleware.js";
import herramientasRouter from "./SRH_Herramientas.js";
import estacionesRouter from "./SRH_Estaciones.js";


const router = Router();

router.use(ipWhitelistMiddleware);
router.use("/herramientas", herramientasRouter);
router.use("/estaciones", estacionesRouter);


export default router;
