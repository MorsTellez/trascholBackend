// Importamos Pool desde la librería pg
// Pool permite manejar múltiples conexiones a la base de datos
const { Pool } = require('pg');


// ================================
// Configuración de la Base de Datos
// ================================

// Creamos una nueva conexión a PostgreSQL
const pool = new Pool({

    // Usuario de PostgreSQL
    user: 'postgres',

    // Servidor donde se encuentra PostgreSQL
    host: 'localhost',

    // Nombre de la base de datos creada
    database: 'trashcol',

    // Contraseña de PostgreSQL
    password: 'ingTecNM@voly2',

    // Puerto por defecto de PostgreSQL
    port: 5432
});


// ================================
// Exportamos la conexión
// ================================

// Esto permite usar la conexión en cualquier archivo del backend
module.exports = pool;