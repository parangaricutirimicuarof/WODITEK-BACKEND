import { Router } from "express";
import { getConnection } from "../sqlconfig.js";

const router = Router();

// POST /auth -> valida usuario contra la tabla GM_Usuarios
router.post("/auth", async (req, res) => {
	const { user, pass } = req.body || {};
	if (!user || !pass) return res.status(400).json({ error: "Faltan campos: user y pass" });
	try {
		const pool = await getConnection();
		const result = await pool
			.request()
			.input("user", user)
			.input("pass", pass)
			.query("SELECT id, nombre, apellido, usuario FROM GM_Usuarios WHERE usuario = @user AND pass = @pass");

		if (result.recordset.length === 0) {
			return res.status(401).json({ success: false, message: "Credenciales inválidas" });
		}

		const found = result.recordset[0];
		return res.status(200).json({ success: true, user: found });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Error interno del servidor" });
	}
});

// POST /create -> crea un usuario en GM_Usuarios
router.post("/create", async (req, res) => {
	const { nombre, apellido, usuario, pass } = req.body || {};
	if (!nombre || !apellido || !usuario || !pass) {
		return res.status(400).json({ error: "Faltan campos: nombre, apellido, usuario, pass" });
	}
	try {
		const pool = await getConnection();
		const result = await pool
			.request()
			.input("nombre", nombre)
			.input("apellido", apellido)
			.input("pass", pass)
			.input("usuario", usuario)
			.query(
				"INSERT INTO GM_Usuarios (nombre, apellido, pass, usuario) OUTPUT INSERTED.id VALUES (@nombre, @apellido, @pass, @usuario)"
			);

		const insertedId = result.recordset && result.recordset[0] ? result.recordset[0].id : null;
		return res.status(201).json({ id: insertedId, nombre, apellido, usuario });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Error interno del servidor" });
	}
});

// GET /getall -> devuelve todos los usuarios (sin contraseña)
router.get("/getall", async (req, res) => {
	try {
		const pool = await getConnection();
		const result = await pool.request().query("SELECT id, nombre, apellido, usuario FROM GM_Usuarios ORDER BY id");
		return res.status(200).json({ users: result.recordset });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Error interno del servidor" });
	}
});

export default router;