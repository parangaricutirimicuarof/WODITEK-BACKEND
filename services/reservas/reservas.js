import { Router } from "express"
import usuariosRouter from "./RS_Usuarios.js"


const router = Router();

router.use("/usuarios", usuariosRouter)

export default router;