import { Router } from "express";
import { getConnection } from "../sqlconfig.js";

const router = Router();

// Crear un Regimen Comun
router.post("/create", async (req, res) => {
    const body = req.body || {};
    const { planilla } = body;

    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("planilla", planilla)
            .query(`
        INSERT INTO SMI_RegimenComun (createdAt, planilla)
        OUTPUT INSERTED.id
        VALUES (GETDATE(), @planilla)
      `);

        return res.status(201).json({
            id: result.recordset[0].id,
            message: "Régimen Común creado exitosamente"
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error interno al crear Régimen Común" });
    }
});

// Obtener todos
router.get("/getall", async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT * FROM SMI_RegimenComun ORDER BY id DESC");
        return res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener registros" });
    }
});

// Actualizar
router.put("/update/:id", async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const { planilla } = body;

    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool.request().input("id", id).query("SELECT id FROM SMI_RegimenComun WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        await pool
            .request()
            .input("id", id)
            .input("planilla", planilla)
            .query(`
        UPDATE SMI_RegimenComun
        SET 
          planilla = @planilla
        WHERE id = @id
      `);

        return res.status(200).json({ message: "Registro actualizado correctamente" });
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

        // Verificar existencia
        const exists = await pool.request().input("id", id).query("SELECT id FROM SMI_RegimenComun WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        // 1. Eliminar referencias en SMI_TrabajadorRegimen (CASCADE manual)
        await pool.request().input("id", id).query("DELETE FROM SMI_TrabajadorRegimen WHERE regimenComunId = @id");

        // 2. Eliminar el registro principal
        await pool.request().input("id", id).query("DELETE FROM SMI_RegimenComun WHERE id = @id");

        return res.status(200).json({ message: "Registro y sus referencias eliminados exitosamente" });
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
        const result = await pool.request().input("id", id).query("SELECT * FROM SMI_RegimenComun WHERE id = @id");
        return res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener registro" });
    }
});

export default router;
