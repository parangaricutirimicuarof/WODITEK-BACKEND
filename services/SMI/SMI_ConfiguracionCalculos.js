import { Router } from "express";
import { getConnection } from "../sqlconfig.js";

const router = Router();

// Crear Configuración
router.post("/create", async (req, res) => {
    const body = req.body || {};
    const { regimenType, content } = body;

    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("regimenType", regimenType)
            .input("content", content)
            .query(`
        INSERT INTO SMI_ConfiguracionCalculos (createdAt, regimenType, content)
        OUTPUT INSERTED.id
        VALUES (GETDATE(), @regimenType, @content)
      `);

        return res.status(201).json({
            id: result.recordset[0].id,
            message: "Configuración creada exitosamente"
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error interno al crear configuración" });
    }
});

// Obtener todos
router.get("/getall", async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT * FROM SMI_ConfiguracionCalculos ORDER BY id DESC");
        return res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener configuraciones" });
    }
});

// Obtener por Tipo de Regimen (Helper útil)
router.get("/getbytype/:type", async (req, res) => {
    const { type } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("type", type)
            .query("SELECT TOP 1 * FROM SMI_ConfiguracionCalculos WHERE regimenType = @type ORDER BY id DESC");

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Configuración no encontrada para este tipo" });
        }
        return res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener configuración" });
    }
});

// Actualizar
router.put("/update/:id", async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const { regimenType, content } = body;

    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool.request().input("id", id).query("SELECT id FROM SMI_ConfiguracionCalculos WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Configuración no encontrada" });
        }

        await pool
            .request()
            .input("id", id)
            .input("regimenType", regimenType)
            .input("content", content)
            .query(`
        UPDATE SMI_ConfiguracionCalculos
        SET 
          regimenType = @regimenType,
          content = @content
        WHERE id = @id
      `);

        return res.status(200).json({ message: "Configuración actualizada correctamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al actualizar configuración" });
    }
});

// Eliminar
router.delete("/delete/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool.request().input("id", id).query("SELECT id FROM SMI_ConfiguracionCalculos WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Configuración no encontrada" });
        }

        await pool.request().input("id", id).query("DELETE FROM SMI_ConfiguracionCalculos WHERE id = @id");
        return res.status(200).json({ message: "Configuración eliminada exitosamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al eliminar configuración" });
    }
});

export default router;
