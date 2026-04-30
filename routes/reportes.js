require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// ================================
// Configuración de multer (fotos)
// ================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const nombre = `reporte-${Date.now()}${ext}`;
        cb(null, nombre);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
    fileFilter: (req, file, cb) => {
        const tipos = /jpeg|jpg|png|webp/;
        const valido = tipos.test(path.extname(file.originalname).toLowerCase());
        if (valido) cb(null, true);
        else cb(new Error('Solo se permiten imágenes (jpg, png, webp).'));
    }
});

// Ruta de prueba
router.get('/', (req, res) => {
    res.send('Ruta de reportes funcionando.');
});

// ================================
// Crear Reporte (con foto opcional)
// ================================

router.post('/crear', auth, upload.single('foto'), async (req, res) => {
    try {
        const { descripcion, latitud, longitud } = req.body;
        const idUsuario = req.usuario.id;
        const foto = req.file ? req.file.filename : null;

        if (!descripcion || latitud === undefined || longitud === undefined) {
            return res.status(400).json({ mensaje: 'Descripción, latitud y longitud son requeridos.' });
        }

        const nuevoReporte = await db.query(
            `INSERT INTO reportes (idUsuario, descripcion, foto, latitud, longitud)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [idUsuario, descripcion, foto, latitud, longitud]
        );

        res.status(201).json(nuevoReporte.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error creando reporte.' });
    }
});

// ================================
// Mis reportes (del usuario logueado)
// ================================

router.get('/mis-reportes', auth, async (req, res) => {
    try {
        const idUsuario = req.usuario.id;

        const reportes = await db.query(
            `SELECT * FROM reportes
             WHERE idUsuario = $1
             ORDER BY fecha DESC`,
            [idUsuario]
        );

        res.json(reportes.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error obteniendo reportes.' });
    }
});

// ================================
// Todos los reportes (admin)
// ================================

router.get('/todos', auth, async (req, res) => {
    try {
        const reportes = await db.query(
            `SELECT reportes.*, usuarios.nombre
             FROM reportes
             JOIN usuarios ON reportes.idUsuario = usuarios.idUsuario
             ORDER BY fecha DESC`
        );

        res.json(reportes.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error obteniendo reportes.' });
    }
});

// ================================
// Actualizar estado de reporte (admin)
// ================================

router.patch('/:id/estado', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const estadosValidos = ['pendiente', 'en_proceso', 'resuelto', 'rechazado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ mensaje: 'Estado no válido.' });
        }

        const resultado = await db.query(
            `UPDATE reportes SET estado = $1 WHERE idReporte = $2 RETURNING *`,
            [estado, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Reporte no encontrado.' });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error actualizando estado.' });
    }
});

module.exports = router;
