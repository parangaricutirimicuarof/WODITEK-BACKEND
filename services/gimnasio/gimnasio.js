import { Router } from "express"
import usuariosRouter from "./GM_Usuarios.js"
import clientesRouter from "./GM_Clientes.js"
import membresiasRouter from "./GM_Membresias.js"
import entrenadoresRouter from "./GM_Entrenadores.js"
import puntoVentaRouter from "./GM_PuntoDeVenta.js"

const router = Router();

router.use("/usuarios", usuariosRouter)
router.use("/clientes", clientesRouter)
router.use("/membresias", membresiasRouter)
router.use("/entrenadores", entrenadoresRouter)
router.use("/puntodeventa", puntoVentaRouter)
export default router;
