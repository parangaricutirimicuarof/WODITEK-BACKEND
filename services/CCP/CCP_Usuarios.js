import { Router } from "express";
import { getConnection } from "../sqlconfig.js";

const router = Router();

// Login de usuario
router.post("/login", async (req, res) => {
    const { usuario, password } = req.body || {};

    if (!usuario || !password) {
        return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
    }

    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("usuario", usuario)
            .input("password", password)
            .query("SELECT id, createdAt, usuario, acceso FROM [CCP_Usuario] WHERE usuario = @usuario AND password = @password");

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        return res.status(200).json({ message: "Login exitoso", user: result.recordset[0] });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error interno al iniciar sesión" });
    }
});

// Crear un registro en la tabla CCP_Usuario
router.post("/create", async (req, res) => {
    const body = req.body || {};
    const { usuario, password, acceso } = body;

    if (!usuario || !password || !acceso) {
        return res.status(400).json({ error: "Usuario, contraseña y acceso son requeridos" });
    }

    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("usuario", usuario)
            .input("password", password)
            .input("acceso", acceso)
            .query(`
        INSERT INTO [CCP_Usuario] (createdAt, usuario, password, acceso)
        OUTPUT INSERTED.id
        VALUES (GETDATE(), @usuario, @password, @acceso)
      `);

        return res.status(201).json({
            id: result.recordset[0].id,
            message: "Usuario creado exitosamente",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error interno al crear usuario" });
    }
});

// Obtener todos los registros
router.get("/getall", async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .query("SELECT id, createdAt, usuario, password, acceso FROM [CCP_Usuario] ORDER BY id DESC");
        return res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

// Actualizar registro
router.put("/update/:id", async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const { usuario, password, acceso } = body;

    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool
            .request()
            .input("id", id)
            .query("SELECT id FROM [CCP_Usuario] WHERE id = @id");

        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        await pool
            .request()
            .input("id", id)
            .input("usuario", usuario)
            .input("password", password)
            .input("acceso", acceso)
            .query(`
        UPDATE [CCP_Usuario]
        SET 
          usuario = @usuario,
          password = @password,
          acceso = @acceso
        WHERE id = @id
      `);

        return res.status(200).json({ message: "Usuario actualizado correctamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al actualizar usuario" });
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
            .query("SELECT id FROM [CCP_Usuario] WHERE id = @id");

        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        await pool
            .request()
            .input("id", id)
            .query("DELETE FROM [CCP_Usuario] WHERE id = @id");
        return res.status(200).json({ message: "Usuario eliminado exitosamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al eliminar usuario" });
    }
});

export default router;