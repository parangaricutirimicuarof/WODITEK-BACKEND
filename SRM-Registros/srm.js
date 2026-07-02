import { Router } from "express";
import usuariosRouter from "./SRM_Usuarios.js";
import piezasRouter from "./SRM_Piezas.js";
import incidenciasRouter from "./SRM_Incidencias.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Configuración de almacenamiento para Multer
const uploadDir = "./SRM-Registros/uploads";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "srm-" + uniqueSuffix + path.extname(file.originalname));
    }
});

// Middleware Multer con límite de 10MB y filtros de extensión
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|gif/;
        const mimeType = allowedTypes.test(file.mimetype);
        const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimeType && extName) {
            cb(null, true);
        } else {
            cb(new Error("Solo se permiten archivos de imagen (jpg, jpeg, png, webp, gif)"));
        }
    }
});

// Endpoint para subir imágenes de SRM
router.post("/upload", (req, res) => {
    upload.single("foto")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, error: `Error de subida: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
        
        if (!req.file) {
            return res.status(400).json({ success: false, error: "No se subió ningún archivo" });
        }

        // Retorna la ruta estática para acceder al archivo
        const fileUrl = `/srm/uploads/${req.file.filename}`;
        return res.status(200).json({
            success: true,
            message: "Imagen subida exitosamente",
            url: fileUrl
        });
    });
});

router.use("/usuarios", usuariosRouter);
router.use("/piezas", piezasRouter);
router.use("/incidencias", incidenciasRouter);
export default router;
