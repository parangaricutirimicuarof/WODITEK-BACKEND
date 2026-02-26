import { Router } from "express";
import { getConnection } from "../services/sqlconfig.js";

const router = Router();

// Crear un registro en la tabla SRM_Incidencias
router.post("/create", async (req, res) => {
    const body = req.body || {};
    const {
        proyecto,
        fecha,
        estacionIdentificada,
        equipo,
        descripcionIncidencia,
        foto,
        motivo,
        accion,
        descripcionAccion,
        responsable
    } = body;

    // Validación básica de campos requeridos (foto asume vacío, descripcionAccion es NULL)
    if (!proyecto || !fecha || !estacionIdentificada || !equipo || !descripcionIncidencia || !motivo || !accion || !responsable) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("proyecto", proyecto)
            .input("fecha", fecha)
            .input("estacionIdentificada", estacionIdentificada)
            .input("equipo", equipo)
            .input("descripcionIncidencia", descripcionIncidencia)
            .input("foto", foto || "") // NOT NULL pero puede venir vacío del front
            .input("motivo", motivo)
            .input("accion", accion)
            .input("descripcionAccion", descripcionAccion || null) // Permite NULL según tu script
            .input("responsable", responsable)
            .query(`
        INSERT INTO [SRM_Incidencias] (
          createdAt, proyecto, fecha, estacionIdentificada, equipo, descripcionIncidencia, 
          foto, motivo, accion, descripcionAccion, responsable
        )
        OUTPUT INSERTED.id
        VALUES (
          GETDATE(), @proyecto, @fecha, @estacionIdentificada, @equipo, @descripcionIncidencia, 
          @foto, @motivo, @accion, @descripcionAccion, @responsable
        )
      `);

        return res.status(201).json({
            id: result.recordset[0].id,
            message: "Incidencia registrada exitosamente",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error interno al registrar la incidencia" });
    }
});

// Obtener todos los registros
router.get("/getall", async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .query(`
        SELECT id, createdAt, proyecto, fecha, estacionIdentificada, equipo, descripcionIncidencia, 
        foto, motivo, accion, descripcionAccion, responsable 
        FROM [SRM_Incidencias] 
        ORDER BY id DESC
      `);
        return res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener registros de incidencias" });
    }
});

// Actualizar registro
router.put("/update/:id", async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const {
        proyecto,
        fecha,
        estacionIdentificada,
        equipo,
        descripcionIncidencia,
        foto,
        motivo,
        accion,
        descripcionAccion,
        responsable
    } = body;

    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool
            .request()
            .input("id", id)
            .query("SELECT id FROM [SRM_Incidencias] WHERE id = @id");

        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Registro de incidencia no encontrado" });
        }

        await pool
            .request()
            .input("id", id)
            .input("proyecto", proyecto)
            .input("fecha", fecha)
            .input("estacionIdentificada", estacionIdentificada)
            .input("equipo", equipo)
            .input("descripcionIncidencia", descripcionIncidencia)
            .input("foto", foto || "")
            .input("motivo", motivo)
            .input("accion", accion)
            .input("descripcionAccion", descripcionAccion || null)
            .input("responsable", responsable)
            .query(`
        UPDATE [SRM_Incidencias]
        SET 
          proyecto = @proyecto,
          fecha = @fecha,
          estacionIdentificada = @estacionIdentificada,
          equipo = @equipo,
          descripcionIncidencia = @descripcionIncidencia,
          foto = @foto,
          motivo = @motivo,
          accion = @accion,
          descripcionAccion = @descripcionAccion,
          responsable = @responsable
        WHERE id = @id
      `);

        return res.status(200).json({ message: "Registro de incidencia actualizado correctamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al actualizar registro de incidencia" });
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
            .query("SELECT id FROM [SRM_Incidencias] WHERE id = @id");

        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Registro de incidencia no encontrado" });
        }

        await pool
            .request()
            .input("id", id)
            .query("DELETE FROM [SRM_Incidencias] WHERE id = @id");
        return res.status(200).json({ message: "Registro de incidencia eliminado exitosamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al eliminar registro de incidencia" });
    }
});

export default router;
