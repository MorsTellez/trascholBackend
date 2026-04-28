const express = require('express')
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth')

// ================================
// Ruta de prueba usuarios
// ================================

router.get('/', (req, res) => {
    res.send('Ruta usuarios funcionando');
});

// ================================
// Registrar usuario
// ================================

router.post('/registro', async (req, res) => {


    try {

        const { nombre, correo, password } = req.body;

        //Encriptar contraseñas
        const passwordEncriptado = await bcrypt.hash(password, 10);

        const nuevoUsuario = await db.query(
            'INSERT INTO usuarios(nombre, correo, password) VALUES($1,$2,$3) RETURNING *',
            [nombre, correo, passwordEncriptado]
        );

        res.json(nuevoUsuario.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error registrando usuario');
    }

});

// ================================
// Login usuario
// ================================
router.post('/login', async (req, res) => {

    try {

        const { correo, password } = req.body;

        // Buscar usuario
        const usuario = await db.query(
            'SELECT * FROM usuarios WHERE correo = $1',
            [correo]
        );

        if (usuario.rows.length === 0) {
            return res.status(400).json('Usuario no encontrado');
        }

        // Comparar contraseña
        const validPassword = await bcrypt.compare(
            password,
            usuario.rows[0].password
        );

        if (!validPassword) {
            return res.status(400).json('Contraseña incorrecta');
        }

        // Crear Token
        const token = jwt.sign(
            { id: usuario.rows[0].idusuario },
            'secretkey',
            { expiresIn: '8h' }
        );

        res.json({
            mensaje: "Login exitoso",
            token,
            usuario: usuario.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error en login');
    }

});

//Ver los usuarios creados
router.get('/todos', async (req, res) => {
    const usuarios = await db.query('SELECT * FROM usuarios');
    res.json(usuarios.rows)
})

//Ruta protegida 
router.get('/perfil', auth, async (req, res) => {
    res.json({
        mensaje: "Ruta protegida",
        usuario: req.usuario
    })
});

// Exportamos rutas
module.exports = router;