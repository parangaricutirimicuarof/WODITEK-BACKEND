import { Router } from "express";
import { getConnection } from "../services/sqlconfig.js";

const router = Router();

// Crear un registro en la tabla SRM_Usuarios
router.post("/create", async (req, res) => {
    const body = req.body || {};
    const { usuario, password } = body;

    if (!usuario || !password) {
        return res.status(400).json({ error: "El usuario y la contraseña son requeridos" });
    }

    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("usuario", usuario)
            .input("password", password)
            .query(`
        INSERT INTO [SRM_Usuarios] (createdAt, usuario, password)
        OUTPUT INSERTED.id
        VALUES (GETDATE(), @usuario, @password)
      `);

        return res.status(201).json({
            id: result.recordset[0].id,
            message: "Usuario registrado exitosamente",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error interno al registrar el usuario" });
    }
});

// Verificar credenciales (Login)
router.post("/login", async (req, res) => {
    const body = req.body || {};
    const { usuario, password } = body;

    if (!usuario || !password) {
        return res.status(400).json({ error: "El usuario y la contraseña son requeridos" });
    }

    try {
        const pool = await getConnection();

        // Consultar a la base de datos si existe un usuario con esas credenciales exactas
        const result = await pool
            .request()
            .input("usuario", usuario)
            .input("password", password)
            .query("SELECT id, usuario FROM [SRM_Usuarios] WHERE usuario = @usuario AND password = @password");

        // Si no se encuentra un registro, las credenciales son incorrectas
        if (result.recordset.length === 0) {
            return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        }

        // Si las credenciales son correctas, respondemos confirmando el acceso
        return res.status(200).json({
            message: "Autenticación exitosa",
            user: result.recordset[0]
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error interno al verificar credenciales" });
    }
});

// Obtener todos los registros
router.get("/getall", async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .query("SELECT id, createdAt, usuario, password FROM [SRM_Usuarios] ORDER BY id DESC");
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
    const { usuario, password } = body;

    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool
            .request()
            .input("id", id)
            .query("SELECT id FROM [SRM_Usuarios] WHERE id = @id");

        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        await pool
            .request()
            .input("id", id)
            .input("usuario", usuario)
            .input("password", password)
            .query(`
        UPDATE [SRM_Usuarios]
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

// Eliminar registro
router.delete("/delete/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();

        // Verificar existencia
        const exists = await pool
            .request()
            .input("id", id)
            .query("SELECT id FROM [SRM_Usuarios] WHERE id = @id");

        if (exists.recordset.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        await pool
            .request()
            .input("id", id)
            .query("DELETE FROM [SRM_Usuarios] WHERE id = @id");
        return res.status(200).json({ message: "Usuario eliminado exitosamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al eliminar usuario" });
    }
});

export default router;
