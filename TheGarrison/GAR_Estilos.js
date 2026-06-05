import { Router } from "express";
import { getConnection } from "../services/sqlconfig.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Configurar multer para almacenar imágenes de The Garrison
const uploadDir = path.join(__dirname, 'uploads', 'estilos');

// Asegurar que el directorio exista
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento físico
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Renombramos el archivo con un timestamp para evitar colisiones
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'estilo-' + uniqueSuffix + ext);
    }
});

// Filtro opcional para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('El archivo no es una imagen permitida'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Función auxiliar para guardar imágenes enviadas en base64 como archivos físicos
const saveBase64ToDisk = (base64String) => {
    try {
        if (!base64String) return null;

        let normalizedB64 = base64String;
        
        // Si no tiene prefijo pero es un JPG base64 válido (/9j/)
        if (!base64String.startsWith('data:image/') && base64String.startsWith('/9j/')) {
            normalizedB64 = `data:image/jpeg;base64,${base64String}`;
        }

        if (!normalizedB64.startsWith('data:image/')) return null;

        const matches = normalizedB64.match(/^data:image\/([A-Za-z-+/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return null;

        const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const data = Buffer.from(matches[2], 'base64');
        const filename = `estilo-b64-${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
        const filePath = path.join(uploadDir, filename);
        
        fs.writeFileSync(filePath, data);
        return `/garrison/uploads/${filename}`;
    } catch (err) {
        console.error("Error al guardar imagen base64:", err);
        return null;
    }
};

// Crear un Estilo
router.post("/create", upload.single('imagen'), async (req, res) => {
    const { nombre, prompt, imagen: imagenBase64 } = req.body;

    // Prioridad 1: Archivo físico subido por Multer
    // Prioridad 2: Texto base64 enviado en el JSON
    let imagenPath = null;

    if (req.file) {
        imagenPath = `/garrison/uploads/${req.file.filename}`;
    } else if (imagenBase64) {
        imagenPath = saveBase64ToDisk(imagenBase64);
    }

    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("nombre", nombre)
            .input("prompt", prompt)
            .input("imagen", imagenPath)
            .query(`
        INSERT INTO GAR_Estilos (createdAt, nombre, prompt, imagen)
        OUTPUT INSERTED.id
        VALUES (GETDATE(), @nombre, @prompt, @imagen)
      `);

        return res.status(201).json({
            id: result.recordset[0].id,
            imagen: imagenPath,
            message: "Estilo creado exitosamente"
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error interno al crear Estilo" });
    }
});

// Obtener todos
router.get("/getall", async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT * FROM GAR_Estilos ORDER BY id DESC");
        return res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener registros" });
    }
});

// Actualizar
router.put("/update/:id", upload.single('imagen'), async (req, res) => {
    const { id } = req.params;
    const { nombre, prompt, imagen: imagenBase64 } = req.body;

    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool.request().input("id", id).query("SELECT id, imagen FROM GAR_Estilos WHERE id = @id");
        if (exists.recordset.length === 0) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        let nuevaImagenPath = exists.recordset[0].imagen; // Mantener imagen anterior por defecto

        // Caso A: Se subió un archivo físico nuevo
        if (req.file) {
            nuevaImagenPath = `/garrison/uploads/${req.file.filename}`;
        } 
        // Caso B: Se envió una nueva imagen en formato Base64
        else if (imagenBase64 && imagenBase64.startsWith('data:image/')) {
            nuevaImagenPath = saveBase64ToDisk(imagenBase64);
        }

        // Si la imagen cambió, intentamos borrar la anterior si existe
        if (nuevaImagenPath !== exists.recordset[0].imagen) {
            const nombreArchivoAnterior = path.basename(exists.recordset[0].imagen);
            const rutaArchivoAnterior = path.join(uploadDir, nombreArchivoAnterior);
            if(fs.existsSync(rutaArchivoAnterior)) {
                fs.unlinkSync(rutaArchivoAnterior);
            }
        }

        await pool
            .request()
            .input("id", id)
            .input("nombre", nombre || exists.recordset[0].nombre)
            .input("prompt", prompt || exists.recordset[0].prompt)
            .input("imagen", nuevaImagenPath)
            .query(`
        UPDATE GAR_Estilos
        SET 
          nombre = @nombre,
          prompt = @prompt,
          imagen = @imagen
        WHERE id = @id
      `);

        return res.status(200).json({ message: "Registro actualizado correctamente", imagen: nuevaImagenPath });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al actualizar registro" });
    }
});

// Eliminar
router.delete("/delete/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();

        // Verificar existencia en tabla principal
        const exists = await pool.request().input("id", id).query("SELECT id, imagen FROM GAR_Estilos WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        const rutaImagenDB = exists.recordset[0].imagen;

        // Eliminar el registro principal
        await pool.request().input("id", id).query("DELETE FROM GAR_Estilos WHERE id = @id");

        // Eliminar el archivo físico del servidor
        if (rutaImagenDB) {
            const nombreArchivo = path.basename(rutaImagenDB);
            const rutaFisica = path.join(uploadDir, nombreArchivo);
            if (fs.existsSync(rutaFisica)) {
                fs.unlinkSync(rutaFisica);
            }
        }

        return res.status(200).json({ message: "Registro y archivo eliminados exitosamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al eliminar registro" });
    }
});

// Buscar por ID
router.get("/get/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request().input("id", id).query("SELECT * FROM GAR_Estilos WHERE id = @id");
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }
        return res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener registro" });
    }
});

export default router;
