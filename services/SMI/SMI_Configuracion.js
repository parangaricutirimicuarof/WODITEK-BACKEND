import { Router } from "express";
import { getConnection } from "../sqlconfig.js";

const router = Router();

// Crear Configuración General
router.post("/create", async (req, res) => {
    const body = req.body || {};
    const { name, content } = body;

    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("name", name)
            .input("content", content)
            .query(`
        INSERT INTO SMI_Configuracion (createdAt, name, content)
        OUTPUT INSERTED.id
        VALUES (GETDATE(), @name, @content)
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
        const result = await pool.request().query("SELECT * FROM SMI_Configuracion ORDER BY id DESC");
        return res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener configuraciones" });
    }
});

// Obtener por Nombre (Helper útil)
router.get("/getbyname/:name", async (req, res) => {
    const { name } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("name", name)
            .query("SELECT TOP 1 * FROM SMI_Configuracion WHERE name = @name ORDER BY id DESC");

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Configuración no encontrada para este nombre" });
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
    const { name, content } = body;

    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool.request().input("id", id).query("SELECT id FROM SMI_Configuracion WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Configuración no encontrada" });
        }

        await pool
            .request()
            .input("id", id)
            .input("name", name)
            .input("content", content)
            .query(`
        UPDATE SMI_Configuracion
        SET 
          name = @name,
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
        const exists = await pool.request().input("id", id).query("SELECT id FROM SMI_Configuracion WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Configuración no encontrada" });
        }

        await pool.request().input("id", id).query("DELETE FROM SMI_Configuracion WHERE id = @id");
        return res.status(200).json({ message: "Configuración eliminada exitosamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al eliminar configuración" });
    }
});

export default router;
