require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { generarCsrfToken, verificarCsrfToken } = require('./middleware/csrfMiddleware');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

app.set('io', io);

const db = require('./config/db');
const usuariosRoutes = require('./routes/usuarios');
const reportesRoutes = require('./routes/reportes');
const camionesRoutes = require('./routes/camiones');
const adminRoutes = require('./routes/admin');
const rutasRoutes = require('./routes/rutas');

// ========================
// Middlewares
// ========================

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ========================
// Helmet — Encabezados de seguridad
// ========================

app.use(helmet());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
        },
    })
);
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.xContentTypeOptions());
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));
app.use(helmet.permittedCrossDomainPolicies());
app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', "geolocation=(self), camera=(), microphone=()");
    next();
});

// ========================
// CSRF — Generar token en cada petición
// ========================
app.use(generarCsrfToken);

// ========================
// CSRF — Verificar token en peticiones que modifican datos
// ========================
app.use(verificarCsrfToken);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// ========================
// Socket.io
// ========================
const chofersConectados = {};

io.on('connection', (socket) => {
    console.log(`Socket conectado: ${socket.id}`);

    socket.on('chofer:iniciar', (datos) => {
        chofersConectados[datos.idCamion] = socket.id;
        socket.idCamion = datos.idCamion;
        console.log(`Camión ${datos.idCamion} en ruta`);
        io.emit('camion:en-ruta', { idCamion: datos.idCamion });
    });

    socket.on('chofer:ubicacion', async (datos) => {
        const { idCamion, latitud, longitud } = datos;
        try {
            await db.query(
                `INSERT INTO ubicacionesCamion (idcamion, latitud, longitud) VALUES ($1, $2, $3)`,
                [idCamion, latitud, longitud]
            );
        } catch (err) {
            console.error('Error guardando ubicación:', err.message);
        }
        io.emit('camion:ubicacion', { idCamion, latitud, longitud });
    });

    socket.on('chofer:terminar', (datos) => {
        const idCamion = datos?.idCamion || socket.idCamion;
        if (idCamion) {
            delete chofersConectados[idCamion];
            console.log(`Camión ${idCamion} terminó su ruta`);
            io.emit('camion:fuera-de-ruta', { idCamion });
        }
    });

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

server.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});

db.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error conectando a PostgreSQL:', err.message);
    } else {
        console.log('PostgreSQL conectado:', res.rows[0].now);
    }
});
