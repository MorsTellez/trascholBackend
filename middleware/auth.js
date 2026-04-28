const jwt = require('jsonwebtoken');
const auth = (req, res, next) => {
    try {
        //Obtener el token del header
        const token = req.header('Authorization');
        if (!token) {
            return res.status(401).json('Acceso denegado.');
        }
        //Verificar token
        const verified = jwt.verify(token, 'secretkey');
        //Guardar usuarios
        req.usuario = verified;
        next();
    } catch (error) {
        res.status(400).json('Token no valido.')
    }
};

module.exports = auth;