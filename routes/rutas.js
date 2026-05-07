require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const esAdmin = require('../middleware/esAdmin');

// ================================
// RUTAS PÚBLICAS (ciudadano)
// ================================

// Obtener todas las rutas activas con sus puntos (para el mapa)
router.get('/', auth, async (req, res) => {
    try {
        // Traer todas las rutas activas con info del camión
        const rutas = await db.query(`
            SELECT rutas.*, camiones.placa, camiones.chofer, camiones.estado AS estado_camion
            FROM rutas
            JOIN camiones ON rutas.idcamion = camiones.idcamion
            WHERE rutas.activa = true AND camiones.estado = 'activo'
            ORDER BY rutas.idruta ASC
        `);

        // Para cada ruta, traer sus puntos ordenados
        const rutasConPuntos = await Promise.all(
            rutas.rows.map(async (ruta) => {
                const puntos = await db.query(`
                    SELECT latitud, longitud, orden
                    FROM puntosruta
                    WHERE idruta = $1
                    ORDER BY orden ASC
                `, [ruta.idruta]);

                return {
                    ...ruta,
                    puntos: puntos.rows
                };
            })
        );

        res.json(rutasConPuntos);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error obteniendo rutas.' });
    }
});

// Obtener una ruta específica con sus puntos
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const ruta = await db.query(`
            SELECT rutas.*, camiones.placa, camiones.chofer
            FROM rutas
            JOIN camiones ON rutas.idcamion = camiones.idcamion
            WHERE rutas.idruta = $1
        `, [id]);

        if (ruta.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Ruta no encontrada.' });
        }

        const puntos = await db.query(`
            SELECT latitud, longitud, orden
            FROM puntosruta
            WHERE idruta = $1
            ORDER BY orden ASC
        `, [id]);

        res.json({ ...ruta.rows[0], puntos: puntos.rows });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error obteniendo ruta.' });
    }
});

// ================================
// RUTAS ADMIN
// ================================

// Obtener todas las rutas (incluyendo inactivas) para el panel admin
router.get('/admin/todas', auth, esAdmin, async (req, res) => {
    try {
        const rutas = await db.query(`
            SELECT rutas.*, camiones.placa, camiones.chofer,
                   COUNT(puntosruta.idpunto) AS total_puntos
            FROM rutas
            JOIN camiones ON rutas.idcamion = camiones.idcamion
            LEFT JOIN puntosruta ON puntosruta.idruta = rutas.idruta
            GROUP BY rutas.idruta, camiones.placa, camiones.chofer
            ORDER BY rutas.idruta ASC
        `);

        res.json(rutas.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error obteniendo rutas.' });
    }
});
    
// Crear nueva ruta con sus puntos
router.post('/admin/crear', auth, esAdmin, async (req, res) => {
    try {
        const { idCamion, nombre, diasSemana, horario, puntos } = req.body;

        if (!idCamion || !nombre || !diasSemana || !horario) {
            return res.status(400).json({ mensaje: 'idCamion, nombre, diasSemana y horario son requeridos.' });
        }

        if (!puntos || puntos.length < 2) {
            return res.status(400).json({ mensaje: 'La ruta debe tener al menos 2 puntos.' });
        }

        // Crear la ruta
        const nuevaRuta = await db.query(`
            INSERT INTO rutas (idcamion, nombre, diasSemana, horario)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [idCamion, nombre, diasSemana, horario]);

        const idRuta = nuevaRuta.rows[0].idruta;

        // Insertar todos los puntos
        for (let i = 0; i < puntos.length; i++) {
            await db.query(`
                INSERT INTO puntosruta (idruta, latitud, longitud, orden)
                VALUES ($1, $2, $3, $4)
            `, [idRuta, puntos[i].lat, puntos[i].lng, i + 1]);
        }

        res.status(201).json({
            mensaje: 'Ruta creada exitosamente.',
            ruta: nuevaRuta.rows[0],
            totalPuntos: puntos.length
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error creando ruta.' });
    }
});

// Activar o desactivar una ruta
router.patch('/admin/:id/activa', auth, esAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { activa } = req.body;

        const resultado = await db.query(`
            UPDATE rutas SET activa = $1 WHERE idruta = $2 RETURNING *
        `, [activa, id]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Ruta no encontrada.' });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error actualizando ruta.' });
    }
});

// Eliminar una ruta (los puntos se eliminan en cascada)
router.delete('/admin/:id', auth, esAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        await db.query(`DELETE FROM rutas WHERE idruta = $1`, [id]);
        res.json({ mensaje: 'Ruta eliminada correctamente.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error eliminando ruta.' });
    }
});

module.exports = router;