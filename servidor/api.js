// ============================================================
// CAPA API (endpoints REST)
// Único módulo que conoce HTTP: Express, cookies y JWT.
// No contiene reglas de negocio: solo traduce peticiones/respuestas
// y delega en la capa de lógica (logica.js).
// ============================================================
const express = require('express');
const jwt = require('jsonwebtoken');
const logica = require('./logica.js');
const oauth = require('./oauth.js'); // Hito 4: inicio de sesión con Google

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
        const { email, password, nombre } = req.body;
        const resultado = await logica.registrarUsuario(email, password, nombre);

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

    // ========================================================
    // HITO 4 - Confirmación de cuenta por correo
    // ========================================================

    // GET (el usuario pulsa el enlace del correo) -> confirma y redirige al login
    // con un motivo en la URL para que la interfaz muestre el mensaje.
    router.get('/confirmar', async (req, res) => {
        const resultado = await logica.confirmarCuenta(req.query.token);
        const motivo = resultado.exito ? 'confirmada' : 'error';
        res.redirect(`/?resultado=${motivo}`);
        // El detalle del error lo pierde la redirección, así que lo dejamos en el log
        if (!resultado.exito) console.log(`[LOG - ALERTA] Confirmación rechazada: ${resultado.error}`);
    });

    // ========================================================
    // HITO 4 - Inicio de sesión con Google (OAuth)
    // ========================================================

    // 1. Redirección a la pantalla de consentimiento de Google
    router.get('/oauth/google', (req, res) => {
        if (!oauth.configurado()) {
            // No devolvemos JSON: el botón navega con location.href, así que
            // volvemos a la portada con un motivo que la interfaz traduce.
            return res.redirect('/?resultado=oauth_no_configurado');
        }
        res.redirect(oauth.crearUrlAutorizacion());
    });

    // 2. Google vuelve aquí con el código; lo canjeamos y creamos sesión
    router.get('/oauth/google/callback', async (req, res) => {
        // Errores claros para el usuario: siempre acabamos en el login con un motivo
        const fallo = (motivo) => {
            console.log(`[LOG - ALERTA] OAuth con Google fallido: ${motivo}`);
            res.redirect(`/?resultado=${motivo}`);
        };

        if (!oauth.configurado()) return fallo('oauth_no_configurado');
        if (req.query.error) return fallo('google_denegado'); // el usuario canceló
        if (!req.query.code) return fallo('codigo_ausente');

        try {
            const perfil = await oauth.intercambiarCodigo(req.query.code);
            const resultado = await logica.entrarConGoogle(perfil.email, perfil.nombre);

            if (!resultado.exito) return fallo('oauth_fallo');

            // Misma sesión que el login con contraseña
            const token = jwt.sign(
                { email: resultado.email, rol: resultado.rol },
                process.env.JWT_SECRET,
                { expiresIn: '2h' }
            );
            res.cookie('sesion_dasna', token, { httpOnly: true });
            res.redirect('/dashboard.html');
        } catch (error) {
            return fallo('oauth_fallo');
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

    // [VARIANTE 5] Decidir si un actor puede eliminar a un objetivo (ruta pública, no requiere sesión)
    router.post('/prueba/eliminar', (req, res) => {
        const { actor, objetivo, administradores } = req.body || {};
        const resultado = logica.puedeEliminar(actor, objetivo, administradores);

        if (resultado.error) {
            res.status(400).json({ error: resultado.error });
        } else {
            res.status(200).json({ permitido: resultado.permitido, motivo: resultado.motivo });
        }
    });

    return router;
}

module.exports = { crearRouter };
