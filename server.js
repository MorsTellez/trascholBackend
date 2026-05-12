require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();

//Servidor http base
const server = http.createServer(app);

//Socket.io
const io = new Server(server, {
    cors: {

        origin: '*',
        methods: ['GET', 'POST']
    }
})

app.set('io', io);

//Rutas de HTTP
const db = require('./config/db');
const usuariosRoutes = require('./routes/usuarios');
const reportesRoutes = require('./routes/reportes');
const camionesRoutes = require('./routes/camiones');
const adminRoutes = require('./routes/admin');
const rutasRoutes = require('./routes/rutas');

// ========================
// Middlewares
// ========================

app.use(cors());
app.use(express.json());

// Servir fotos subidas como archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========================
// Ruta de prueba
// ========================

app.get('/', (req, res) => {
    res.json({ mensaje: 'API TrashCol funcionando' });
});

// ========================
// Rutas
// ========================

app.use('/usuarios', usuariosRoutes);
app.use('/reportes', reportesRoutes);
app.use('/camiones', camionesRoutes);
app.use('/admin', adminRoutes);
app.use('/rutas', rutasRoutes);

//Cuerpo de Socket.io
const chofersConectados = {};

io.on('connection', (socket) => {
    console.log(`Socket conectado: ${socket.id}`);

    // El chofer inicia su ruta
    // datos: { idCamion, latitud, longitud }
    socket.on('chofer:iniciar', (datos) => {
        chofersConectados[datos.idCamion] = socket.id;
        socket.idCamion = datos.idCamion;
        console.log(`Camión ${datos.idCamion} en ruta`);

        // Avisamos a los ciudadanos que este camión salió
        io.emit('camion:en-ruta', { idCamion: datos.idCamion });
    });

    // El chofer manda su ubicación cada 5 segundos
    // datos: { idCamion, latitud, longitud }
    socket.on('chofer:ubicacion', async (datos) => {
        const { idCamion, latitud, longitud } = datos;

        // Guardamos en la BD para historial
        try {
            await db.query(
                `INSERT INTO ubicacionesCamion (idcamion, latitud, longitud)
                 VALUES ($1, $2, $3)`,
                [idCamion, latitud, longitud]
            );
        } catch (err) {
            console.error('Error guardando ubicación:', err.message);
        }

        // Transmitimos a todos los ciudadanos conectados
        io.emit('camion:ubicacion', { idCamion, latitud, longitud });
    });

    // El chofer termina su ruta
    socket.on('chofer:terminar', (datos) => {
        const idCamion = datos?.idCamion || socket.idCamion;
        if (idCamion) {
            delete chofersConectados[idCamion];
            console.log(`Camión ${idCamion} terminó su ruta`);
            io.emit('camion:fuera-de-ruta', { idCamion });
        }
    });

    // Si el chofer cierra el navegador sin avisar
    socket.on('disconnect', () => {
        const idCamion = socket.idCamion;
        if (idCamion && chofersConectados[idCamion]) {
            delete chofersConectados[idCamion];
            io.emit('camion:fuera-de-ruta', { idCamion });
        }
        console.log(`Socket desconectado: ${socket.id}`);
    });
});

// ========================
// Inicio del servidor
// ========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});

db.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error conectando a PostgreSQL:', err.message);
    } else {
        console.log('PostgreSQL conectado:', res.rows[0].now);
    }
});
