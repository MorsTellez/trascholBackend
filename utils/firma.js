const crypto = require('crypto');

const HMAC_SECRET = process.env.HMAC_SECRET;

// ========================
// Generar firma HMAC-SHA256
// ========================
const generarFirma = (datos) => {
    const contenido = JSON.stringify(datos);
    return crypto
        .createHmac('sha256', HMAC_SECRET)
        .update(contenido)
        .digest('hex');
};

// ========================
// Verificar firma HMAC-SHA256
// ========================
const verificarFirma = (datos, firmaGuardada) => {
    const firmaCalculada = generarFirma(datos);
    const bufA = Buffer.from(firmaCalculada);
    const bufB = Buffer.from(firmaGuardada);

    if (bufA.length !== bufB.length) return false;

    // Comparación segura para evitar timing attacks
    return crypto.timingSafeEqual(bufA, bufB);
};

module.exports = { generarFirma, verificarFirma };
