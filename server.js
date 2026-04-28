// Importamos Express para crear el servidor backend
const express = require('express');

// Importamos CORS para permitir comunicación con el frontend (React)
const cors = require('cors');

// Creamos la aplicación de Express
const app = express();

//Exportacion de la conexion con la base de datos
const db = require('./config/db');

//Ruta de los usuarios
const usuariosRoutes = require('./routes/usuarios');

//Ruta de los reportes
const reportesRoutes = require('./routes/reportes');

//Ruta de los camiones
const camionesRoutes = require('./routes/camiones');


// ========================
// Middlewares
// ========================

// Permite que el frontend pueda hacer peticiones al backend
app.use(cors());

// Permite recibir datos en formato JSON
app.use(express.json());


// ========================
// Ruta de prueba
// ========================

// Ruta principal para comprobar que la API funciona
app.get('/', (req, res) => {
    res.send('API TrashCol funcionando');
});


// ========================
// Configuración del servidor
// ========================

// Definimos el puerto donde correrá el servidor
const PORT = 3000;

// Iniciamos el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});

//Prueba de la conexion de la BD
db.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error conectando a la DB de PostgresSQL', err);
    } else {
        console.log('PostgresSQL conectando', res.rows);

    }
});

//Purba de los usuarios
app.use('/usuarios',usuariosRoutes);

//Purba de los reportes
app.use('/reportes', reportesRoutes);

//Purba de los camiones 
app.use('/camiones', camionesRoutes);
