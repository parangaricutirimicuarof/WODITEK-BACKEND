import { Router } from "express";
import { getConnection } from "../sqlconfig.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";

const router = Router();

// Asegurar que la carpeta exista dentro de TKE-OBS
const uploadDir = "./services/TKE-OBS/uploads/fotos_evidencias";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de Multer para almacenamiento físico
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Guardar en la carpeta designada
    },
    filename: function (req, file, cb) {
        // Generar un nombre único: timestamp + sufijo + extensión original
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, "evidencia_" + uniqueSuffix + ext);
    }
});

// Crear el middleware de multer
const upload = multer({ storage: storage });

// 1. Endpoint para CREAR la observación (Sin foto, solo datos de texto)
router.post("/create", async (req, res) => {
    try {
        const body = req.body || {};
        const {
            item, paqueteIndependiente, gerenciaCargo, liderCaminata, fechaCaminata,
            naming, tituloNaming, idTagEquipo, aconex, itemNo, areaNo, facility, subfacility,
            disciplina, descripcionEficiencia, levantamiento, plazoCierre, disciplinaResponsable,
            discQa, pagina, fechaRealCierre, cerradoPor, verificadoPor, semanaApertura,
            semanaCierre, cumplePlazo, categoria, cambioGerencia, recepProv, tercero,
            afectaOperSegur, disciplinaAsignada, estatusAntPunchGlb, estatAntPuntsPunch,
            estatusPunchGlb, estatusPuntosPunch, palabraClave, estatusTkeCdp,
            fechaLevantamientoIpkTke, imprescindFuncionamiento, observacionesInfluencia,
            interiorExterior, oct3, oct7, oct9, tipo, columna1, equipo, imagen,
            corrNaming, top, zona, nivel, com, fase, certRecParcial, subZona, namingCtmS, sistema
        } = body;

        const pool = await getConnection();

        const result = await pool
            .request()
            .input("item", item || "")
            .input("paqueteIndependiente", paqueteIndependiente || "")
            .input("gerenciaCargo", gerenciaCargo || "")
            .input("liderCaminata", liderCaminata || "")
            .input("fechaCaminata", fechaCaminata || "")
            .input("naming", naming || "")
            .input("tituloNaming", tituloNaming || "")
            .input("idTagEquipo", idTagEquipo || "")
            .input("aconex", aconex || "")
            .input("itemNo", itemNo || "")
            .input("areaNo", areaNo || "")
            .input("facility", facility || "")
            .input("subfacility", subfacility || "")
            .input("disciplina", disciplina || "")
            .input("descripcionEficiencia", descripcionEficiencia || "")
            .input("levantamiento", levantamiento || "")
            .input("plazoCierre", plazoCierre || "")
            .input("disciplinaResponsable", disciplinaResponsable || "")
            .input("discQa", discQa || "")
            .input("pagina", pagina || "")
            .input("fechaRealCierre", fechaRealCierre || "")
            .input("cerradoPor", cerradoPor || "")
            .input("verificadoPor", verificadoPor || "")
            .input("semanaApertura", semanaApertura || "")
            .input("semanaCierre", semanaCierre || "")
            .input("cumplePlazo", cumplePlazo || "")
            .input("categoria", categoria || "")
            .input("cambioGerencia", cambioGerencia || "")
            .input("recepProv", recepProv || "")
            .input("tercero", tercero || "")
            .input("afectaOperSegur", afectaOperSegur || "")
            .input("disciplinaAsignada", disciplinaAsignada || "")
            .input("estatusAntPunchGlb", estatusAntPunchGlb || "")
            .input("estatAntPuntsPunch", estatAntPuntsPunch || "")
            .input("estatusPunchGlb", estatusPunchGlb || "Pendiente") // Estado por defecto
            .input("estatusPuntosPunch", estatusPuntosPunch || "")
            .input("palabraClave", palabraClave || "")
            .input("estatusTkeCdp", estatusTkeCdp || "")
            .input("fechaLevantamientoIpkTke", fechaLevantamientoIpkTke || "")
            .input("imprescindFuncionamiento", imprescindFuncionamiento || "")
            .input("observacionesInfluencia", observacionesInfluencia || "")
            .input("interiorExterior", interiorExterior || "")
            .input("oct3", oct3 || "")
            .input("oct7", oct7 || "")
            .input("oct9", oct9 || "")
            .input("tipo", tipo || "")
            .input("columna1", columna1 || "")
            .input("equipo", equipo || "")
            .input("imagen", imagen || "")
            .input("corrNaming", corrNaming || "")
            .input("top", top || "")
            .input("zona", zona || "")
            .input("nivel", nivel || "")
            .input("com", com || "")
            .input("fase", fase || "")
            .input("certRecParcial", certRecParcial || "")
            .input("subZona", subZona || "")
            .input("namingCtmS", namingCtmS || "")
            .input("sistema", sistema || "")
            .query(`
                INSERT INTO [TKE_Observaciones] (
                    createdAt, item, paqueteIndependiente, gerenciaCargo, liderCaminata, fechaCaminata, 
                    naming, tituloNaming, idTagEquipo, aconex, itemNo, areaNo, facility, subfacility, 
                    disciplina, descripcionEficiencia, levantamiento, plazoCierre, disciplinaResponsable, 
                    discQa, pagina, fechaRealCierre, cerradoPor, verificadoPor, semanaApertura, 
                    semanaCierre, cumplePlazo, categoria, cambioGerencia, recepProv, tercero, 
                    afectaOperSegur, disciplinaAsignada, estatusAntPunchGlb, [estatAntPuntsPunch(c/u)], 
                    estatusPunchGlb, [estatusPuntosPunch(c/u)], palabraClave, estatusTkeCdp, 
                    fechaLevantamientoIpkTke, imprescindFuncionamiento, observacionesInfluencia, 
                    interiorExterior, [3-Oct], [7-Oct], [9-Oct], evidencia, tipo, columna1, equipo, imagen,
                    [corr.naming], [top], zona, nivel, com, fase, certRecParcial, subZona, namingCtmS, sistema
                )
                OUTPUT INSERTED.id
                VALUES (
                    GETDATE(), @item, @paqueteIndependiente, @gerenciaCargo, @liderCaminata, @fechaCaminata, 
                    @naming, @tituloNaming, @idTagEquipo, @aconex, @itemNo, @areaNo, @facility, @subfacility, 
                    @disciplina, @descripcionEficiencia, @levantamiento, @plazoCierre, @disciplinaResponsable, 
                    @discQa, @pagina, @fechaRealCierre, @cerradoPor, @verificadoPor, @semanaApertura, 
                    @semanaCierre, @cumplePlazo, @categoria, @cambioGerencia, @recepProv, @tercero, 
                    @afectaOperSegur, @disciplinaAsignada, @estatusAntPunchGlb, @estatAntPuntsPunch, 
                    @estatusPunchGlb, @estatusPuntosPunch, @palabraClave, @estatusTkeCdp, 
                    @fechaLevantamientoIpkTke, @imprescindFuncionamiento, @observacionesInfluencia, 
                    @interiorExterior, @oct3, @oct7, @oct9, NULL, @tipo, @columna1, @equipo, @imagen,
                    @corrNaming, @top, @zona, @nivel, @com, @fase, @certRecParcial, @subZona, @namingCtmS, @sistema
                )
            `);

        return res.status(201).json({
            id: result.recordset[0].id,
            message: "Observación creada exitosamente (sin evidencia)"
        });

    } catch (err) {
        console.error("Error al registrar la observación:", err);
        return res.status(500).json({ error: "Error interno al procesar la observación" });
    }
});

// 2. Endpoint para LEVANTAR la observación (Subir foto a una observación existente)
router.put("/levantar/:id", upload.single("evidencia"), async (req, res) => {
    try {
        const { id } = req.params;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: "La imagen de evidencia es requerida para levantar la observación." });
        }

        const rutaEvidencia = `/uploads/fotos_evidencias/${file.filename}`;
        const pool = await getConnection();

        // 1. Obtener la ruta de la evidencia actual en la base de datos para borrarla si existe
        const selectResult = await pool
            .request()
            .input("id", id)
            .query("SELECT evidencia FROM [TKE_Observaciones] WHERE id = @id");

        if (selectResult.recordset.length > 0) {
            const evidenciaActual = selectResult.recordset[0].evidencia;

            // Si la observación ya tenía una foto, la eliminamos del disco duro
            if (evidenciaActual) {
                const uploadDir = "./services/TKE-OBS/uploads/fotos_evidencias";
                const filename = path.basename(evidenciaActual);
                const fullPath = path.join(uploadDir, filename);

                try {
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                        console.log(`Foto anterior reemplazada y eliminada del disco: ${filename}`);
                    }
                } catch (fsError) {
                    console.warn(`No se pudo eliminar el archivo físico antiguo ${fullPath}:`, fsError.message);
                }
            }
        }

        // 2. Actualizamos el registro existente: guardamos la ruta de la NUEVA foto y cambiamos el estado
        const result = await pool
            .request()
            .input("id", id)
            .input("evidencia", rutaEvidencia)
            .input("estatusPunchGlb", "Levantada") // O el estado que manejes cuando se soluciona
            .input("estatusTkeCdp", "POR VALIDAR LAP")
            .query(`
                UPDATE [TKE_Observaciones]
                SET evidencia = @evidencia, estatusPunchGlb = @estatusPunchGlb, estatusTkeCdp = @estatusTkeCdp
                WHERE id = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "No se encontró la observación con el ID proporcionado." });
        }

        return res.status(200).json({
            message: "Observación levantada exitosamente",
            evidencia: rutaEvidencia
        });

    } catch (err) {
        console.error("Error al levantar la observación:", err);
        return res.status(500).json({ error: "Error interno al procesar la subida de evidencia" });
    }
});

// 2.5 Endpoint para OBTENER estadísticas (Separado para mejorar velocidad de /getall)
router.get("/stats", async (req, res) => {
    try {
        const pool = await getConnection();
        const globalCountsResult = await pool.request().query(`
            SELECT 
                COUNT(*) as totalGlobal,
                SUM(CASE WHEN estatusTkeCdp = 'ABIERTO' THEN 1 ELSE 0 END) as abiertas,
                SUM(CASE WHEN estatusTkeCdp = 'POR VALIDAR LAP' THEN 1 ELSE 0 END) as porValidar,
                SUM(CASE WHEN estatusTkeCdp = 'CERRADO' THEN 1 ELSE 0 END) as cerradas,
                SUM(CASE WHEN evidencia IS NULL OR evidencia = '' THEN 1 ELSE 0 END) as sinEvidencia
            FROM [TKE_Observaciones] WITH (NOLOCK)
        `);
        const globalStats = globalCountsResult.recordset[0];

        return res.status(200).json({
            totalGlobalRecords: globalStats.totalGlobal || 0,
            totalAbiertas: globalStats.abiertas || 0,
            totalPorValidar: globalStats.porValidar || 0,
            totalCerradas: globalStats.cerradas || 0,
            totalSinEvidencia: globalStats.sinEvidencia || 0
        });
    } catch (err) {
        console.error("Error al obtener las estadísticas:", err);
        return res.status(500).json({ error: "Error interno al obtener las estadísticas" });
    }
});

// 3. Endpoint para OBTENER observaciones con PAGINACIÓN (Mejora de rendimiento)
router.get("/getall", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search || "";
        const offset = (page - 1) * limit;

        const pool = await getConnection();

        // Condición de búsqueda dinámica
        let whereClause = "";
        if (search) {
            whereClause = "WHERE item LIKE @search OR naming LIKE @search OR descripcionEficiencia LIKE @search OR palabraClave LIKE @search OR disciplina LIKE @search";
        }

        // 1. Obtener el total de registros SOLO para calcular las páginas
        let totalSearchRecords = 0;

        if (search) {
            // Si hay búsqueda, forzamos un conteo exacto de coincidencias
            const searchCountResult = await pool.request()
                .input("search", `%${search}%`)
                .query(`
                SELECT COUNT(*) as total
                FROM [TKE_Observaciones] WITH (NOLOCK)
                ${whereClause}
            `);
            totalSearchRecords = searchCountResult.recordset[0].total || 0;
        } else {
            // Si no hay búsqueda (el usuario solo navega páginas),
            // obtenemos el total de registros en 0 milisegundos usando el sistema de SQL Server en vez de contar fila por fila
            const fastCountResult = await pool.request().query(`
                SELECT CAST(SUM(p.rows) AS int) as total
                FROM sys.tables t
                INNER JOIN sys.partitions p ON t.object_id = p.object_id
                WHERE t.name = 'TKE_Observaciones' AND p.index_id IN (0, 1)
            `);
            totalSearchRecords = fastCountResult.recordset[0].total || 0;
        }

        // 2. Obtener registros (Optimizado con Orden por ID y NOLOCK para evitar bloqueos)
        const result = await pool.request()
            .input("offset", offset)
            .input("limit", limit)
            .input("search", `%${search}%`)
            .query(`
                SELECT *
                FROM [TKE_Observaciones] WITH (NOLOCK)
                ${whereClause}
                ORDER BY id DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);

        // Devolvemos los datos y la metadata de paginación
        return res.status(200).json({
            data: result.recordset,
            metadata: {
                totalRecords: totalSearchRecords, // El frontend usa esto para la paginación de la tabla
                totalPages: Math.ceil(totalSearchRecords / limit),
                currentPage: page,
                limit
            }
        });
    } catch (err) {
        console.error("Error al obtener las observaciones:", err);
        return res.status(500).json({ error: "Error interno al obtener las observaciones" });
    }
});

// 4. Endpoint para ELIMINAR una observación
router.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();

        // Primero, consultamos el registro para ver si tiene una imagen asociada
        const selectResult = await pool.request()
            .input("id", id)
            .query("SELECT evidencia FROM [TKE_Observaciones] WHERE id = @id");

        if (selectResult.recordset.length === 0) {
            return res.status(404).json({ error: "Observación no encontrada." });
        }

        const evidenciaPath = selectResult.recordset[0].evidencia;

        // Eliminamos el registro de la base de datos
        await pool.request()
            .input("id", id)
            .query("DELETE FROM [TKE_Observaciones] WHERE id = @id");

        // Si tenía una imagen física asociada, intentamos borrarla del disco
        if (evidenciaPath) {
            // evidenciaPath viene como "/uploads/fotos_evidencias/archivo.jpg"
            // Necesitamos la ruta real en el sistema de archivos
            // En index.js mapped "/uploads" to "./services/TKE-OBS/uploads"
            const nombreArchivo = path.basename(evidenciaPath);
            const rutaRealEnDisco = path.join(uploadDir, nombreArchivo);

            if (fs.existsSync(rutaRealEnDisco)) {
                fs.unlinkSync(rutaRealEnDisco);
            }
        }

        return res.status(200).json({ message: "Observación eliminada exitosamente." });

    } catch (err) {
        console.error("Error al eliminar la observación:", err);
        return res.status(500).json({ error: "Error interno al intentar eliminar la observación." });
    }
});

// 5. Endpoint para IMPORTAR un Excel con información e imágenes (Lectura Secuencial / Streaming adaptado)
router.post("/import-excel", upload.single("excelFile"), async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: "No se proporcionó ningún archivo Excel." });
        }

        const filePath = file.path; // Ruta donde multer guardó temporalmente el excel

        // Configuramos la respuesta HTTP para que se mantenga abierta y envíe datos como flujo (SSE)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // VERIFICACIÓN DE ESPACIO EN DISCO ANTES DE INICIAR (UMBRAL: 500 MB libres)
        try {
            const stat = await fs.promises.statfs(uploadDir);
            // stat.bavail = bloques disponibles, stat.bsize = tamaño de bloque en bytes
            const freeSpaceMB = (stat.bavail * stat.bsize) / (1024 * 1024);

            if (freeSpaceMB < 500) {
                // Borramos el excel subido para no empeorar la situación
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                res.write(`data: ${JSON.stringify({
                    status: "error",
                    message: "Error de servidor: Quedan menos de 500 MB libres en disco. Se ha cancelado la importación por seguridad."
                })}\n\n`);
                return res.end();
            }
        } catch (spaceErr) {
            console.warn("No se pudo revisar el espacio libre en disco (es posible que la versión de Node no lo soporte):", spaceErr.message);
        }

        // Enviamos la primera señal al frontend
        res.write(`data: ${JSON.stringify({ status: "start", message: "Iniciando lectura del Excel..." })}\n\n`);

        const pool = await getConnection();
        const workbook = new ExcelJS.Workbook();

        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.worksheets[0]; // Tomamos la primera hoja
        let importados = 0;

        // Extraer todas las imágenes del documento y mapearlas por fila
        const imagesMap = new Map();
        res.write(`data: ${JSON.stringify({ status: "info", message: "Extrayendo imágenes..." })}\n\n`);

        const excelImages = worksheet.getImages() || [];
        const mediaList = workbook.model.media || [];

        for (const image of excelImages) {
            try {
                // Validación defensiva por si la imagen (p. e. un logo) no tiene anclajes
                if (!image.range || !image.range.tl) continue;

                const rowNumber = image.range.tl.nativeRow + 1;
                // nativeCol es base 0, por lo que le sumamos 1 para saber el número de columna exacto
                const colNumber = image.range.tl.nativeCol + 1;

                // Tomamos SOLO las imágenes de la columna "Evidencia" que es la número 56 (antes 55, se desplazó +1)
                if (colNumber === 56) {
                    const imgId = image.imageId;
                    const media = mediaList.find(m => m.index === imgId);

                    if (media) {
                        imagesMap.set(rowNumber, media);
                    }
                }
            } catch (imgErr) {
                console.warn("Advertencia: Fallo al procesar una imagen del Excel, se saltará.", imgErr.message);
            }
        }

        // Leer fila por fila saltando la cabecera (empezamos en fila 2)
        const rowCount = worksheet.rowCount;

        for (let i = 2; i <= rowCount; i++) {
            const row = worksheet.getRow(i);

            const item = row.getCell(1).text || "";
            const corrNaming = row.getCell(2).text || "";
            const top = row.getCell(3).text || "";
            const zona = row.getCell(4).text || "";
            const nivel = row.getCell(5).text || "";
            const com = row.getCell(6).text || "";
            const fase = row.getCell(7).text || "";
            const certRecParcial = row.getCell(8).text || "";
            const subZona = row.getCell(9).text || "";
            const sistema = row.getCell(10).text || "";
            const namingCtmS = row.getCell(11).text || "";

            const paqueteIndependiente = row.getCell(12).text || "";
            const gerenciaCargo = row.getCell(13).text || "";
            const liderCaminata = row.getCell(14).text || "";
            const fechaCaminata = row.getCell(15).text || "";
            const naming = row.getCell(16).text || "";
            const tituloNaming = row.getCell(17).text || "";
            const idTagEquipo = row.getCell(18).text || "";
            const aconex = row.getCell(19).text || "";
            const itemNo = row.getCell(20).text || "";
            const areaNo = row.getCell(21).text || "";
            const facility = row.getCell(22).text || "";
            const subfacility = row.getCell(23).text || "";
            const disciplina = row.getCell(24).text || "";
            const descripcionEficiencia = row.getCell(25).text || "";
            const levantamiento = row.getCell(26).text || "";
            const plazoCierre = row.getCell(27).text || "";
            const disciplinaResponsable = row.getCell(28).text || "";
            const discQa = row.getCell(29).text || "";
            const pagina = row.getCell(30).text || "";
            const fechaRealCierre = row.getCell(31).text || "";
            const cerradoPor = row.getCell(32).text || "";
            const verificadoPor = row.getCell(33).text || "";
            const semanaApertura = row.getCell(34).text || "";
            const semanaCierre = row.getCell(35).text || "";
            const cumplePlazo = row.getCell(36).text || "";
            const categoria = row.getCell(37).text || "";
            const cambioGerencia = row.getCell(38).text || "";
            const recepProv = row.getCell(39).text || "";
            const tercero = row.getCell(40).text || "";
            const afectaOperSegur = row.getCell(41).text || "";
            const disciplinaAsignada = row.getCell(42).text || "";
            const estatusAntPunchGlb = row.getCell(43).text || "";
            const estatAntPuntsPunch = row.getCell(44).text || "";
            const estatusPunchGlb = row.getCell(45).text || "";
            const estatusPuntosPunch = row.getCell(46).text || "";
            const palabraClave = row.getCell(47).text || "";
            const estatusTkeCdp = row.getCell(48).text || "";
            const fechaLevantamientoIpkTke = row.getCell(49).text || "";
            const imprescindFuncionamiento = row.getCell(50).text || "";
            const observacionesInfluencia = row.getCell(51).text || "";
            const interiorExterior = row.getCell(52).text || "";
            const oct3 = row.getCell(53).text || "";
            const oct7 = row.getCell(54).text || "";
            const oct9 = row.getCell(55).text || "";

            // evidencia está vacio, lo sacamos del mapeador de imagenes (en index 56 en adelante)
            // Asumiremos que el tipo viene en 57, columna 58, equipo 59, imagen 60
            const tipo = row.getCell(57).text || "";
            const columna1 = row.getCell(58).text || "";
            const equipo = row.getCell(59).text || "";
            const imagen = row.getCell(60).text || "";

            // Filtro para ignorar tablas o leyendas al final del documento
            // Solo procesará la fila si tiene un 'item' Y además información al menos
            // en 'naming', 'gerenciaCargo' o 'liderCaminata'.
            if (!item || (!naming && !gerenciaCargo && !liderCaminata && !descripcionEficiencia)) {
                continue;
            }

            let rutaEvidencia = null;

            if (imagesMap.has(i)) {
                const mediaData = imagesMap.get(i);
                if (mediaData && mediaData.buffer) {
                    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
                    const ext = mediaData.extension === 'jpeg' ? '.jpg' : '.' + mediaData.extension;
                    const fileName = "evidencia_excel_" + uniqueSuffix + ext;

                    const savePath = path.join(uploadDir, fileName);
                    fs.writeFileSync(savePath, mediaData.buffer);

                    rutaEvidencia = `/uploads/fotos_evidencias/${fileName}`;
                }
            }

            // Insertar en SQL Server
            await pool.request()
                .input("item", item)
                .input("paqueteIndependiente", paqueteIndependiente)
                .input("gerenciaCargo", gerenciaCargo)
                .input("liderCaminata", liderCaminata)
                .input("fechaCaminata", fechaCaminata)
                .input("naming", naming)
                .input("tituloNaming", tituloNaming)
                .input("idTagEquipo", idTagEquipo)
                .input("aconex", aconex)
                .input("itemNo", itemNo)
                .input("areaNo", areaNo)
                .input("facility", facility)
                .input("subfacility", subfacility)
                .input("disciplina", disciplina)
                .input("descripcionEficiencia", descripcionEficiencia)
                .input("levantamiento", levantamiento)
                .input("plazoCierre", plazoCierre)
                .input("disciplinaResponsable", disciplinaResponsable)
                .input("discQa", discQa)
                .input("pagina", pagina)
                .input("fechaRealCierre", fechaRealCierre)
                .input("cerradoPor", cerradoPor)
                .input("verificadoPor", verificadoPor)
                .input("semanaApertura", semanaApertura)
                .input("semanaCierre", semanaCierre)
                .input("cumplePlazo", cumplePlazo)
                .input("categoria", categoria)
                .input("cambioGerencia", cambioGerencia)
                .input("recepProv", recepProv)
                .input("tercero", tercero)
                .input("afectaOperSegur", afectaOperSegur)
                .input("disciplinaAsignada", disciplinaAsignada)
                .input("estatusAntPunchGlb", estatusAntPunchGlb)
                .input("estatAntPuntsPunch", estatAntPuntsPunch)
                .input("estatusPunchGlb", estatusPunchGlb)
                .input("estatusPuntosPunch", estatusPuntosPunch)
                .input("palabraClave", palabraClave)
                .input("estatusTkeCdp", rutaEvidencia ? "POR VALIDAR LAP" : "ABIERTO")
                .input("fechaLevantamientoIpkTke", fechaLevantamientoIpkTke)
                .input("imprescindFuncionamiento", imprescindFuncionamiento)
                .input("observacionesInfluencia", observacionesInfluencia)
                .input("interiorExterior", interiorExterior)
                .input("oct3", oct3)
                .input("oct7", oct7)
                .input("oct9", oct9)
                .input("evidencia", rutaEvidencia)
                .input("tipo", tipo)
                .input("columna1", columna1)
                .input("equipo", equipo)
                .input("imagen", imagen)
                .input("corrNaming", corrNaming)
                .input("top", top)
                .input("zona", zona)
                .input("nivel", nivel)
                .input("com", com)
                .input("fase", fase)
                .input("certRecParcial", certRecParcial)
                .input("subZona", subZona)
                .input("namingCtmS", namingCtmS)
                .input("sistema", sistema)
                .query(`
                    INSERT INTO [TKE_Observaciones] (
                        createdAt, item, paqueteIndependiente, gerenciaCargo, liderCaminata, fechaCaminata, 
                        naming, tituloNaming, idTagEquipo, aconex, itemNo, areaNo, facility, subfacility, 
                        disciplina, descripcionEficiencia, levantamiento, plazoCierre, disciplinaResponsable, 
                        discQa, pagina, fechaRealCierre, cerradoPor, verificadoPor, semanaApertura, 
                        semanaCierre, cumplePlazo, categoria, cambioGerencia, recepProv, tercero, 
                        afectaOperSegur, disciplinaAsignada, estatusAntPunchGlb, [estatAntPuntsPunch(c/u)], 
                        estatusPunchGlb, [estatusPuntosPunch(c/u)], palabraClave, estatusTkeCdp, 
                        fechaLevantamientoIpkTke, imprescindFuncionamiento, observacionesInfluencia, 
                        interiorExterior, [3-Oct], [7-Oct], [9-Oct], evidencia, tipo, columna1, equipo, imagen,
                        [corr.naming], [top], zona, nivel, com, fase, certRecParcial, subZona, namingCtmS, sistema
                    )
                    VALUES (
                        GETDATE(), @item, @paqueteIndependiente, @gerenciaCargo, @liderCaminata, @fechaCaminata, 
                        @naming, @tituloNaming, @idTagEquipo, @aconex, @itemNo, @areaNo, @facility, @subfacility, 
                        @disciplina, @descripcionEficiencia, @levantamiento, @plazoCierre, @disciplinaResponsable, 
                        @discQa, @pagina, @fechaRealCierre, @cerradoPor, @verificadoPor, @semanaApertura, 
                        @semanaCierre, @cumplePlazo, @categoria, @cambioGerencia, @recepProv, @tercero, 
                        @afectaOperSegur, @disciplinaAsignada, @estatusAntPunchGlb, @estatAntPuntsPunch, 
                        @estatusPunchGlb, @estatusPuntosPunch, @palabraClave, @estatusTkeCdp, 
                        @fechaLevantamientoIpkTke, @imprescindFuncionamiento, @observacionesInfluencia, 
                        @interiorExterior, @oct3, @oct7, @oct9, @evidencia, @tipo, @columna1, @equipo, @imagen,
                        @corrNaming, @top, @zona, @nivel, @com, @fase, @certRecParcial, @subZona, @namingCtmS, @sistema
                    )
                `);

            importados++;

            // ¡Aquí enviamos la actualización de progreso al frontend por cada fila!
            res.write(`data: ${JSON.stringify({
                status: "progress",
                filaAct: i,
                total: rowCount,
                message: "Fila " + i + " de " + rowCount + " guardada exitosamente"
            })}\n\n`);
        }

        // Borramos el excel original con try-catch para atrapar bloqueos(EBUSY)
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (unlinkErr) {
            console.warn("No se pudo borrar el archivo temporal, probablemente bloqueado en Windows:", unlinkErr.message);
        }

        // Enviamos la última señal indicando que terminamos
        res.write(`data: ${JSON.stringify({
            status: "done",
            message: "Importación completada con éxito.",
            registrosInsertados: importados
        })}\n\n`);

        // Cerramos la conexión
        res.end();

    } catch (err) {
        console.error("Error al importar el Excel:", err);
        // Si hay error a medias del stream, enviamos un mensaje de error y cerramos
        if (!res.headersSent) {
            return res.status(500).json({ error: "Error interno al importar el documento Excel." });
        } else {
            res.write(`data: ${JSON.stringify({ status: "error", message: `Error interno: ${err.message}` })}\n\n`);
            res.end();
        }
    }
});

// Nuevo ENDPOINT para ACTUALIZAR un registro existente por ID
router.put("/update/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;

        const {
            item, paqueteIndependiente, gerenciaCargo, liderCaminata, fechaCaminata,
            naming, tituloNaming, idTagEquipo, aconex, itemNo, areaNo, facility, subfacility,
            disciplina, descripcionEficiencia, levantamiento, plazoCierre, disciplinaResponsable,
            discQa, pagina, fechaRealCierre, cerradoPor, verificadoPor, semanaApertura,
            semanaCierre, cumplePlazo, categoria, cambioGerencia, recepProv, tercero,
            afectaOperSegur, disciplinaAsignada, estatusAntPunchGlb, estatAntPuntsPunch,
            estatusPunchGlb, estatusPuntosPunch, palabraClave, estatusTkeCdp,
            fechaLevantamientoIpkTke, imprescindFuncionamiento, observacionesInfluencia,
            interiorExterior, oct3, oct7, oct9, tipo, columna1, equipo, imagen,
            corrNaming, top, zona, nivel, com, fase, certRecParcial, subZona, namingCtmS, sistema
        } = body;

        const pool = await getConnection();

        const result = await pool
            .request()
            .input("id", id)
            .input("item", item || "")
            .input("paqueteIndependiente", paqueteIndependiente || "")
            .input("gerenciaCargo", gerenciaCargo || "")
            .input("liderCaminata", liderCaminata || "")
            .input("fechaCaminata", fechaCaminata || "")
            .input("naming", naming || "")
            .input("tituloNaming", tituloNaming || "")
            .input("idTagEquipo", idTagEquipo || "")
            .input("aconex", aconex || "")
            .input("itemNo", itemNo || "")
            .input("areaNo", areaNo || "")
            .input("facility", facility || "")
            .input("subfacility", subfacility || "")
            .input("disciplina", disciplina || "")
            .input("descripcionEficiencia", descripcionEficiencia || "")
            .input("levantamiento", levantamiento || "")
            .input("plazoCierre", plazoCierre || "")
            .input("disciplinaResponsable", disciplinaResponsable || "")
            .input("discQa", discQa || "")
            .input("pagina", pagina || "")
            .input("fechaRealCierre", fechaRealCierre || "")
            .input("cerradoPor", cerradoPor || "")
            .input("verificadoPor", verificadoPor || "")
            .input("semanaApertura", semanaApertura || "")
            .input("semanaCierre", semanaCierre || "")
            .input("cumplePlazo", cumplePlazo || "")
            .input("categoria", categoria || "")
            .input("cambioGerencia", cambioGerencia || "")
            .input("recepProv", recepProv || "")
            .input("tercero", tercero || "")
            .input("afectaOperSegur", afectaOperSegur || "")
            .input("disciplinaAsignada", disciplinaAsignada || "")
            .input("estatusAntPunchGlb", estatusAntPunchGlb || "")
            .input("estatAntPuntsPunch", estatAntPuntsPunch || "")
            .input("estatusPunchGlb", estatusPunchGlb || "Pendiente")
            .input("estatusPuntosPunch", estatusPuntosPunch || "")
            .input("palabraClave", palabraClave || "")
            .input("estatusTkeCdp", estatusTkeCdp || "")
            .input("fechaLevantamientoIpkTke", fechaLevantamientoIpkTke || "")
            .input("imprescindFuncionamiento", imprescindFuncionamiento || "")
            .input("observacionesInfluencia", observacionesInfluencia || "")
            .input("interiorExterior", interiorExterior || "")
            .input("oct3", oct3 || "")
            .input("oct7", oct7 || "")
            .input("oct9", oct9 || "")
            .input("tipo", tipo || "")
            .input("columna1", columna1 || "")
            .input("equipo", equipo || "")
            .input("imagen", imagen || "")
            .input("corrNaming", corrNaming || "")
            .input("top", top || "")
            .input("zona", zona || "")
            .input("nivel", nivel || "")
            .input("com", com || "")
            .input("fase", fase || "")
            .input("certRecParcial", certRecParcial || "")
            .input("subZona", subZona || "")
            .input("namingCtmS", namingCtmS || "")
            .input("sistema", sistema || "")
            .query(`
                UPDATE [TKE_Observaciones]
                SET 
                    item = @item,
                    paqueteIndependiente = @paqueteIndependiente,
                    gerenciaCargo = @gerenciaCargo,
                    liderCaminata = @liderCaminata,
                    fechaCaminata = @fechaCaminata,
                    naming = @naming,
                    tituloNaming = @tituloNaming,
                    idTagEquipo = @idTagEquipo,
                    aconex = @aconex,
                    itemNo = @itemNo,
                    areaNo = @areaNo,
                    facility = @facility,
                    subfacility = @subfacility,
                    disciplina = @disciplina,
                    descripcionEficiencia = @descripcionEficiencia,
                    levantamiento = @levantamiento,
                    plazoCierre = @plazoCierre,
                    disciplinaResponsable = @disciplinaResponsable,
                    discQa = @discQa,
                    pagina = @pagina,
                    fechaRealCierre = @fechaRealCierre,
                    cerradoPor = @cerradoPor,
                    verificadoPor = @verificadoPor,
                    semanaApertura = @semanaApertura,
                    semanaCierre = @semanaCierre,
                    cumplePlazo = @cumplePlazo,
                    categoria = @categoria,
                    cambioGerencia = @cambioGerencia,
                    recepProv = @recepProv,
                    tercero = @tercero,
                    afectaOperSegur = @afectaOperSegur,
                    disciplinaAsignada = @disciplinaAsignada,
                    estatusAntPunchGlb = @estatusAntPunchGlb,
                    [estatAntPuntsPunch(c/u)] = @estatAntPuntsPunch,
                    estatusPunchGlb = @estatusPunchGlb,
                    [estatusPuntosPunch(c/u)] = @estatusPuntosPunch,
                    palabraClave = @palabraClave,
                    estatusTkeCdp = @estatusTkeCdp,
                    fechaLevantamientoIpkTke = @fechaLevantamientoIpkTke,
                    imprescindFuncionamiento = @imprescindFuncionamiento,
                    observacionesInfluencia = @observacionesInfluencia,
                    interiorExterior = @interiorExterior,
                    [3-Oct] = @oct3,
                    [7-Oct] = @oct7,
                    [9-Oct] = @oct9,
                    tipo = @tipo,
                    columna1 = @columna1,
                    equipo = @equipo,
                    imagen = @imagen,
                    [corr.naming] = @corrNaming,
                    [top] = @top,
                    zona = @zona,
                    nivel = @nivel,
                    com = @com,
                    fase = @fase,
                    certRecParcial = @certRecParcial,
                    subZona = @subZona,
                    namingCtmS = @namingCtmS,
                    sistema = @sistema
                WHERE id = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Observación no encontrada" });
        }

        res.status(200).json({ message: "Observación actualizada exitosamente" });
    } catch (err) {
        console.error("Error al actualizar la observación:", err);
        res.status(500).json({ error: "Error interno al actualizar la observación" });
    }
});

// Nuevo ENDPOINT para ELIMINAR FÍSICAMENTE la imagen de una observación
router.delete("/delete-image/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();

        // 1. Obtener la ruta de la evidencia actual en la base de datos
        const selectResult = await pool
            .request()
            .input("id", id)
            .query("SELECT evidencia FROM [TKE_Observaciones] WHERE id = @id");

        if (selectResult.recordset.length === 0) {
            return res.status(404).json({ error: "Observación no encontrada." });
        }

        const evidenciaActual = selectResult.recordset[0].evidencia;

        // 2. Si existe un archivo, intentamos borrarlo del disco duro
        if (evidenciaActual) {
            const uploadDir = "./services/TKE-OBS/uploads/fotos_evidencias";
            const filename = path.basename(evidenciaActual);
            const fullPath = path.join(uploadDir, filename);

            try {
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            } catch (fsError) {
                console.warn(`No se pudo eliminar el archivo físico ${fullPath}:`, fsError.message);
                // No detenemos el proceso si falla el borrado físico (por ej. problemas de permisos)
            }
        }

        // 3. Limpiar la columna en la base de datos (ponerla en NULL)
        await pool
            .request()
            .input("id", id)
            .query("UPDATE [TKE_Observaciones] SET evidencia = NULL, estatusTkeCdp = 'ABIERTO' WHERE id = @id");

        res.status(200).json({ message: "Imagen eliminada correctamente." });
    } catch (err) {
        console.error("Error al eliminar la imagen:", err);
        res.status(500).json({ error: "Error interno al eliminar la imagen." });
    }
});

// Nuevo ENDPOINT para CERRAR una observación (cambiar estatusTkeCdp a CERRADO)
router.put("/cerrar-observacion/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();

        const result = await pool
            .request()
            .input("id", id)
            .input("estatusTkeCdp", "CERRADO")
            .query("UPDATE [TKE_Observaciones] SET estatusTkeCdp = @estatusTkeCdp WHERE id = @id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Observación no encontrada." });
        }

        res.status(200).json({ message: "Observación marcada como CERRADA." });
    } catch (err) {
        console.error("Error al cerrar la observación:", err);
        res.status(500).json({ error: "Error interno al cerrar la observación." });
    }
});

// Nuevo ENDPOINT para EXPORTAR a Excel todos los registros de la búsqueda
router.get("/export-excel", async (req, res) => {
    try {
        const search = req.query.search || "";
        const pool = await getConnection();

        let whereClause = "";
        if (search) {
            whereClause = "WHERE item LIKE @search OR naming LIKE @search OR descripcionEficiencia LIKE @search OR palabraClave LIKE @search OR disciplina LIKE @search";
        }

        // Consultamos todos los registros (sin paginación)
        const result = await pool.request()
            .input("search", `%${search}%`)
            .query(`
                SELECT *
                FROM [TKE_Observaciones] WITH (NOLOCK)
                ${whereClause}
                ORDER BY id DESC
            `);

        const data = result.recordset;

        // Crear un nuevo documento de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Observaciones');

        // Agregar cabeceras y estructura de columnas EXACTA solicitada por el usuario
        worksheet.columns = [
            { header: 'ITEM', key: 'item', width: 15 },
            { header: 'CORR. NAMING', key: 'corr.naming', width: 15 },
            { header: 'TOP', key: 'top', width: 15 },
            { header: 'ZONA', key: 'zona', width: 15 },
            { header: 'NIVEL', key: 'nivel', width: 15 },
            { header: 'COM', key: 'com', width: 15 },
            { header: 'FASE', key: 'fase', width: 15 },
            { header: 'Cert. Rec. Parcial', key: 'certRecParcial', width: 20 },
            { header: 'SUB-ZONA', key: 'subZona', width: 15 },
            { header: 'SISTEMA', key: 'sistema', width: 15 },
            { header: 'NAMING CTM\'S', key: 'namingCtmS', width: 25 },
            { header: 'PAQUETE INDEPENDIENTE', key: 'paqueteIndependiente', width: 25 },
            { header: 'Gerencia a Cargo', key: 'gerenciaCargo', width: 20 },
            { header: 'Lider de caminata', key: 'liderCaminata', width: 20 },
            { header: 'Fecha Caminata', key: 'fechaCaminata', width: 15 },
            { header: 'NAMING', key: 'naming', width: 15 },
            { header: 'TITULO - NAMING PUL', key: 'tituloNaming', width: 25 },
            { header: 'Tag equipo / Identificación', key: 'idTagEquipo', width: 25 },
            { header: 'ACONEX', key: 'aconex', width: 15 },
            { header: 'ITEM No.', key: 'itemNo', width: 15 },
            { header: 'AREA No.', key: 'areaNo', width: 15 },
            { header: 'Facility (Ubicación)', key: 'facility', width: 20 },
            { header: 'Subfacility', key: 'subfacility', width: 20 },
            { header: 'Disciplina', key: 'disciplina', width: 15 },
            { header: 'Descripción de la deficiencia', key: 'descripcionEficiencia', width: 35 },
            { header: 'Levantado por', key: 'levantamiento', width: 20 },
            { header: 'Plazo de Cierre (LAP)', key: 'plazoCierre', width: 20 },
            { header: 'Disciplina Responsable', key: 'disciplinaResponsable', width: 20 },
            { header: 'Disc QA', key: 'discQa', width: 15 },
            { header: 'PAGINA', key: 'pagina', width: 15 },
            { header: 'Fecha Real de Cierre', key: 'fechaRealCierre', width: 20 },
            { header: 'Cerrado por', key: 'cerradoPor', width: 20 },
            { header: 'Verificado Por (LAP)', key: 'verificadoPor', width: 20 },
            { header: 'SEMANA DE APERTURA', key: 'semanaApertura', width: 20 },
            { header: 'SEMANA DE CIERRE', key: 'semanaCierre', width: 20 },
            { header: 'CUMPLE PLAZO', key: 'cumplePlazo', width: 15 },
            { header: 'CATEGORÍA', key: 'categoria', width: 15 },
            { header: 'CAMBIO GERENCIA', key: 'cambioGerencia', width: 20 },
            { header: 'RECEP.PROV', key: 'recepProv', width: 15 },
            { header: 'TERCERO', key: 'tercero', width: 15 },
            { header: 'AFECTA OPER / SEGUR', key: 'afectaOperSegur', width: 20 },
            { header: 'DISCIPLINA ASIGNADA', key: 'disciplinaAsignada', width: 20 },
            { header: 'ESTATUS ANT PUNCH (Glb)', key: 'estatusAntPunchGlb', width: 25 },
            { header: 'ESTATUS ANT PUNTOS PUNCH (c/u)', key: 'estatAntPuntsPunch(c/u)', width: 30 },
            { header: 'ESTATUS PUNCH (Glb)', key: 'estatusPunchGlb', width: 20 },
            { header: 'ESTATUS PUNTOS PUNCH (c/u)', key: 'estatusPuntosPunch(c/u)', width: 30 },
            { header: 'PALABRA CLAVE', key: 'palabraClave', width: 15 },
            { header: 'ESTATUS TKE - CDP', key: 'estatusTkeCdp', width: 20 },
            { header: 'FECHA LEVANTAMIENTO', key: 'fechaLevantamientoIpkTke', width: 20 },
            { header: 'IMPRESCINDIBLE FUNC.', key: 'imprescindFuncionamiento', width: 20 },
            { header: 'OBSERVACIONES QUE INFLUYEN', key: 'observacionesInfluencia', width: 40 },
            { header: 'Interior / Exterior', key: 'interiorExterior', width: 15 },
            { header: '3-Oct', key: '3-Oct', width: 15 },
            { header: '7-Oct', key: '7-Oct', width: 15 },
            { header: '9-Oct', key: '9-Oct', width: 15 },
            { header: 'EVIDENCIA', key: 'evidencia', width: 25 },
            { header: 'TIPO', key: 'tipo', width: 15 },
            { header: 'Columna1', key: 'columna1', width: 15 },
            { header: 'EQUIPO', key: 'equipo', width: 15 },
            { header: 'IMAGEN', key: 'imagen', width: 15 }
        ];

        // Agregar filas
        if (data.length > 0) {
            data.forEach(row => {
                worksheet.addRow(row);
            });
        } else {
            worksheet.addRow({ id: "No se encontraron datos para exportar usando este filtro." });
        }

        // Configurar la descarga del archivo Excel
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Observaciones_TKE.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error("Error al exportar el Excel:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: "Error interno al generar el archivo Excel." });
        }
    }
});

export default router;
