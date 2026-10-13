// ============================================================
// PUNTO DE ENTRADA / ARRANQUE
// Solo se encarga de montar la aplicación: variables de entorno,
// conexión a MongoDB, middlewares, capas y servidor HTTP.
// ============================================================
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser'); // Permite leer cookies
const { crearRouter } = require('./api.js');   // Capa API
const logica = require('./logica.js');         // Capa lógica

const app = express();

// Middlewares generales
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../cliente'))); // El backend sirve el frontend (mismo origen)

// Conexión a MongoDB Atlas (base de datos real)
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('¡Conectado con éxito a MongoDB Atlas!');
        // Crear (o promover) la cuenta de administrador inicial si hace falta.
        // Es el mecanismo de creación del primer admin del proyecto.
        await logica.asegurarAdmin(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
    })
    .catch(err => console.error('Error conectando a MongoDB:', err));

// Conectar la API bajo /api
app.use('/api', crearRouter());

// Arrancar el servidor
// En Cloud Run el puerto lo inyecta la plataforma en la variable PORT (8080);
// en local usamos 3000 por defecto.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Dasna vibrando en http://localhost:${PORT}`);
});
