const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');


// Ruta prueba
router.get('/', (req, res) => {
    res.send('Ruta camiones funcionando');
});

// ================================
// Crear Camion
// ================================

router.post('/crear', auth, async (req, res) => {

    try {

        const { placa, chofer } = req.body;

        const nuevoCamion = await db.query(
            `INSERT INTO camiones 
            (placa, chofer) 
            VALUES ($1,$2) 
            RETURNING *`,
            [placa, chofer]
        );

        res.json(nuevoCamion.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error creando camion');
    }

});

// ================================
// Guardar ubicación del camión
// ================================

router.post('/ubicacion', auth, async (req, res) => {

    try {

        const { idCamion, latitud, longitud } = req.body;

        const nuevaUbicacion = await db.query(
            `INSERT INTO ubicacionesCamion 
            (idCamion, latitud, longitud) 
            VALUES ($1,$2,$3) 
            RETURNING *`,
            [idCamion, latitud, longitud]
        );

        res.json(nuevaUbicacion.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error guardando ubicación');
    }

});

// ================================
// Obtener última ubicación
// ================================

router.get('/ubicacion/:idCamion', auth, async (req, res) => {

    try {

        const { idCamion } = req.params;

        const ubicacion = await db.query(
            `SELECT * 
             FROM ubicacionesCamion
             WHERE idCamion = $1
             ORDER BY fecha DESC
             LIMIT 1`,
            [idCamion]
        );

        res.json(ubicacion.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error obteniendo ubicación');
    }

});

module.exports = router;