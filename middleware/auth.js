require('dotenv').config();
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        // Obtener el token del header en formato "Bearer <token>"
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ mensaje: 'Acceso denegado. Token no proporcionado.' });
        }

        // Extraer el token quitando el prefijo "Bearer "
        const token = authHeader.replace('Bearer ', '');

        // Verificar token usando la clave secreta del .env
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        // Guardar datos del usuario para usarlos en la ruta
        req.usuario = verified;
        next();

    } catch (error) {
        res.status(400).json({ mensaje: 'Token no válido.' });
    }
};

module.exports = auth;