const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

//Ruta para reportes
router.get('/', (req, res) =>{
    res.send('Ruta de reportes funcionando.');
});


// ================================
// Crear Reporte
// ================================

router.post('/crear', auth, async (req, res) => {

    try {

        const { descripcion, latitud, longitud } = req.body;
        const idUsuario = req.usuario.id;

        const nuevoReporte = await db.query(
            `INSERT INTO reportes 
            (idUsuario, descripcion, latitud, longitud) 
            VALUES ($1,$2,$3,$4) 
            RETURNING *`,
            [idUsuario, descripcion, latitud, longitud]
        );

        res.json(nuevoReporte.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error creando reporte');
    }

});


// ================================
// Obtener reportes
// ================================

router.get('/todos', auth, async (req, res) => {

    try {

        const reportes = await db.query(
            `SELECT reportes.*, usuarios.nombre 
             FROM reportes
             JOIN usuarios 
             ON reportes.idUsuario = usuarios.idUsuario
             ORDER BY fecha DESC`
        );

        res.json(reportes.rows);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error obteniendo reportes');
    }

});

module.exports = router;