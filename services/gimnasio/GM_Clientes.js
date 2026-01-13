import { Router } from "express";
import { getConnection } from "../sqlconfig.js";

const router = Router();

// Crear un cliente nuevo y persistir en SQL Server
router.post("/create", async (req, res) => {
  const body = req.body || {};
  const Nombre = body.Nombre || body.nombre;
  const Apellido = body.Apellido || body.apellido;
  const DNI = body.DNI || body.dni;
  const Email = body.Email || body.email;
  const Telefono = body.Telefono || body.telefono;
  const EntrenadorId = typeof body.EntrenadorId !== "undefined" ? body.EntrenadorId : body.entrenadorId;
  const MembresiaId = typeof body.MembresiaId !== "undefined" ? body.MembresiaId : body.membresiaId;
  
  const missing = [];
  if (!Nombre) missing.push("nombre");
  if (!Apellido) missing.push("apellido");
  if (!DNI) missing.push("dni");
  if (!Email) missing.push("email");
  if (!Telefono) missing.push("telefono");
  if (MembresiaId === undefined || MembresiaId === null) missing.push("membresiaId");

  if (missing.length > 0) {
    return res.status(400).json({ error: "Faltan campos requeridos", missing });
  }

  const dniStr = String(DNI).trim();
  if (dniStr.length !== 8) {
    return res.status(400).json({ error: "DNI debe tener exactamente 8 caracteres" });
  }

  try {
    const pool = await getConnection();

    const reqDB = pool
      .request()
      .input("Nombre", Nombre)
      .input("Apellido", Apellido)
      .input("DNI", dniStr)
      .input("Email", Email)
      .input("Telefono", Telefono)
      .input("EntrenadorId", EntrenadorId || null)
      .input("MembresiaId", MembresiaId);

    const insertQuery = `
      INSERT INTO GM_Clientes (nombre, apellido, dni, email, telefono, entrenadorId, membresiaId)
      OUTPUT INSERTED.clienteId, INSERTED.codigoAcceso
      VALUES (@Nombre, @Apellido, @DNI, @Email, @Telefono, @EntrenadorId, @MembresiaId)
    `;

    const result = await reqDB.query(insertQuery);
    const inserted = result.recordset && result.recordset[0] ? result.recordset[0] : null;
    return res.status(201).json({ clienteId: inserted ? inserted.clienteId : null, codigoAcceso: inserted ? inserted.codigoAcceso : null });
  } catch (err) {
    console.error(err);
    const msg = String(err.message || err);
    if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("uq_")) {
      return res.status(409).json({ error: "Violación de unicidad (DNI o Email ya existe)" });
    }
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Actualizar un cliente por id
router.put("/update/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  // Keep in-memory update for backward compatibility; consider migrating to DB later
  return res.status(501).json({ error: "Not implemented: update via DB (pendiente)" });
});

// Eliminar un cliente por id
router.delete("/delete/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  try {
    const pool = await getConnection();

    const exists = await pool.request().input("id", id).query("SELECT clienteId FROM GM_Clientes WHERE clienteId = @id");
    if (!exists.recordset || exists.recordset.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    try {
      await pool.request().input("id", id).query("DELETE FROM GM_Clientes WHERE clienteId = @id");
      return res.status(200).json({ deletedId: id });
    } catch (err) {
      const msg = String(err.message || err).toLowerCase();
      if (msg.includes("reference") || msg.includes("foreign key") || msg.includes("conflicted")) {
        return res.status(409).json({ error: "No se puede eliminar: existe una referencia externa (constraint)" });
      }
      console.error(err);
      return res.status(500).json({ error: "Error eliminando cliente" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/getall", async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(
      "SELECT clienteId, nombre, apellido, dni, email, telefono, entrenadorId, membresiaId, fechaRegistro FROM GM_Clientes ORDER BY clienteId"
    );
    return res.status(200).json({ clients: result.recordset });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al obtener clientes" });
  }
});

export default router;
