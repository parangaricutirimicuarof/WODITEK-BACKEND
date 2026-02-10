import { Router } from "express";
import { getConnection } from "../sqlconfig.js";

const router = Router();

// Crear un registro en la tabla CCP_Ancianos
router.post("/create", async (req, res) => {
    const body = req.body || {};
    const { nombre } = body;

    if (!nombre) {
        return res.status(400).json({ error: "El nombre es requerido" });
    }

    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("nombre", nombre)
            .query(`
        INSERT INTO [CCP_Ancianos] (createdAt, nombre)
        OUTPUT INSERTED.id
        VALUES (GETDATE(), @nombre)
      `);

        return res.status(201).json({
            id: result.recordset[0].id,
            message: "Anciano creado exitosamente",
        });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({ error: "Error interno al crear el registro" });
    }
});

// Obtener todos los registros
router.get("/getall", async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .query("SELECT id, createdAt, nombre FROM [CCP_Ancianos] ORDER BY id DESC");
        return res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener los registros" });
    }
});

// Actualizar registro
router.put("/update/:id", async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const { nombre } = body;

    if (!nombre) {
        return res.status(400).json({ error: "El nombre es requerido" });
    }

    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool
            .request()
            .input("id", id)
            .query("SELECT id FROM [CCP_Ancianos] WHERE id = @id");

        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        await pool
            .request()
            .input("id", id)
            .input("nombre", nombre)
            .query(`
        UPDATE [CCP_Ancianos]
        SET nombre = @nombre
        WHERE id = @id
      `);

        return res
            .status(200)
            .json({ message: "Registro actualizado correctamente" });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({ error: "Error al actualizar el registro" });
    }
});

// Eliminar registro
router.delete("/delete/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool
            .request()
            .input("id", id)
            .query("SELECT id FROM [CCP_Ancianos] WHERE id = @id");

        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        await pool
            .request()
            .input("id", id)
            .query("DELETE FROM [CCP_Ancianos] WHERE id = @id");
        return res
            .status(200)
            .json({ message: "Registro eliminado exitosamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al eliminar el registro" });
    }
});

export default router;
