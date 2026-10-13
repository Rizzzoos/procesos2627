// ============================================================
// CAPA API (endpoints REST)
// Único módulo que conoce HTTP: Express, cookies y JWT.
// No contiene reglas de negocio: solo traduce peticiones/respuestas
// y delega en la capa de lógica (logica.js).
// ============================================================
const express = require('express');
const jwt = require('jsonwebtoken');
const logica = require('./logica.js');

// Middleware "Guardaespaldas". Comprueba la cookie antes de dejar pasar.
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

function crearRouter() {
    const router = express.Router();

    // Ruta para registrarse
    router.post('/registro', async (req, res) => {
        const { email, password } = req.body;
        const resultado = await logica.registrarUsuario(email, password);

        if (resultado.exito) res.status(200).json({ mensaje: resultado.mensaje });
        else res.status(400).json({ error: resultado.error });
    });

    // Ruta para iniciar sesión
    router.post('/login', async (req, res) => {
        const { email, password } = req.body;
        const resultado = await logica.loginUsuario(email, password);

        if (resultado.exito) {
            // Creamos la sesión y la guardamos en una cookie de alta seguridad
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

    // Ruta para que el frontend compruebe si hay sesión activa
    router.get('/auth/me', protegerRuta, (req, res) => {
        res.status(200).json({ email: req.usuario.email, rol: req.usuario.rol });
    });

    // Ruta para cerrar sesión
    router.post('/logout', (req, res) => {
        res.clearCookie('sesion_dasna');
        res.status(200).json({ mensaje: 'Sesión cerrada' });
    });

    // 1. Listar todos los usuarios (solo administrador)
    router.get('/admin/usuarios', protegerRuta, async (req, res) => {
        const resultado = await logica.listarUsuarios(req.usuario.rol);

        if (resultado.exito) res.status(200).json(resultado.datos);
        else res.status(403).json({ error: resultado.error });
    });

    // 2. Comprobar si un usuario está activo (solo administrador)
    router.get('/admin/usuarios/:email/estado', protegerRuta, async (req, res) => {
        const emailAComprobar = req.params.email;
        const resultado = await logica.comprobarEstado(emailAComprobar, req.usuario.rol);

        if (resultado.exito) res.status(200).json({ activo: resultado.activo });
        else res.status(403).json({ error: resultado.error });
    });

    // 3. Eliminar usuario (Propio o cualquiera si eres admin)
    router.delete('/usuarios/:email', protegerRuta, async (req, res) => {
        const resultado = await logica.eliminarUsuario(
            req.params.email,
            req.usuario.email,
            req.usuario.rol
        );

        if (resultado.exito) res.status(200).json({ mensaje: resultado.mensaje });
        else res.status(403).json({ error: resultado.error });
    });

    return router;
}

module.exports = { crearRouter };
