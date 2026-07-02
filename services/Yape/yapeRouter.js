import express from 'express';
import sql from 'mssql';
import { getConnection } from '../sqlconfig.js';

const router = express.Router();

// Asegura que este router entienda JSON y Form-urlencoded de forma autónoma
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Tiempo de expiración para las consultas en la base de datos (10 minutos)
const EXPIRATION_MINUTES = 10;

// Función auxiliar para comparar nombres (inmune a mayúsculas y acentos, soporta segundos nombres)
function matchSenderName(inputName, notificationSender) {
    if (!notificationSender || notificationSender.toLowerCase() === 'desconocido') {
        return false;
    }
    const cleanInput = inputName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const cleanSender = notificationSender.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (!cleanSender) return false;

    if (cleanSender.indexOf(' ') > 0) {
        const spaceIdx = cleanSender.indexOf(' ');
        const firstName = cleanSender.substring(0, spaceIdx);
        const lastName = cleanSender.substring(spaceIdx + 1).replace(/\*/g, '');
        return cleanInput.startsWith(firstName) && cleanInput.includes(lastName);
    }
    return cleanInput.startsWith(cleanSender.replace(/\*/g, ''));
}

/**
 * 1. Webhook receptor de pagos (MacroDroid o Simulador)
 * Guarda las notificaciones de Yape en tu SQL Server y notifica al socket si coincide
 */
router.post('/yape-webhook', async (req, res) => {
  // --- LÍNEAS DE DEPURACIÓN (Agregar para probar) ---
  console.log('Headers recibidos:', req.headers);
  console.log('Query de la URL:', req.query);
  console.log('Body de la petición:', req.body);
  // --------------------------------------------------
  
  try {
    let amount, sender;
    const rawText = (req.body?.rawText || req.query?.rawText) ? String(req.body?.rawText || req.query?.rawText) : null;

    if (rawText) {
      // Limpia el prefijo opcional de "¡Te yapearon!"
      const cleanedText = rawText.replace(/^¡?Te yapearon!\s*/i, '');

      // 1. Regex de monto corregido para aceptar montos sin decimales, con 1 decimal o 2 decimales:
      const amountMatch = cleanedText.match(/S\/\.?\s*(\d+(?:\.\d+)?)/i);
      if (!amountMatch) {
        return res.status(400).json({
          success: false,
          message: "No se pudo extraer el monto de la notificación cruda."
        });
      }
      amount = parseFloat(amountMatch[1]);

      // Extraer remitente
      const senderMatch = cleanedText.match(/^(.*?)\s+te\s+envi/i);
      sender = senderMatch ? senderMatch[1].trim() : "Desconocido";
    } else {
      // Formato parseado usando ?.
      amount = req.body?.amount;
      sender = req.body?.sender;
    }

    // Validar monto
    if (amount === undefined || amount === null || isNaN(parseFloat(amount)) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Monto inválido o no provisto." });
    }
    amount = parseFloat(amount);

    // Validar remitente
    sender = sender ? String(sender).trim() : "Desconocido";

    // Conectar a SQL Server e insertar registro
    const pool = await getConnection();
    const insertResult = await pool.request()
      .input('amount', sql.Decimal(10, 2), amount)
      .input('sender', sql.VarChar(255), sender)
      .input('rawText', sql.NVarChar(sql.MAX), rawText)
      .query(`
        INSERT INTO yape_payments (amount, sender, is_used, raw_text, created_at)
        OUTPUT INSERTED.id
        VALUES (@amount, @sender, 0, @rawText, GETDATE());
      `);

    const paymentId = insertResult.recordset[0].id;
    console.log(`[SQL Webhook] Registrado pago ID ${paymentId} por S/ ${amount.toFixed(2)} - ${sender}`);

    // OBTENEMOS LA INSTANCIA DE SOCKET.IO Y BUSCAMOS CLIENTES ESPERANDO ESTE PAGO
    const io = req.app.get("socketio");
    if (io) {
      const connectedSockets = io.sockets.sockets; // Map de sockets conectados
      for (const [id, s] of connectedSockets) {
        if (s.paymentData) {
          const { amount: sAmount, senderName } = s.paymentData;
          
          // Comprobamos si coincide el monto y el remitente
          if (Math.abs(sAmount - amount) < 0.01 && matchSenderName(senderName, sender)) {
            // Consumimos el pago en la base de datos
            await pool.request()
              .input("paymentId", sql.Int, paymentId)
              .input("senderName", sql.VarChar(255), senderName)
              .query(`
                UPDATE yape_payments 
                SET is_used = 1, used_at = GETDATE(), verified_sender = @senderName
                WHERE id = @paymentId;
              `);

            // Notificamos instantáneamente al cliente por Socket
            s.emit("payment-verified", { amount });
            console.log(`[Socket Webhook] ¡Pago verificado y notificado al cliente ${senderName}!`);
            break;
          }
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: "Pago registrado en DB"
    });

  } catch (error) {
    console.error("[Yape Webhook Error]", error);
    return res.status(500).json({
      success: false,
      message: "Error interno al registrar el pago en la base de datos."
    });
  }
});

/**
 * 2. Consulta de verificación del checkout
 * Valida el pago cruzando nombre completo y monto (soporta segundos nombres)
 */
router.post("/verify-payment", async (req, res) => {
  const { amount, senderName } = req.body;
  const targetAmount = parseFloat(amount);

  if (isNaN(targetAmount) || !senderName || senderName.trim().length < 3) {
    return res.status(400).json({ 
      success: false, 
      message: "Parámetros de verificación inválidos" 
    });
  }

  try {
    const pool = await getConnection();
    
    const result = await pool.request()
      .input("expectedAmount", sql.Decimal(10, 2), targetAmount)
      .input("senderName", sql.VarChar(255), senderName)
      .query(`
        BEGIN TRANSACTION;

        DECLARE @MatchedId INT = NULL;

        -- Buscar el pago de yape
        SELECT TOP 1 @MatchedId = id 
        FROM yape_payments WITH (UPDLOCK, ROWLOCK)
        WHERE amount = @expectedAmount 
          AND is_used = 0 
          AND created_at >= DATEADD(minute, -10, GETDATE())
          AND (
            CASE 
              -- Si el nombre en DB tiene espacio (ej. 'Ana Jar*')
              WHEN CHARINDEX(' ', sender) > 0 THEN
                CASE 
                  -- Comprueba que el ingresado empiece por el primer nombre (LOWER(Ana))
                  -- y que contenga el apellido enmascarado (LOWER(Jar)) en cualquier parte
                  WHEN LOWER(@senderName) COLLATE Latin1_General_CI_AI LIKE LOWER(SUBSTRING(sender, 1, CHARINDEX(' ', sender) - 1)) COLLATE Latin1_General_CI_AI + '%'
                   AND LOWER(@senderName) COLLATE Latin1_General_CI_AI LIKE '%' + LOWER(REPLACE(SUBSTRING(sender, CHARINDEX(' ', sender) + 1, LEN(sender)), '*', '')) COLLATE Latin1_General_CI_AI + '%'
                  THEN 1 ELSE 0 
                END
              -- Si no tiene espacio (ej. 'Desconocido' o un solo nombre)
              ELSE
                CASE 
                  WHEN LOWER(@senderName) COLLATE Latin1_General_CI_AI LIKE LOWER(REPLACE(sender, '*', '')) COLLATE Latin1_General_CI_AI + '%' 
                  THEN 1 ELSE 0 
                END
            END = 1
          )
        ORDER BY created_at ASC;

        IF @MatchedId IS NOT NULL
        BEGIN
          -- Marcar como usado y guardar el nombre completo ingresado por el usuario
          UPDATE yape_payments 
          SET is_used = 1, 
              used_at = GETDATE(), 
              verified_sender = @senderName
          WHERE id = @MatchedId;

          COMMIT TRANSACTION;
          SELECT 1 AS success;
        END
        ELSE
        BEGIN
          ROLLBACK TRANSACTION;
          SELECT 0 AS success;
        END
      `);

    const success = result.recordset[0].success === 1;

    if (success) {
      return res.json({ success: true, message: "Pago verificado y validado con éxito" });
    } else {
      return res.json({ success: false, message: "El pago aún está pendiente" });
    }

  } catch (error) {
    console.error("Error al verificar pago en SQL Server:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 3. GET /pending-payments (Ruta de ayuda / depuración)
 * Lista los pagos activos y no expirados en la base de datos.
 */
router.get('/pending-payments', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT amount, sender, created_at
        FROM yape_payments
        WHERE is_used = 0
          AND created_at >= DATEADD(minute, -10, GETDATE())
        ORDER BY created_at DESC;
      `);

    const safePayments = (result.recordset || []).map(p => {
      const createdAtMs = new Date(p.created_at).getTime();
      const expiresAtMs = createdAtMs + 10 * 60 * 1000;
      const expiresInSeconds = Math.max(0, Math.round((expiresAtMs - Date.now()) / 1000));

      return {
        amount: p.amount,
        sender: p.sender,
        createdAt: p.created_at,
        expiresInSeconds
      };
    });

    return res.json({
      count: safePayments.length,
      payments: safePayments
    });

  } catch (error) {
    console.error("[Yape Pending Payments Error]", error);
    return res.status(500).json({
      success: false,
      message: "Error interno al listar los pagos pendientes."
    });
  }
});

// EXPORTAMOS UNA FUNCIÓN PARA INICIALIZAR LOS LISTENERS DE SOCKET.IO
export function setupYapeSocket(io) {
  io.on("connection", (socket) => {
    
    // Cuando el cliente genera el QR, registra su expectativa de pago
    socket.on("register-payment-session", async ({ amount, senderName }) => {
      socket.paymentData = { amount: parseFloat(amount), senderName };
      console.log(`[Socket] Cliente esperando pago: S/ ${amount} - ${senderName}`);

      // COMPROBACIÓN INMEDIATA (Por si yapeó antes de que cargara la pantalla)
      try {
        const pool = await getConnection();
        const result = await pool.request()
          .input("expectedAmount", sql.Decimal(10, 2), parseFloat(amount))
          .input("senderName", sql.VarChar(255), senderName)
          .query(`
            BEGIN TRANSACTION;

            DECLARE @MatchedId INT = NULL;

            SELECT TOP 1 @MatchedId = id 
            FROM yape_payments WITH (UPDLOCK, ROWLOCK)
            WHERE amount = @expectedAmount 
              AND is_used = 0 
              AND created_at >= DATEADD(minute, -10, GETDATE())
              AND (
                CASE 
                  WHEN CHARINDEX(' ', sender) > 0 THEN
                    CASE 
                      WHEN LOWER(@senderName) COLLATE Latin1_General_CI_AI LIKE LOWER(SUBSTRING(sender, 1, CHARINDEX(' ', sender) - 1)) COLLATE Latin1_General_CI_AI + '%'
                       AND LOWER(@senderName) COLLATE Latin1_General_CI_AI LIKE '%' + LOWER(REPLACE(SUBSTRING(sender, CHARINDEX(' ', sender) + 1, LEN(sender)), '*', '')) COLLATE Latin1_General_CI_AI + '%'
                      THEN 1 ELSE 0 
                    END
                  ELSE
                    CASE 
                      WHEN LOWER(@senderName) COLLATE Latin1_General_CI_AI LIKE LOWER(REPLACE(sender, '*', '')) COLLATE Latin1_General_CI_AI + '%' 
                      THEN 1 ELSE 0 
                    END
                END = 1
              )
            ORDER BY created_at ASC;

            IF @MatchedId IS NOT NULL
            BEGIN
              UPDATE yape_payments 
              SET is_used = 1, used_at = GETDATE(), verified_sender = @senderName
              WHERE id = @MatchedId;

              COMMIT TRANSACTION;
              SELECT 1 AS success;
            END
            ELSE
            BEGIN
              ROLLBACK TRANSACTION;
              SELECT 0 AS success;
            END
          `);

        const success = result.recordset[0].success === 1;
        if (success) {
          socket.emit("payment-verified", { amount });
          console.log(`[Socket] Pago previo encontrado y validado inmediatamente para ${senderName}`);
        }
      } catch (err) {
        console.error("Error en validación inmediata del socket:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Cliente desconectado (ID: ${socket.id})`);
    });
  });
}

export default router;
