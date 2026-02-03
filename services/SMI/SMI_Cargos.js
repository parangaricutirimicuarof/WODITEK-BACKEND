import { Router } from "express";
import { getConnection } from "../sqlconfig.js";

const router = Router();

// Crear un Cargo
router.post("/create", async (req, res) => {
    const body = req.body || {};
    const { nombre } = body;

    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("nombre", nombre)
            .query(`
        INSERT INTO SMI_Cargo (createdAt, nombre)
        OUTPUT INSERTED.id
        VALUES (GETDATE(), @nombre)
      `);

        return res.status(201).json({
            id: result.recordset[0].id,
            message: "Cargo creado exitosamente"
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error interno al crear Cargo" });
    }
});

// Obtener todos
router.get("/getall", async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT * FROM SMI_Cargo ORDER BY id DESC");
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
    const { nombre } = body;

    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool.request().input("id", id).query("SELECT id FROM SMI_Cargo WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        await pool
            .request()
            .input("id", id)
            .input("nombre", nombre)
            .query(`
        UPDATE SMI_Cargo
        SET 
          nombre = @nombre
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

        // Verificar existencia en tabla principal
        const exists = await pool.request().input("id", id).query("SELECT id FROM SMI_Cargo WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        // 1. Eliminar referencias en SMI_TrabajadorRegimen (CASCADE manual)


        // 2. Eliminar el registro principal
        await pool.request().input("id", id).query("DELETE FROM SMI_Cargo WHERE id = @id");

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
        const result = await pool.request().input("id", id).query("SELECT * FROM SMI_Cargo WHERE id = @id");
        return res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener registro" });
    }
});

export default router;