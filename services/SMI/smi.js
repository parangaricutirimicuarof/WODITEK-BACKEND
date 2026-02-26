import { Router } from "express";
import { ipWhitelistMiddleware } from "../../middleware/ipWhitelistMiddleware.js";
import trabajadoresRouter from "./SMI_Trabajadores.js";
import regimenConstruccionRouter from "./SMI_RegimenConstruccion.js";
import regimenComunRouter from "./SMI_RegimenComun.js";
import trabajadorRegimenRouter from "./SMI_TrabajadorRegimen.js";
import usuariosSMIRouter from "./SMI_Usuarios.js";
import configuracionCalculosRouter from "./SMI_ConfiguracionCalculos.js";
import configuracionRouter from "./SMI_Configuracion.js";
import cargosRouter from "./SMI_Cargos.js";


const router = Router();

router.use(ipWhitelistMiddleware);
router.use("/trabajadores", trabajadoresRouter);
router.use("/regimen-construccion", regimenConstruccionRouter);
router.use("/regimen-comun", regimenComunRouter);
router.use("/regimentrabajador", trabajadorRegimenRouter);
router.use("/usuarios", usuariosSMIRouter);
router.use("/configuracion-calculos", configuracionCalculosRouter);
router.use("/configuracion", configuracionRouter);
router.use("/cargos", cargosRouter);
export default router;
