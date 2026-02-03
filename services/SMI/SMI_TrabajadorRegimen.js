import { Router } from "express";
import { getConnection } from "../sqlconfig.js";

const router = Router();

// Helper para limpiar IDs opcionales
const cleanOptionalId = (id) => {
    if (!id) return null;
    if (String(id).trim() === "") return null;
    if (String(id) === "0") return null; // Tratar 0 como nulo para evitar error de FK inexistente
    return id;
};

// Crear un Trabajador Regimen Relationship
router.post("/create", async (req, res) => {
    const body = req.body || {};
    let { trabajadorId, regimenComunId, regimenConstruccionId } = body;

    if (!trabajadorId) {
        return res.status(400).json({ error: "trabajadorId es requerido" });
    }

    // Sanitizar entradas para asegurar nulos correctos
    regimenComunId = cleanOptionalId(regimenComunId);
    regimenConstruccionId = cleanOptionalId(regimenConstruccionId);

    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("trabajadorId", trabajadorId)
            .input("regimenComunId", regimenComunId)
            .input("regimenConstruccionId", regimenConstruccionId)
            .query(`
        INSERT INTO SMI_TrabajadorRegimen (createdAt, trabajadorId, regimenComunId, regimenConstruccionId)
        OUTPUT INSERTED.id
        VALUES (GETDATE(), @trabajadorId, @regimenComunId, @regimenConstruccionId)
      `);

        return res.status(201).json({
            id: result.recordset[0].id,
            message: "Relación Trabajador-Régimen creada exitosamente"
        });
    } catch (err) {
        console.error(err);
        if (err.number === 547) {
            return res.status(400).json({ error: "Error de integridad: Uno de los IDs proporcionados (trabajador, régimen común o construcción) no existe." });
        }
        return res.status(500).json({ error: "Error interno al crear relación" });
    }
});

// Obtener todos
router.get("/getall", async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT * FROM SMI_TrabajadorRegimen ORDER BY id DESC");
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
    let { trabajadorId, regimenComunId, regimenConstruccionId } = body;

    // Sanitizar entradas
    regimenComunId = cleanOptionalId(regimenComunId);
    regimenConstruccionId = cleanOptionalId(regimenConstruccionId);

    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool.request().input("id", id).query("SELECT id FROM SMI_TrabajadorRegimen WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        await pool
            .request()
            .input("id", id)
            .input("trabajadorId", trabajadorId)
            .input("regimenComunId", regimenComunId)
            .input("regimenConstruccionId", regimenConstruccionId)
            .query(`
        UPDATE SMI_TrabajadorRegimen
        SET 
          trabajadorId = @trabajadorId,
          regimenComunId = @regimenComunId,
          regimenConstruccionId = @regimenConstruccionId
        WHERE id = @id
      `);

        return res.status(200).json({ message: "Registro actualizado correctamente" });
    } catch (err) {
        console.error(err);
        if (err.number === 547) {
            return res.status(400).json({ error: "Error de integridad: ID referenciado no existe." });
        }
        return res.status(500).json({ error: "Error al actualizar registro" });
    }
});

// Eliminar
router.delete("/delete/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool.request().input("id", id).query("SELECT id FROM SMI_TrabajadorRegimen WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        await pool.request().input("id", id).query("DELETE FROM SMI_TrabajadorRegimen WHERE id = @id");
        return res.status(200).json({ message: "Registro eliminado exitosamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al eliminar registro" });
    }
});

export default router;
