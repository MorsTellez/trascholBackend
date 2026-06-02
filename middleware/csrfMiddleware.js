const crypto = require('crypto');

// ========================
// Generar token CSRF
// ========================
const generarCsrfToken = (req, res, next) => {
    if (req.cookies?.csrfToken) {
        return next();
    }

    // Generar token aleatorio seguro
    const token = crypto.randomBytes(32).toString('hex');

    // Guardar en cookie LEGIBLE por JavaScript (sin HttpOnly)
    // para que el frontend pueda leerla y mandarla en el header
    res.cookie('csrfToken', token, {
        httpOnly: false,      
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 8 * 60 * 60 * 1000 // 8 horas
    });

    req.csrfToken = token;
    next();
};

// ========================
// Verificar token CSRF en peticiones POST, PATCH, DELETE
// ========================
const verificarCsrfToken = (req, res, next) => {
    // Solo verificar en métodos que modifican datos
    const metodosProtegidos = ['POST', 'PATCH', 'PUT', 'DELETE'];
    if (!metodosProtegidos.includes(req.method)) {
        return next();
    }

    const tokenCookie = req.cookies?.csrfToken;
    const tokenHeader = req.headers['x-csrf-token'];

    if (!tokenCookie || !tokenHeader) {
        return res.status(403).json({ mensaje: 'Token CSRF faltante.' });
    }

    // Comparar de forma segura para evitar timing attacks
    const cookieBuf = Buffer.from(tokenCookie);
    const headerBuf = Buffer.from(tokenHeader);

    if (cookieBuf.length !== headerBuf.length ||
        !crypto.timingSafeEqual(cookieBuf, headerBuf)) {
        return res.status(403).json({ mensaje: 'Token CSRF inválido.' });
    }

    next();
};

module.exports = { generarCsrfToken, verificarCsrfToken };
