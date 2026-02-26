/**
 * Middleware de seguridad para filtrar el acceso basado en una lista blanca de IPs.
 */
export const ipWhitelistMiddleware = (req, res, next) => {
    // 1. Obtener IPs permitidas desde las variables de entorno
    // Se convierten en un array, se trimmean los espacios y se filtran entradas vacías.
    const allowedIpsString = process.env.ALLOWED_IPS || "";
    const allowedIps = allowedIpsString
        .split(",")
        .map((ip) => ip.trim())
        .filter((ip) => ip.length > 0);

    // 2. Obtener la IP del cliente
    // Se verifica primero 'x-forwarded-for' (para proxies/balanceadores) y luego remoteAddress.
    // 'x-forwarded-for' puede contener múltiples IPs (client, proxy1, proxy2...), tomamos la primera.
    const forwardedHeader = req.headers["x-forwarded-for"];
    let clientIp = forwardedHeader
        ? forwardedHeader.split(",")[0].trim()
        : req.socket.remoteAddress || "";

    // 3. Normalización básica de la IP
    // Eliminar prefijo IPv6-mapped IPv4 (::ffff:) para simplificar comparaciones con IPv4 estándar.
    if (clientIp.startsWith("::ffff:")) {
        clientIp = clientIp.substring(7);
    }

    // Normalizar localhost IPv6 (::1) a 127.0.0.1 si se desea consistencia, pero mejor dejar que la config lo controle.
    // Aquí solo normalizamos el mapeo IPv4.

    // 4. Verificación
    // Si la lista de IPs permitidas está vacía, se deniega el acceso por defecto (seguridad restrictiva).
    // Si la IP del cliente está en la lista, se permite el paso.
    if (allowedIps.includes(clientIp)) {
        next();
    } else {
        // 5. Logging y Respuesta de Error
        // console.warn(`[SECURITY] Access denied for IP: ${clientIp} (Headers: ${forwardedHeader || "None"})`);

        return res.status(403).json({
            error: "Acceso restringido por Whitelist de IP"
        });
    }
};
