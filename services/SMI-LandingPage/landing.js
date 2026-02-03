import { Router } from "express";
import formularioRouter from "./SLP_Contactar.js";


const router = Router();


router.use("/formulario", formularioRouter);
export default router;

