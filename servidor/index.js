require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser'); // NUEVO
const jwt = require('jsonwebtoken'); // NUEVO
const datos = require('./datos.js');

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser()); // NUEVO: Permite leer cookies
app.use(express.static(path.join(__dirname, '../cliente')));

// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('¡Conectado con éxito a MongoDB Atlas!'))
    .catch(err => console.error('Error conectando a MongoDB:', err));

// Ruta para registrarse
app.post('/api/registro', async (req, res) => {
    const { email, password } = req.body;
    const resultado = await datos.registrarUsuario(email, password);
    
    if (resultado.exito) res.status(200).json({ mensaje: resultado.mensaje });
    else res.status(400).json({ error: resultado.error });
});

// Ruta para iniciar sesión (MODIFICADA)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const resultado = await datos.loginUsuario(email, password);
    
    if (resultado.exito) {
        // NUEVO: Creamos la sesión y la guardamos en una cookie de alta seguridad
        const token = jwt.sign(
            { email: email, rol: resultado.rol }, 
            process.env.JWT_SECRET, 
            { expiresIn: '2h' } // La sesión caduca a las 2 horas
        );
        res.cookie('sesion_dasna', token, { httpOnly: true });
        res.status(200).json({ mensaje: resultado.mensaje });
    } else {
        res.status(400).json({ error: resultado.error });
    }
});

// NUEVO: Middleware "Guardaespaldas". Comprueba la cookie antes de dejar pasar.
function protegerRuta(req, res, next) {
    const token = req.cookies.sesion_dasna;
    if (!token) return res.status(401).json({ error: 'No autorizado. Inicia sesión.' });

    try {
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decodificado; // Guardamos los datos del usuario (email y rol)
        next();
    } catch (error) {
        res.status(401).json({ error: 'Sesión inválida o caducada.' });
    }
}

// NUEVO: Ruta para que el frontend compruebe si hay sesión activa
app.get('/api/auth/me', protegerRuta, (req, res) => {
    res.status(200).json({ email: req.usuario.email, rol: req.usuario.rol });
});

// NUEVO: Ruta para cerrar sesión
app.post('/api/logout', (req, res) => {
    res.clearCookie('sesion_dasna');
    res.status(200).json({ mensaje: 'Sesión cerrada' });
});

// ==========================================
// RUTAS DE ADMINISTRADOR Y GESTIÓN DE USUARIOS
// ==========================================

// 1. Listar todos los usuarios
app.get('/api/admin/usuarios', protegerRuta, async (req, res) => {
    // req.usuario.rol viene de la cookie gracias a la función protegerRuta
    const resultado = await datos.listarUsuarios(req.usuario.rol);
    
    if (resultado.exito) res.status(200).json(resultado.datos);
    else res.status(403).json({ error: resultado.error });
});

// 2. Comprobar si un usuario está activo
app.get('/api/admin/usuarios/:email/estado', protegerRuta, async (req, res) => {
    const emailAComprobar = req.params.email; // Cogemos el email de la URL
    const resultado = await datos.comprobarEstado(emailAComprobar, req.usuario.rol);
    
    if (resultado.exito) res.status(200).json({ activo: resultado.activo });
    else res.status(403).json({ error: resultado.error });
});

// 3. Eliminar usuario (Propio o cualquiera si eres admin)
app.delete('/api/usuarios/:email', protegerRuta, async (req, res) => {
    const emailAEliminar = req.params.email;
    const emailSolicitante = req.usuario.email;
    const rolSolicitante = req.usuario.rol;

    const resultado = await datos.eliminarUsuario(emailAEliminar, emailSolicitante, rolSolicitante);
    
    if (resultado.exito) res.status(200).json({ mensaje: resultado.mensaje });
    else res.status(403).json({ error: resultado.error });
});

// Arrancar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Dasna vibrando en http://localhost:${PORT}`);
});