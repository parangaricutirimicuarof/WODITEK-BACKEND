import { Router } from "express";
import { getConnection } from "../services/sqlconfig.js";

const router = Router();

// Crear un registro en la tabla SRM_Piezas
router.post("/create", async (req, res) => {
    const body = req.body || {};
    const {
        proyecto,
        fecha,
        estacionOrigen,
        equipoOrigen,
        estacionDestino,
        equipoDestino,
        nombrePieza,
        cantidad,
        fotos,
        motivo,
        observacion,
        responsableTKE,
        responsableSMI,
        proyectoDestino
    } = body;

    // Validación básica de campos requeridos
    if (!proyecto || !fecha || !estacionOrigen || !equipoOrigen || !estacionDestino || !equipoDestino || !nombrePieza || !cantidad || !motivo || !responsableTKE || !responsableSMI) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("proyecto", proyecto)
            .input("fecha", fecha)
            .input("estacionOrigen", estacionOrigen)
            .input("equipoOrigen", equipoOrigen)
            .input("estacionDestino", estacionDestino)
            .input("equipoDestino", equipoDestino)
            .input("nombrePieza", nombrePieza)
            .input("cantidad", cantidad)
            .input("foto", fotos ? JSON.stringify(fotos) : "") // La foto o la observacion pueden no estar siempre pero la BD dice NOT NULL, asumimos strings vacíos si no llegan
            .input("motivo", motivo)
            .input("observacion", observacion || "")
            .input("responsableTKE", responsableTKE)
            .input("responsableSMI", responsableSMI)
            .input("proyectoDestino", proyectoDestino || null)
            .query(`
        INSERT INTO [SRM_Piezas] (
          createdAt, proyecto, fecha, estacionOrigen, equipoOrigen, estacionDestino, 
          equipoDestino, nombrePieza, cantidad, foto, motivo, observacion, responsableTKE, responsableSMI, proyectoDestino
        )
        OUTPUT INSERTED.id
        VALUES (
          GETDATE(), @proyecto, @fecha, @estacionOrigen, @equipoOrigen, @estacionDestino, 
          @equipoDestino, @nombrePieza, @cantidad, @foto, @motivo, @observacion, @responsableTKE, @responsableSMI, @proyectoDestino
        )
      `);

        return res.status(201).json({
            id: result.recordset[0].id,
            message: "Pieza registrada exitosamente",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error interno al registrar la pieza" });
    }
});

// Obtener todos los registros
router.get("/getall", async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .query(`
        SELECT id, createdAt, proyecto, fecha, estacionOrigen, equipoOrigen, estacionDestino, 
        equipoDestino, nombrePieza, cantidad, foto, motivo, observacion, responsableTKE, responsableSMI, proyectoDestino 
        FROM [SRM_Piezas] 
        ORDER BY id DESC
      `);
        return res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener registros de piezas" });
    }
});

// Actualizar registro
router.put("/update/:id", async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const {
        proyecto,
        fecha,
        estacionOrigen,
        equipoOrigen,
        estacionDestino,
        equipoDestino,
        nombrePieza,
        cantidad,
        fotos,
        motivo,
        observacion,
        responsableTKE,
        responsableSMI,
        proyectoDestino
    } = body;

    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool
            .request()
            .input("id", id)
            .query("SELECT id FROM [SRM_Piezas] WHERE id = @id");

        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Registro de pieza no encontrado" });
        }

        await pool
            .request()
            .input("id", id)
            .input("proyecto", proyecto)
            .input("fecha", fecha)
            .input("estacionOrigen", estacionOrigen)
            .input("equipoOrigen", equipoOrigen)
            .input("estacionDestino", estacionDestino)
            .input("equipoDestino", equipoDestino)
            .input("nombrePieza", nombrePieza)
            .input("cantidad", cantidad)
            .input("foto", fotos ? JSON.stringify(fotos) : "")
            .input("motivo", motivo)
            .input("observacion", observacion || "")
            .input("responsableTKE", responsableTKE)
            .input("responsableSMI", responsableSMI)
            .input("proyectoDestino", proyectoDestino || null)
            .query(`
        UPDATE [SRM_Piezas]
        SET 
          proyecto = @proyecto,
          fecha = @fecha,
          estacionOrigen = @estacionOrigen,
          equipoOrigen = @equipoOrigen,
          estacionDestino = @estacionDestino,
          equipoDestino = @equipoDestino,
          nombrePieza = @nombrePieza,
          cantidad = @cantidad,
          foto = @foto,
          motivo = @motivo,
          observacion = @observacion,
          responsableTKE = @responsableTKE,
          responsableSMI = @responsableSMI,
          proyectoDestino = @proyectoDestino
        WHERE id = @id
      `);

        return res.status(200).json({ message: "Registro de pieza actualizado correctamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al actualizar registro de pieza" });
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
            .query("SELECT id FROM [SRM_Piezas] WHERE id = @id");

        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Registro de pieza no encontrado" });
        }

        await pool
            .request()
            .input("id", id)
            .query("DELETE FROM [SRM_Piezas] WHERE id = @id");
        return res.status(200).json({ message: "Registro de pieza eliminado exitosamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al eliminar registro de pieza" });
    }
});

export default router;
