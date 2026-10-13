// ============================================================
// PUNTO DE ENTRADA / ARRANQUE
// Solo se encarga de montar la aplicación: variables de entorno,
// conexión a MongoDB, middlewares, capas y servidor HTTP.
// ============================================================
// Cargar .env solo en local. En Cloud Run las variables llegan inyectadas por la
// plataforma, así que no forzamos dotenv (evita pisarlas durante el arranque).
const esLocal = process.env.K_SERVICE === undefined && process.env.K_REVISION === undefined;
if (esLocal) {
    require('dotenv').config();
}
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

// Conexión a MongoDB Atlas (base de datos real) + creación del administrador
async function arrancar() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
        console.log('¡Conectado con éxito a MongoDB Atlas!');
    } catch (err) {
        console.error('Error conectando a MongoDB:', err);
        process.exit(1);
    }

    // Crear (o promover) la cuenta de administrador inicial si hace falta.
    // Es el mecanismo de creación del primer admin del proyecto.
    // Se reintenta porque en Cloud Run las variables pueden tardar un poco en
    // estar disponibles durante el arranque en frío.
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
        console.log('[LOG - ADMIN] No hay ADMIN_EMAIL/ADMIN_PASSWORD definidos.');
        return;
    }
    for (let intento = 1; intento <= 5; intento++) {
        const listo = await logica.asegurarAdmin(email, password);
        if (listo) return;
        console.log(`[LOG - ADMIN] Reintento ${intento}/5 en 3s...`);
        await new Promise(r => setTimeout(r, 3000));
    }
    console.error('[LOG - ADMIN] No se pudo crear el administrador tras 5 intentos.');
}
arrancar();

// Conectar la API bajo /api
app.use('/api', crearRouter());

// Arrancar el servidor
// En Cloud Run el puerto lo inyecta la plataforma en la variable PORT (8080);
// en local usamos 3000 por defecto.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Dasna vibrando en http://localhost:${PORT}`);
});
