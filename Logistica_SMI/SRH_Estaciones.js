import { Router } from "express";
import { getConnection } from "../services/sqlconfig.js";

const router = Router();

// Crear una estación nueva
router.post("/create", async (req, res) => {
    const body = req.body || {};
    const { nombreEstacion } = body;

    if (!nombreEstacion) {
        return res.status(400).json({ error: "Faltan campos requeridos: nombreEstacion" });
    }

    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("nombreEstacion", nombreEstacion)
            .query(`
        INSERT INTO SRH_Estaciones (createdAt, nombreEstacion)
        OUTPUT INSERTED.id
        VALUES (GETDATE(), @nombreEstacion)
      `);

        return res.status(201).json({
            id: result.recordset[0].id,
            message: "Estación creada exitosamente"
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error interno, no se pudo crear la estación" });
    }
});

// Obtener todas las estaciones
router.get("/getall", async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT * FROM SRH_Estaciones ORDER BY id DESC");
        return res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener estaciones" });
    }
});

// Actualizar una estación
router.put("/update/:id", async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const { nombreEstacion } = body;

    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool.request().input("id", id).query("SELECT id FROM SRH_Estaciones WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Estación no encontrada" });
        }

        await pool
            .request()
            .input("id", id)
            .input("nombreEstacion", nombreEstacion)
            .query(`
        UPDATE SRH_Estaciones
        SET nombreEstacion = @nombreEstacion
        WHERE id = @id
      `);

        return res.status(200).json({ message: "Estación actualizada correctamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al actualizar estación" });
    }
});

// Eliminar una estación
router.delete("/delete/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool.request().input("id", id).query("SELECT id FROM SRH_Estaciones WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Estación no encontrada" });
        }

        await pool.request().input("id", id).query("DELETE FROM SRH_Estaciones WHERE id = @id");
        return res.status(200).json({ message: "Estación eliminada exitosamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al eliminar estación" });
    }
});

export default router;
