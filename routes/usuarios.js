require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// ================================
// Ruta de prueba
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

        if (!nombre || !correo || !password) {
            return res.status(400).json({ mensaje: 'Nombre, correo y password son requeridos.' });
        }

        const usuarioExistente = await db.query(
            'SELECT * FROM usuarios WHERE correo = $1',
            [correo]
        );
        if (usuarioExistente.rows.length > 0) {
            return res.status(400).json({ mensaje: 'El correo ya está registrado.' });
        }

        //hasing de la contraseña
        const passwordEncriptado = await bcrypt.hash(password, 10);

        const nuevoUsuario = await db.query(
            'INSERT INTO usuarios(nombre, correo, password) VALUES($1,$2,$3) RETURNING idusuario, nombre, correo',
            [nombre, correo, passwordEncriptado]
        );

        res.status(201).json({ mensaje: 'Usuario registrado exitosamente.', usuario: nuevoUsuario.rows[0] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error registrando usuario.' });
    }
});

// ================================
// Login usuario
// ================================

router.post('/login', async (req, res) => {
    try {
        const { correo, password } = req.body;

        if (!correo || !password) {
            return res.status(400).json({ mensaje: 'Correo y password son requeridos.' });
        }

        const usuario = await db.query(
            'SELECT * FROM usuarios WHERE correo = $1',
            [correo]
        );

        if (usuario.rows.length === 0) {
            return res.status(400).json({ mensaje: 'Usuario no encontrado.' });
        }

        //comparar las contraseña
        const validPassword = await bcrypt.compare(password, usuario.rows[0].password);

        if (!validPassword) {
            return res.status(400).json({ mensaje: 'Contraseña incorrecta.' });
        }

        // Crear Token JWT
        const token = jwt.sign(
            { id: usuario.rows[0].idusuario },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );


        // Cookie segura — HttpOnly, Secure, SameSite=Strict
        res.cookie('token', token, {
            httpOnly: true,       // JavaScript no puede leerla
            secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
            sameSite: 'Strict',   // No se envía desde otros sitios
            maxAge: 8 * 60 * 60 * 1000 // 8 horas en milisegundos
        });

        const { password: _, ...usuarioSinPassword } = usuario.rows[0];
        res.json({
            mensaje: 'Login exitoso.',
            usuario: usuarioSinPassword
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en login.' });
    }
});

// ================================
// Logout usuario
// ================================

router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
    });
    res.json({ mensaje: 'Sesión cerrada exitosamente.' });
});

// ================================
// Ver todos los usuarios (protegida)
// ================================

router.get('/todos', auth, async (req, res) => {
    try {
        const usuarios = await db.query(
            'SELECT idusuario, nombre, correo FROM usuarios'
        );
        res.json(usuarios.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error obteniendo usuarios.' });
    }
});

// ================================
// Ruta protegida - Perfil
// ================================

router.get('/perfil', auth, async (req, res) => {
    res.json({
        mensaje: 'Ruta protegida.',
        usuario: req.usuario
    });
});

module.exports = router;
