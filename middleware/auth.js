require('dotenv').config();
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        
        // Leer token desde cookie segura (HttpOnly)

        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({ mensaje: 'Acceso denegado. Token no proporcionado.' });
        }

        // Verificar token usando la clave secreta del .env
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        // Guardar datos del usuario para usarlos en la ruta
        req.usuario = verified;
        next();

    } catch (error) {
        res.status(401).json({ mensaje: 'Token no válido.' });
    }
};

module.exports = auth;
