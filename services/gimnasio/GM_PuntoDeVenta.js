import { Router } from "express";
import { getConnection } from "../sqlconfig.js";

const router = Router();

// POST /create -> crear producto en GM_PuntoDeVenta
router.post("/create", async (req, res) => {
  const body = req.body || {};
  const nombre = body.nombre || body.Nombre;
  const categoria = body.categoria || body.Categoria;
  const stock = typeof body.stock !== "undefined" ? body.stock : body.Stock;
  const stockMin = typeof body.stockMin !== "undefined" ? body.stockMin : body.StockMin;
  const precioVenta = typeof body.precioVenta !== "undefined" ? body.precioVenta : body.PrecioVenta;
  const costoUnitario = typeof body.costoUnitario !== "undefined" ? body.costoUnitario : body.CostoUnitario;
  const url = body.url || body.URL || null;

  const missing = [];
  if (!nombre) missing.push("nombre");
  if (!categoria) missing.push("categoria");
  if (stock === undefined || stock === null) missing.push("stock");
  if (stockMin === undefined || stockMin === null) missing.push("stockMin");
  if (precioVenta === undefined || precioVenta === null) missing.push("precioVenta");
  if (costoUnitario === undefined || costoUnitario === null) missing.push("costoUnitario");

  if (missing.length > 0) return res.status(400).json({ error: "Faltan campos requeridos", missing });

  // Validaciones de rango
  if (Number(stock) < 0 || Number(stockMin) < 0) return res.status(400).json({ error: "stock y stockMin deben ser >= 0" });
  if (Number(precioVenta) < 0 || Number(costoUnitario) < 0) return res.status(400).json({ error: "precioVenta y costoUnitario deben ser >= 0" });

  try {
    const pool = await getConnection();
    const reqDB = pool
      .request()
      .input("nombre", nombre)
      .input("categoria", categoria)
      .input("stock", Number(stock))
      .input("stockMin", Number(stockMin))
      .input("precioVenta", Number(precioVenta))
      .input("costoUnitario", Number(costoUnitario))
      .input("url", url);

    const insertQuery = `
      INSERT INTO GM_PuntoDeVenta (nombre, categoria, stock, stockMin, precioVenta, costoUnitario, url)
      OUTPUT INSERTED.productoId
      VALUES (@nombre, @categoria, @stock, @stockMin, @precioVenta, @costoUnitario, @url)
    `;

    const result = await reqDB.query(insertQuery);
    const inserted = result.recordset && result.recordset[0] ? result.recordset[0] : null;
    return res.status(201).json({ productoId: inserted ? inserted.productoId : null, nombre, categoria, stock: Number(stock), stockMin: Number(stockMin), precioVenta: Number(precioVenta), costoUnitario: Number(costoUnitario), url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al crear producto" });
  }
});

// GET /getall -> listar productos
router.get("/getall", async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT productoId, nombre, categoria, stock, stockMin, precioVenta, costoUnitario, url, fechaCreación FROM GM_PuntoDeVenta ORDER BY productoId");
    return res.status(200).json({ productos: result.recordset });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al obtener productos" });
  }
});

// PUT /update/:id -> actualizar producto
router.put("/update/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  const body = req.body || {};
  const nombre = body.nombre || body.Nombre;
  const categoria = body.categoria || body.Categoria;
  const stock = typeof body.stock !== "undefined" ? body.stock : undefined;
  const stockMin = typeof body.stockMin !== "undefined" ? body.stockMin : undefined;
  const precioVenta = typeof body.precioVenta !== "undefined" ? body.precioVenta : undefined;
  const costoUnitario = typeof body.costoUnitario !== "undefined" ? body.costoUnitario : undefined;
  const url = body.url || body.URL;

  if (nombre === undefined && categoria === undefined && stock === undefined && stockMin === undefined && precioVenta === undefined && costoUnitario === undefined && url === undefined) {
    return res.status(400).json({ error: "No hay campos para actualizar" });
  }

  try {
    const pool = await getConnection();
    const exists = await pool.request().input("id", id).query("SELECT productoId FROM GM_PuntoDeVenta WHERE productoId = @id");
    if (!exists.recordset || exists.recordset.length === 0) return res.status(404).json({ error: "Producto no encontrado" });

    const updates = [];
    if (nombre) updates.push(`nombre = @nombre`);
    if (categoria) updates.push(`categoria = @categoria`);
    if (stock !== undefined) updates.push(`stock = @stock`);
    if (stockMin !== undefined) updates.push(`stockMin = @stockMin`);
    if (precioVenta !== undefined) updates.push(`precioVenta = @precioVenta`);
    if (costoUnitario !== undefined) updates.push(`costoUnitario = @costoUnitario`);
    if (url !== undefined) updates.push(`url = @url`);

    const updateQuery = `UPDATE GM_PuntoDeVenta SET ${updates.join(", ")} WHERE productoId = @id`;
    const reqDB = pool.request().input("id", id);
    if (nombre) reqDB.input("nombre", nombre);
    if (categoria) reqDB.input("categoria", categoria);
    if (stock !== undefined) reqDB.input("stock", Number(stock));
    if (stockMin !== undefined) reqDB.input("stockMin", Number(stockMin));
    if (precioVenta !== undefined) reqDB.input("precioVenta", Number(precioVenta));
    if (costoUnitario !== undefined) reqDB.input("costoUnitario", Number(costoUnitario));
    if (url !== undefined) reqDB.input("url", url);

    await reqDB.query(updateQuery);
    const updated = await pool.request().input("id", id).query("SELECT productoId, nombre, categoria, stock, stockMin, precioVenta, costoUnitario, url, fechaCreación FROM GM_PuntoDeVenta WHERE productoId = @id");
    return res.status(200).json({ producto: updated.recordset[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al actualizar producto" });
  }
});

// DELETE /delete/:id -> eliminar producto
router.delete("/delete/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  try {
    const pool = await getConnection();
    const exists = await pool.request().input("id", id).query("SELECT productoId FROM GM_PuntoDeVenta WHERE productoId = @id");
    if (!exists.recordset || exists.recordset.length === 0) return res.status(404).json({ error: "Producto no encontrado" });

    try {
      await pool.request().input("id", id).query("DELETE FROM GM_PuntoDeVenta WHERE productoId = @id");
      return res.status(200).json({ deletedId: id });
    } catch (err) {
      const msg = String(err.message || err).toLowerCase();
      if (msg.includes("reference") || msg.includes("foreign key") || msg.includes("conflicted")) {
        return res.status(409).json({ error: "No se puede eliminar: existe una referencia externa (constraint)" });
      }
      console.error(err);
      return res.status(500).json({ error: "Error eliminando producto" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
