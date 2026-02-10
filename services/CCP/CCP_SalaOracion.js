import { Router } from "express";
import { getConnection } from "../sqlconfig.js";

const router = Router();

// Crear un registro en la tabla CCP_SalaOracion
router.post("/create", async (req, res) => {
    const body = req.body || {};
    const { nombre, codigo } = body;

    if (!nombre || !codigo) {
        return res.status(400).json({ error: "Nombre y código son requeridos" });
    }

    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("nombre", nombre)
            .input("codigo", codigo)
            .query(`
        INSERT INTO [CCP_SalaOracion] (createdAt, nombre, codigo)
        OUTPUT INSERTED.id
        VALUES (GETDATE(), @nombre, @codigo)
      `);

        return res.status(201).json({
            id: result.recordset[0].id,
            message: "Sala de Oración creada exitosamente",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error interno al crear sala de oración" });
    }
});

// Obtener todos los registros
router.get("/getall", async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .query("SELECT id, createdAt, nombre, codigo FROM [CCP_SalaOracion] ORDER BY id DESC");
        return res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener registros" });
    }
});

// Actualizar registro
router.put("/update/:id", async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const { nombre, codigo } = body;

    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool
            .request()
            .input("id", id)
            .query("SELECT id FROM [CCP_SalaOracion] WHERE id = @id");

        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        await pool
            .request()
            .input("id", id)
            .input("nombre", nombre)
            .input("codigo", codigo)
            .query(`
        UPDATE [CCP_SalaOracion]
        SET 
          nombre = @nombre,
          codigo = @codigo
        WHERE id = @id
      `);

        return res.status(200).json({ message: "Registro actualizado correctamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al actualizar registro" });
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
            .query("SELECT id FROM [CCP_SalaOracion] WHERE id = @id");

        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        await pool
            .request()
            .input("id", id)
            .query("DELETE FROM [CCP_SalaOracion] WHERE id = @id");
        return res.status(200).json({ message: "Registro eliminado exitosamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al eliminar registro" });
    }
});

export default router;
