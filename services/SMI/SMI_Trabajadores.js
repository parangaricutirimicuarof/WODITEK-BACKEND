import { Router } from "express";
import { getConnection } from "../sqlconfig.js";

const router = Router();

// Crear un trabajador nuevo
router.post("/create", async (req, res) => {
    const body = req.body || {};
    const {
        nombresYApellidos,
        dni,
        cargo,
        sistemaPensionario,
        fechaIngreso,
        fechaCese,
        numeroHijos,
        cussp,
        sueldoPactado,
        entidadAfp,
        area,
        direccion,
        fechaNacimiento,
        sexo,
        nacionalidad
    } = body;

    const missing = [];
    if (!nombresYApellidos) missing.push("nombresYApellidos");
    if (!dni) missing.push("dni");
    if (!cargo) missing.push("cargo");
    if (!sistemaPensionario) missing.push("sistemaPensionario");

    if (missing.length > 0) {
        return res.status(400).json({ error: "Faltan campos requeridos", missing });
    }

    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("nombresYApellidos", nombresYApellidos)
            .input("dni", dni)
            .input("cargo", cargo)
            .input("sistemaPensionario", sistemaPensionario)
            .input("fechaIngreso", fechaIngreso || null)
            .input("fechaCese", fechaCese || null)
            .input("numeroHijos", numeroHijos || 0)
            .input("cussp", cussp || null)
            .input("sueldoPactado", sueldoPactado || null)
            .input("entidadAfp", entidadAfp || null)
            .input("area", area || null)
            .input("direccion", direccion || null)
            .input("fechaNacimiento", fechaNacimiento || null)
            .input("sexo", sexo || null)
            .input("nacionalidad", nacionalidad || null)
            .query(`
        INSERT INTO SMI_Trabajador (createdAt, nombresYApellidos, dni, cargo, sistemaPensionario, fechaIngreso, fechaCese, numeroHijos, cussp, sueldoPactado, entidadAfp, area, direccion, fechaNacimiento, sexo, nacionalidad)
        OUTPUT INSERTED.id
        VALUES (GETDATE(), @nombresYApellidos, @dni, @cargo, @sistemaPensionario, @fechaIngreso, @fechaCese, @numeroHijos, @cussp, @sueldoPactado, @entidadAfp, @area, @direccion, @fechaNacimiento, @sexo, @nacionalidad)
      `);

        return res.status(201).json({
            id: result.recordset[0].id,
            message: "Trabajador creado exitosamente"
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error interno, no se pudo crear el trabajador" });
    }
});

// Obtener todos los trabajadores
router.get("/getall", async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT * FROM SMI_Trabajador ORDER BY id DESC");
        return res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener trabajadores" });
    }
});

// Actualizar un trabajador
router.put("/update/:id", async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const {
        nombresYApellidos,
        dni,
        cargo,
        sistemaPensionario,
        fechaIngreso,
        fechaCese,
        numeroHijos,
        cussp,
        sueldoPactado,
        entidadAfp,
        area,
        direccion,
        fechaNacimiento,
        sexo,
        nacionalidad
    } = body;

    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool.request().input("id", id).query("SELECT id FROM SMI_Trabajador WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Trabajador no encontrado" });
        }

        await pool
            .request()
            .input("id", id)
            .input("nombresYApellidos", nombresYApellidos)
            .input("dni", dni)
            .input("cargo", cargo)
            .input("sistemaPensionario", sistemaPensionario)
            .input("fechaIngreso", fechaIngreso || null)
            .input("fechaCese", fechaCese || null)
            .input("numeroHijos", numeroHijos || 0)
            .input("cussp", cussp || null)
            .input("sueldoPactado", sueldoPactado || null)
            .input("entidadAfp", entidadAfp || null)
            .input("area", area || null)
            .input("direccion", direccion || null)
            .input("fechaNacimiento", fechaNacimiento || null)
            .input("sexo", sexo || null)
            .input("nacionalidad", nacionalidad || null)
            .query(`
        UPDATE SMI_Trabajador
        SET 
          nombresYApellidos = @nombresYApellidos,
          dni = @dni,
          cargo = @cargo,
          sistemaPensionario = @sistemaPensionario,
          fechaIngreso = @fechaIngreso,
          fechaCese = @fechaCese,
          numeroHijos = @numeroHijos,
          cussp = @cussp,
          sueldoPactado = @sueldoPactado,
          entidadAfp = @entidadAfp,
          area = @area,
          direccion = @direccion,
          fechaNacimiento = @fechaNacimiento,
          sexo = @sexo,
          nacionalidad = @nacionalidad
        WHERE id = @id
      `);

        return res.status(200).json({ message: "Trabajador actualizado correctamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al actualizar trabajador" });
    }
});

// Eliminar un trabajador
router.delete("/delete/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool.request().input("id", id).query("SELECT id FROM SMI_Trabajador WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Trabajador no encontrado" });
        }

        await pool.request().input("id", id).query("DELETE FROM SMI_Trabajador WHERE id = @id");
        return res.status(200).json({ message: "Trabajador eliminado exitosamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al eliminar trabajador" });
    }
});

export default router;
