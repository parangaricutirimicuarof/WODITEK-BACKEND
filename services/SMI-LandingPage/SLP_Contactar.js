import { Router } from "express";
import { getConnection } from "../sqlconfig.js";

const router = Router();

// Crear un registro en la tabla PRUEBA
router.post("/create", async (req, res) => {
    const body = req.body || {};
    const { nombre, apellido, email } = body;

    if (!nombre || !apellido || !email) {
        return res.status(400).json({ error: "Nombre, apellido y correo electrónico son requeridos" });
    }

    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("nombre", nombre)
            .input("apellido", apellido)
            .input("email", email)
            .query(`
        INSERT INTO [PRUEBA] (createdAt, nombre, apellido, [correo electronico])
        OUTPUT INSERTED.id
        VALUES (GETDATE(), @nombre, @apellido, @email)
      `);

        return res.status(201).json({
            id: result.recordset[0].id,
            message: "Registro creado exitosamente"
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error interno al crear registro" });
    }
});

// Obtener todos los registros
router.get("/getall", async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT id, createdAt, nombre, apellido, [correo electronico] as email FROM [PRUEBA] ORDER BY id DESC");
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
    const { nombre, apellido, email } = body;

    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool.request().input("id", id).query("SELECT id FROM [PRUEBA] WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        await pool
            .request()
            .input("id", id)
            .input("nombre", nombre)
            .input("apellido", apellido)
            .input("email", email)
            .query(`
        UPDATE [PRUEBA]
        SET 
          nombre = @nombre,
          apellido = @apellido,
          [correo electronico] = @email
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
        const exists = await pool.request().input("id", id).query("SELECT id FROM [PRUEBA] WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        await pool.request().input("id", id).query("DELETE FROM [PRUEBA] WHERE id = @id");
        return res.status(200).json({ message: "Registro eliminado exitosamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al eliminar registro" });
    }
});

export default router;
