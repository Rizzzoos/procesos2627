// ============================================================
// HITO 4 - INICIO DE SESIÓN CON GOOGLE (OAuth 2.0)
// Flow de "authorization code":
//   1. /api/oauth/google         -> redirige a Google a pedir permiso
//   2. /api/oauth/google/callback-> Google devuelve un código,
//                                   lo canjeamos por un access_token
//                                   y pedimos el email a Google
// Solo aquí se habla con Google; la lógica de la app no se entera.
// ============================================================

const crypto = require('node:crypto');

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO = 'https://openidconnect.googleapis.com/v1/userinfo';

function configurado() {
    return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function urlBase() {
    return process.env.URL_PUBLICA || 'http://localhost:3000';
}

function redirectUri() {
    return `${urlBase()}/api/oauth/google/callback`;
}

// 1. URL a la que redirigimos al usuario para que acepte con Google
function crearUrlAutorizacion() {
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri(),
        response_type: 'code',
        scope: 'openid email profile',
        // state aleatorio: protege contra CSRF (que nos devuelvan un código ajeno)
        state: crypto.randomBytes(16).toString('hex'),
        prompt: 'select_account'
    });
    return `${GOOGLE_AUTH}?${params.toString()}`;
}

// 2. Canjear el código del callback por el email del usuario
async function intercambiarCodigo(code) {
    const canje = await fetch(GOOGLE_TOKEN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri(),
            grant_type: 'authorization_code'
        })
    });

    if (!canje.ok) {
        throw new Error(`Google rechazó el canje de código (HTTP ${canje.status})`);
    }
    const { access_token } = await canje.json();

    // Pedimos el perfil a Google (el email viene VERIFICADO, por eso sirve como confirmación)
    const perfil = await fetch(GOOGLE_USERINFO, {
        headers: { Authorization: `Bearer ${access_token}` }
    });
    if (!perfil.ok) {
        throw new Error(`Google no devolvió el perfil (HTTP ${perfil.status})`);
    }
    const datos = await perfil.json();
    if (!datos.email) {
        throw new Error('Google no devolvió ningún correo electrónico');
    }
    return { email: datos.email, nombre: datos.name || '' };
}

module.exports = { configurado, crearUrlAutorizacion, intercambiarCodigo };
