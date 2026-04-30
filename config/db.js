// Cargamos las variables de entorno desde el archivo .env
require('dotenv').config();

// Importamos Pool desde la librería pg
// Pool permite manejar múltiples conexiones a la base de datos
const { Pool } = require('pg');


// ================================
// Configuración de la Base de Datos
// ================================

// Creamos una nueva conexión a PostgreSQL usando variables de entorno
const pool = new Pool({
    user:     process.env.DB_USER,
    host:     process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port:     process.env.DB_PORT
});


// ================================
// Exportamos la conexión
// ================================

// Esto permite usar la conexión en cualquier archivo del backend
module.exports = pool;