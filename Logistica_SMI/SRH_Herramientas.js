import { Router } from "express";
import { getConnection } from "../services/sqlconfig.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Configuración de almacenamiento para Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = "./Logistica_SMI/uploads/certificados";
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "cert-" + uniqueSuffix + path.extname(file.originalname));
    }
});

// Middleware Multer con límite de 5MB y filtros de extensión
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Solo se permiten archivos PDF"));
        }
    }
});

// Middleware de manejo de errores de multer
const cpUpload = upload.fields([
    { name: "fileOperatividad", maxCount: 1 },
    { name: "fileFabrica", maxCount: 1 }
]);

// Función auxiliar para borrar archivos por nombre
const deleteFileByName = (filename) => {
    if (filename && typeof filename === "string") {
        try {
            // Extraemos solo el nombre si por alguna razón viniera la ruta completa
            const cleanName = filename.split("/").pop();
            if (cleanName.startsWith("cert-")) {
                const localPath = path.join(".", "Logistica_SMI", "uploads", "certificados", cleanName);
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath);
                }
            }
        } catch (e) {
            console.error("Error al eliminar archivo físico:", e);
        }
    }
};


// Crear una herramienta nueva
router.post("/create", cpUpload, async (req, res) => {
    const body = req.body || {};
    const {
        nombre,
        codigo,
        ubicacion,
        estacion,
        supervisor,
        rutaOperatividad,
        rutaFabrica,
        vencOperatividad,
        vencFabrica
    } = body;


    const missing = [];
    if (!nombre) missing.push("nombre");
    if (!codigo) missing.push("codigo");

    if (missing.length > 0) {
        return res.status(400).json({ error: "Faltan campos requeridos", missing });
    }

    try {
        let finalRutaOperatividad = rutaOperatividad || null;
        let finalRutaFabrica = rutaFabrica || null;

        if (req.files && req.files["fileOperatividad"]) {
            finalRutaOperatividad = req.files["fileOperatividad"][0].filename;
        }
        if (req.files && req.files["fileFabrica"]) {
            finalRutaFabrica = req.files["fileFabrica"][0].filename;
        }

        const pool = await getConnection();

        const result = await pool
            .request()
            .input("nombre", nombre)
            .input("codigo", codigo)
            .input("ubicacion", ubicacion || null)
            .input("estacion", estacion || null)
            .input("supervisor", supervisor || null)
            .input("rutaOperatividad", finalRutaOperatividad)
            .input("rutaFabrica", finalRutaFabrica)
            .input("vencOperatividad", vencOperatividad || null)
            .input("vencFabrica", vencFabrica || null)
            .query(`
        INSERT INTO SRH_Herramienta (createdAt, nombre, codigo, ubicacion, estacion, supervisor, rutaOperatividad, rutaFabrica, vencOperatividad, vencFabrica)
        OUTPUT INSERTED.id
        VALUES (GETDATE(), @nombre, @codigo, @ubicacion, @estacion, @supervisor, @rutaOperatividad, @rutaFabrica, @vencOperatividad, @vencFabrica)

      `);

        return res.status(201).json({
            id: result.recordset[0].id,
            message: "Herramienta creada exitosamente"
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error interno, no se pudo crear la herramienta" });
    }
});

// Obtener todas las herramientas
router.get("/getall", async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT * FROM SRH_Herramienta ORDER BY id DESC");
        return res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener herramientas" });
    }
});

// Actualizar una herramienta
router.put("/update/:id", cpUpload, async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const {
        nombre,
        codigo,
        ubicacion,
        estacion,
        supervisor,
        rutaOperatividad,
        rutaFabrica,
        vencOperatividad,
        vencFabrica
    } = body;


    try {
        let finalRutaOperatividad = rutaOperatividad || null;
        let finalRutaFabrica = rutaFabrica || null;

        if (req.files && req.files["fileOperatividad"]) {
            finalRutaOperatividad = req.files["fileOperatividad"][0].filename;
        }
        if (req.files && req.files["fileFabrica"]) {
            finalRutaFabrica = req.files["fileFabrica"][0].filename;
        }

        const pool = await getConnection();


        // Verificar existencia
        const exists = await pool.request().input("id", id).query("SELECT id, rutaOperatividad, rutaFabrica FROM SRH_Herramienta WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Herramienta no encontrada" });
        }

        // Si no se envio archivo y tampoco viene string, mantenemos lo actual
        if (!req.files?.["fileOperatividad"] && rutaOperatividad === undefined) {
             finalRutaOperatividad = exists.recordset[0].rutaOperatividad;
        } else if (req.files?.["fileOperatividad"] && exists.recordset[0].rutaOperatividad) {
             // Si se subió uno nuevo y existe uno viejo, borramos el viejo
             deleteFileByName(exists.recordset[0].rutaOperatividad);
        }

        if (!req.files?.["fileFabrica"] && rutaFabrica === undefined) {
             finalRutaFabrica = exists.recordset[0].rutaFabrica;
        } else if (req.files?.["fileFabrica"] && exists.recordset[0].rutaFabrica) {
             // Si se subió uno nuevo y existe uno viejo, borramos el viejo
             deleteFileByName(exists.recordset[0].rutaFabrica);
        }


        await pool
            .request()
            .input("id", id)
            .input("nombre", nombre)
            .input("codigo", codigo)
            .input("ubicacion", ubicacion || null)
            .input("estacion", estacion || null)
            .input("supervisor", supervisor || null)
            .input("rutaOperatividad", finalRutaOperatividad)
            .input("rutaFabrica", finalRutaFabrica)
            .input("vencOperatividad", vencOperatividad || null)
            .input("vencFabrica", vencFabrica || null)
            .query(`
        UPDATE SRH_Herramienta
        SET 
          nombre = @nombre,
          codigo = @codigo,
          ubicacion = @ubicacion,
          estacion = @estacion,
          supervisor = @supervisor,
          rutaOperatividad = @rutaOperatividad,
          rutaFabrica = @rutaFabrica,
          vencOperatividad = @vencOperatividad,
          vencFabrica = @vencFabrica

        WHERE id = @id
      `);

        return res.status(200).json({ message: "Herramienta actualizada correctamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al actualizar herramienta" });
    }
});

// Eliminar una herramienta
router.delete("/delete/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();

        // Verificar existencia y obtener datos para borrar archivos si los hay
        const exists = await pool.request().input("id", id).query("SELECT id, rutaOperatividad, rutaFabrica FROM SRH_Herramienta WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Herramienta no encontrada" });
        }

        const herramienta = exists.recordset[0];

        // Borrar archivos físicos del servidor antes de eliminar el registro de la BD
        deleteFileByName(herramienta.rutaOperatividad);
        deleteFileByName(herramienta.rutaFabrica);

        await pool.request().input("id", id).query("DELETE FROM SRH_Herramienta WHERE id = @id");

        return res.status(200).json({ message: "Herramienta eliminada exitosamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al eliminar herramienta" });
    }
});

export default router;
