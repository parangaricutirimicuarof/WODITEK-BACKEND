import { Router } from "express";
import { getConnection } from "../sqlconfig.js";

const router = Router();

// Crear un entrenador nuevo en la tabla GM_Entrenadores
router.post("/create", async (req, res) => {
  const body = req.body || {};
  const nombre = body.nombre || body.Nombre;
  const apellido = body.apellido || body.Apellido;
  const especialidad = body.especialidad || body.Especialidad;
  const telefono = body.telefono || body.Telefono;
  const horarioTrabajo = body.horarioTrabajo || body.HorarioTrabajo;

  const missing = [];
  if (!nombre) missing.push("nombre");
  if (!apellido) missing.push("apellido");
  if (!especialidad) missing.push("especialidad");
  if (!telefono) missing.push("telefono");
  if (!horarioTrabajo) missing.push("horarioTrabajo");

  if (missing.length > 0) return res.status(400).json({ error: "Faltan campos requeridos", missing });

  try {
    const pool = await getConnection();
    const reqDB = pool
      .request()
      .input("nombre", nombre)
      .input("apellido", apellido)
      .input("especialidad", especialidad)
      .input("telefono", telefono)
      .input("horarioTrabajo", horarioTrabajo);

    const insertQuery = `
      INSERT INTO GM_Entrenadores (nombre, apellido, especialidad, telefono, horarioTrabajo)
      OUTPUT INSERTED.entrenadorId
      VALUES (@nombre, @apellido, @especialidad, @telefono, @horarioTrabajo)
    `;

    const result = await reqDB.query(insertQuery);
    const inserted = result.recordset && result.recordset[0] ? result.recordset[0] : null;
    return res.status(201).json({ entrenadorId: inserted ? inserted.entrenadorId : null, nombre, apellido, especialidad, telefono, horarioTrabajo });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al crear entrenador" });
  }
});

// Actualizar un entrenador por id
router.put("/update/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  const body = req.body || {};
  const nombre = body.nombre || body.Nombre;
  const apellido = body.apellido || body.Apellido;
  const especialidad = body.especialidad || body.Especialidad;
  const telefono = body.telefono || body.Telefono;
  const horarioTrabajo = body.horarioTrabajo || body.HorarioTrabajo;

  if (!nombre && !apellido && !especialidad && !telefono && !horarioTrabajo) {
    return res.status(400).json({ error: "No hay campos para actualizar" });
  }

  try {
    const pool = await getConnection();

    const exists = await pool.request().input("id", id).query("SELECT entrenadorId FROM GM_Entrenadores WHERE entrenadorId = @id");
    if (!exists.recordset || exists.recordset.length === 0) return res.status(404).json({ error: "Entrenador no encontrado" });

    const updates = [];
    if (nombre) updates.push(`nombre = @nombre`);
    if (apellido) updates.push(`apellido = @apellido`);
    if (especialidad) updates.push(`especialidad = @especialidad`);
    if (telefono) updates.push(`telefono = @telefono`);
    if (horarioTrabajo) updates.push(`horarioTrabajo = @horarioTrabajo`);

    const updateQuery = `UPDATE GM_Entrenadores SET ${updates.join(", ")} WHERE entrenadorId = @id`;

    const reqDB = pool.request().input("id", id);
    if (nombre) reqDB.input("nombre", nombre);
    if (apellido) reqDB.input("apellido", apellido);
    if (especialidad) reqDB.input("especialidad", especialidad);
    if (telefono) reqDB.input("telefono", telefono);
    if (horarioTrabajo) reqDB.input("horarioTrabajo", horarioTrabajo);

    await reqDB.query(updateQuery);
    const updated = await pool.request().input("id", id).query("SELECT entrenadorId, nombre, apellido, especialidad, telefono, horarioTrabajo FROM GM_Entrenadores WHERE entrenadorId = @id");
    return res.status(200).json({ entrenador: updated.recordset[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al actualizar entrenador" });
  }
});

// Eliminar un entrenador por id
router.delete("/delete/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  try {
    const pool = await getConnection();
    const exists = await pool.request().input("id", id).query("SELECT entrenadorId, nombre, apellido FROM GM_Entrenadores WHERE entrenadorId = @id");
    if (!exists.recordset || exists.recordset.length === 0) return res.status(404).json({ error: "Entrenador no encontrado" });

    try {
      await pool.request().input("id", id).query("DELETE FROM GM_Entrenadores WHERE entrenadorId = @id");
      return res.status(200).json({ deletedId: id });
    } catch (err) {
      const msg = String(err.message || err).toLowerCase();
      if (msg.includes("reference") || msg.includes("foreign key") || msg.includes("conflicted")) {
        return res.status(409).json({ error: "No se puede eliminar: existe una referencia externa (constraint)" });
      }
      console.error(err);
      return res.status(500).json({ error: "Error eliminando entrenador" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener todos los entrenadores
router.get("/getall", async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT entrenadorId, nombre, apellido, especialidad, telefono, horarioTrabajo FROM GM_Entrenadores ORDER BY entrenadorId");
    return res.status(200).json({ entrenadores: result.recordset });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al obtener entrenadores" });
  }
});

export default router;
