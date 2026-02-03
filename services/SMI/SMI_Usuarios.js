import { Router } from "express";
import { getConnection } from "../sqlconfig.js";

const router = Router();

// Crear un Usuario SMI
router.post("/create", async (req, res) => {
    const body = req.body || {};
    const { usuario, password } = body;

    if (!usuario || !password) {
        return res.status(400).json({ error: "Usuario y password son requeridos" });
    }

    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("usuario", usuario)
            .input("password", password)
            .query(`
        INSERT INTO SMI_Usuarios (createdAt, usuario, password)
        OUTPUT INSERTED.id
        VALUES (GETDATE(), @usuario, @password)
      `);

        return res.status(201).json({
            id: result.recordset[0].id,
            message: "Usuario creado exitosamente"
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error interno al crear usuario" });
    }
});

// Obtener todos
router.get("/getall", async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT id, createdAt, usuario, password FROM SMI_Usuarios ORDER BY id DESC");
        return res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

// Login simple (verificación directa, idealmente usar hashing en producción)
router.post("/login", async (req, res) => {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
        return res.status(400).json({ error: "Faltan credenciales" });
    }

    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("usuario", usuario)
            .input("password", password)
            .query("SELECT id, usuario FROM SMI_Usuarios WHERE usuario = @usuario AND password = @password");

        if (result.recordset.length > 0) {
            return res.status(200).json({ message: "Login exitoso", user: result.recordset[0] });
        } else {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error en el login" });
    }
});

// Actualizar
router.put("/update/:id", async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const { usuario, password } = body;

    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool.request().input("id", id).query("SELECT id FROM SMI_Usuarios WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        await pool
            .request()
            .input("id", id)
            .input("usuario", usuario)
            .input("password", password)
            .query(`
        UPDATE SMI_Usuarios
        SET 
          usuario = @usuario,
          password = @password
        WHERE id = @id
      `);

        return res.status(200).json({ message: "Usuario actualizado correctamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al actualizar usuario" });
    }
});

// Eliminar
router.delete("/delete/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool.request().input("id", id).query("SELECT id FROM SMI_Usuarios WHERE id = @id");
        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        await pool.request().input("id", id).query("DELETE FROM SMI_Usuarios WHERE id = @id");
        return res.status(200).json({ message: "Usuario eliminado exitosamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al eliminar usuario" });
    }
});

export default router;
