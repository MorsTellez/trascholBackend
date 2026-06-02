const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes en hex = 64 chars
const IV_LENGTH = 16;

// ========================
// Cifrar texto
// ========================
const cifrar = (texto) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    const cifrado = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
    // Guardar iv:textoCifrado para poder descifrar después
    return iv.toString('hex') + ':' + cifrado.toString('hex');
};

// ========================
// Descifrar texto
// ========================
const descifrar = (textoCifrado) => {
    try {
        const [ivHex, dataHex] = textoCifrado.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const data = Buffer.from(dataHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
        const descifrado = Buffer.concat([decipher.update(data), decipher.final()]);
        return descifrado.toString('utf8');
    } catch {
        // Si no se puede descifrar, devolver el texto tal cual (datos viejos)
        return textoCifrado;
    }
};

module.exports = { cifrar, descifrar };
