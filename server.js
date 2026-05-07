require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
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
