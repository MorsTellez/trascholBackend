// Cargamos las variables de entorno al inicio
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// Conexión a la base de datos
const db = require('./config/db');

// Importar rutas
const usuariosRoutes = require('./routes/usuarios');
const reportesRoutes = require('./routes/reportes');
const camionesRoutes = require('./routes/camiones');


// ========================
// Middlewares
// ========================

app.use(cors());
app.use(express.json());


// ========================
// Ruta de prueba
// ========================

app.get('/', (req, res) => {
    res.json({ mensaje: 'API TrashCol funcionando ✅' });
});


// ========================
// Rutas
// ========================

app.use('/usuarios', usuariosRoutes);
app.use('/reportes', reportesRoutes);
app.use('/camiones', camionesRoutes);


// ========================
// Inicio del servidor
// ========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});

// Verificar conexión a la base de datos
db.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error conectando a PostgreSQL:', err.message);
    } else {
        console.log('✅ PostgreSQL conectado:', res.rows[0].now);
    }
});
