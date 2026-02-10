import { Router } from "express";
import { getConnection } from "../sqlconfig.js";

const router = Router();

// Crear un registro en la tabla CCP_SantaCena
router.post("/create", async (req, res) => {
    const body = req.body || {};
    const { fecha, hora, nHermanos, nHermanas, salaOracion_Id, anciano_Id } = body;

    if (!fecha || !hora || nHermanos === undefined || nHermanas === undefined || !salaOracion_Id || !anciano_Id) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("fecha", fecha)
            .input("hora", hora)
            .input("nHermanos", nHermanos)
            .input("nHermanas", nHermanas)
            .input("salaOracion_Id", salaOracion_Id)
            .input("anciano_Id", anciano_Id)
            .query(`
        INSERT INTO [CCP_SantaCena] (createdAt, fecha, hora, nHermanos, nHermanas, salaOracion_Id, anciano_Id)
        OUTPUT INSERTED.id
        VALUES (GETDATE(), @fecha, @hora, @nHermanos, @nHermanas, @salaOracion_Id, @anciano_Id)
      `);

        return res.status(201).json({
            id: result.recordset[0].id,
            message: "Santa Cena registrada exitosamente",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error interno al registrar Santa Cena" });
    }
});

// Obtener todos los registros
router.get("/getall", async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .query("SELECT id, createdAt, fecha, hora, nHermanos, nHermanas, salaOracion_Id, anciano_Id FROM [CCP_SantaCena] ORDER BY id DESC");
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
    const { fecha, hora, nHermanos, nHermanas, salaOracion_Id, anciano_Id } = body;

    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool
            .request()
            .input("id", id)
            .query("SELECT id FROM [CCP_SantaCena] WHERE id = @id");

        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        await pool
            .request()
            .input("id", id)
            .input("fecha", fecha)
            .input("hora", hora)
            .input("nHermanos", nHermanos)
            .input("nHermanas", nHermanas)
            .input("salaOracion_Id", salaOracion_Id)
            .input("anciano_Id", anciano_Id)
            .query(`
        UPDATE [CCP_SantaCena]
        SET 
          fecha = @fecha,
          hora = @hora,
          nHermanos = @nHermanos,
          nHermanas = @nHermanas,
          salaOracion_Id = @salaOracion_Id,
          anciano_Id = @anciano_Id
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
            .query("SELECT id FROM [CCP_SantaCena] WHERE id = @id");

        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Registro no encontrado" });
        }

        await pool
            .request()
            .input("id", id)
            .query("DELETE FROM [CCP_SantaCena] WHERE id = @id");
        return res.status(200).json({ message: "Registro eliminado exitosamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al eliminar registro" });
    }
});

export default router;
