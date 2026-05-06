const db = require('../config/db');

// Middleware que verifica que el usuario logueado sea administrador
const esAdmin = async (req, res, next) => {
    try {
        const resultado = await db.query(
            'SELECT tipousuario FROM usuarios WHERE idusuario = $1',
            [req.usuario.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        if (resultado.rows[0].tipousuario !== 'administrador') {
            return res.status(403).json({ mensaje: 'Acceso denegado. Se requiere rol de administrador.' });
        }

        next();

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error verificando permisos.' });
    }
};

module.exports = esAdmin;