require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const esAdmin = require('../middleware/esAdmin');

// Todas las rutas de este archivo requieren token + ser admin
router.use(auth, esAdmin);

// ================================
// REPORTES
// ================================

// Ver todos los reportes con datos del usuario
router.get('/reportes', async (req, res) => {
    try {
        const { estado } = req.query; // Filtro opcional por estado

        let query = `
            SELECT reportes.*, usuarios.nombre AS nombre_usuario
            FROM reportes
            JOIN usuarios ON reportes.idusuario = usuarios.idusuario
        `;
        const params = [];

        if (estado) {
            query += ` WHERE reportes.estado = $1`;
            params.push(estado);
        }

        query += ` ORDER BY reportes.fecha DESC`;

        const reportes = await db.query(query, params);
        res.json(reportes.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error obteniendo reportes.' });
    }
});

// Cambiar estado de un reporte
router.patch('/reportes/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const estadosValidos = ['pendiente', 'en_proceso', 'resuelto', 'rechazado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ mensaje: 'Estado no válido.' });
        }

        const resultado = await db.query(
            `UPDATE reportes SET estado = $1 WHERE idreporte = $2 RETURNING *`,
            [estado, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Reporte no encontrado.' });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error actualizando reporte.' });
    }
});

// ================================
// CAMIONES
// ================================

// Ver todos los camiones
router.get('/camiones', async (req, res) => {
    try {
        const camiones = await db.query(
            `SELECT * FROM camiones ORDER BY idcamion ASC`
        );
        res.json(camiones.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error obteniendo camiones.' });
    }
});

// Crear camión
router.post('/camiones', async (req, res) => {
    try {
        const { placa, chofer } = req.body;

        if (!placa || !chofer) {
            return res.status(400).json({ mensaje: 'Placa y chofer son requeridos.' });
        }

        const nuevo = await db.query(
            `INSERT INTO camiones (placa, chofer) VALUES ($1, $2) RETURNING *`,
            [placa, chofer]
        );

        res.status(201).json(nuevo.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error creando camión.' });
    }
});

// Editar camión
router.patch('/camiones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { placa, chofer, estado } = req.body;

        const resultado = await db.query(
            `UPDATE camiones
             SET placa  = COALESCE($1, placa),
                 chofer = COALESCE($2, chofer),
                 estado = COALESCE($3, estado)
             WHERE idcamion = $4
             RETURNING *`,
            [placa, chofer, estado, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Camión no encontrado.' });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error actualizando camión.' });
    }
});

// Eliminar camión
router.delete('/camiones/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await db.query(`DELETE FROM camiones WHERE idcamion = $1`, [id]);
        res.json({ mensaje: 'Camión eliminado correctamente.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error eliminando camión.' });
    }
});

// ================================
// USUARIOS
// ================================

// Ver todos los usuarios
router.get('/usuarios', async (req, res) => {
    try {
        const usuarios = await db.query(
            `SELECT idusuario, nombre, correo, tipousuario, fecharegistro
             FROM usuarios
             ORDER BY fecharegistro DESC`
        );
        res.json(usuarios.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error obteniendo usuarios.' });
    }
});

// Cambiar tipo de usuario (ciudadano ↔ administrador)
router.patch('/usuarios/:id/tipo', async (req, res) => {
    try {
        const { id } = req.params;
        const { tipousuario } = req.body;

        const tiposValidos = ['ciudadano', 'administrador'];
        if (!tiposValidos.includes(tipousuario)) {
            return res.status(400).json({ mensaje: 'Tipo de usuario no válido.' });
        }

        const resultado = await db.query(
            `UPDATE usuarios SET tipousuario = $1 WHERE idusuario = $2 RETURNING idusuario, nombre, correo, tipousuario`,
            [tipousuario, id]
        );

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error actualizando usuario.' });
    }
});

// Estadísticas generales del dashboard admin
router.get('/estadisticas', async (req, res) => {
    try {
        const [usuarios, camiones, reportes, pendientes] = await Promise.all([
            db.query(`SELECT COUNT(*) FROM usuarios`),
            db.query(`SELECT COUNT(*) FROM camiones WHERE estado = 'activo'`),
            db.query(`SELECT COUNT(*) FROM reportes`),
            db.query(`SELECT COUNT(*) FROM reportes WHERE estado = 'pendiente'`)
        ]);

        res.json({
            totalUsuarios:   parseInt(usuarios.rows[0].count),
            camionesActivos: parseInt(camiones.rows[0].count),
            totalReportes:   parseInt(reportes.rows[0].count),
            reportesPendientes: parseInt(pendientes.rows[0].count)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error obteniendo estadísticas.' });
    }
});

module.exports = router;