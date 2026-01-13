import { Router } from "express";
import { getConnection } from "../sqlconfig.js";

const router = Router();

// POST /create -> crea una membresía en GM_Membresias
router.post("/create", async (req, res) => {
    const body = req.body || {};
    const nombre = body.nombre || body.Nombre;
    const precio = body.precio || body.Precio;
    const duracionMeses = typeof body.duracionMeses !== "undefined" ? body.duracionMeses : body.DuracionMeses;
    const descripcion = body.descripcion || body.Descripcion || null;

    const missing = [];
    if (!nombre) missing.push("nombre");
    if (precio === undefined || precio === null) missing.push("precio");
    if (duracionMeses === undefined || duracionMeses === null) missing.push("duracionMeses");

    if (missing.length > 0) {
        return res.status(400).json({ error: "Faltan campos requeridos", missing });
    }

    try {
        const pool = await getConnection();
        const reqDB = pool
            .request()
            .input("nombre", nombre)
            .input("precio", precio)
            .input("duracionMeses", duracionMeses)
            .input("descripcion", descripcion);

        const insertQuery = `
            INSERT INTO GM_Membresias (nombre, precio, duracionMeses, descripcion)
            OUTPUT INSERTED.membresiaId
            VALUES (@nombre, @precio, @duracionMeses, @descripcion)
        `;

        const result = await reqDB.query(insertQuery);
        const inserted = result.recordset && result.recordset[0] ? result.recordset[0] : null;
        return res.status(201).json({ membresiaId: inserted ? inserted.membresiaId : null, nombre, precio, duracionMeses, descripcion });
    } catch (err) {
        console.error(err);
        const msg = String(err.message || err).toLowerCase();
        if (msg.includes("unique") || msg.includes("uq_") || msg.includes("duplicate")) {
            return res.status(409).json({ error: "Nombre de membresía duplicado" });
        }
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Opcional: listar membresías
router.get("/getall", async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT membresiaId, nombre, precio, duracionMeses, descripcion FROM GM_Membresias ORDER BY membresiaId");
        return res.status(200).json({ membresias: result.recordset });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error interno al obtener membresías" });
    }
});

export default router;