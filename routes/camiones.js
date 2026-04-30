require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Ruta de prueba
router.get('/', (req, res) => {
    res.send('Ruta camiones funcionando');
});

// ================================
// Crear Camion
// ================================

router.post('/crear', auth, async (req, res) => {
    try {
        const { placa, chofer } = req.body;

        // Validación básica de campos
        if (!placa || !chofer) {
            return res.status(400).json({ mensaje: 'Placa y chofer son requeridos.' });
        }

        const nuevoCamion = await db.query(
            `INSERT INTO camiones (placa, chofer) VALUES ($1,$2) RETURNING *`,
            [placa, chofer]
        );

        res.status(201).json(nuevoCamion.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error creando camión.' });
    }
});

// ================================
// Guardar ubicación del camión
// ================================

router.post('/ubicacion', auth, async (req, res) => {
    try {
        const { idCamion, latitud, longitud } = req.body;

        // Validación básica de campos
        if (!idCamion || latitud === undefined || longitud === undefined) {
            return res.status(400).json({ mensaje: 'idCamion, latitud y longitud son requeridos.' });
        }

        const nuevaUbicacion = await db.query(
            `INSERT INTO ubicacionesCamion (idCamion, latitud, longitud) VALUES ($1,$2,$3) RETURNING *`,
            [idCamion, latitud, longitud]
        );

        res.status(201).json(nuevaUbicacion.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error guardando ubicación.' });
    }
});

// ================================
// Obtener última ubicación
// ================================

router.get('/ubicacion/:idCamion', auth, async (req, res) => {
    try {
        const { idCamion } = req.params;

        const ubicacion = await db.query(
            `SELECT * FROM ubicacionesCamion WHERE idCamion = $1 ORDER BY fecha DESC LIMIT 1`,
            [idCamion]
        );

        if (ubicacion.rows.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontró ubicación para ese camión.' });
        }

        res.json(ubicacion.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error obteniendo ubicación.' });
    }
});

module.exports = router;
