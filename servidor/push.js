// ============================================================
// Adaptador de Web Push (PBI-24)
// Único módulo que conoce la librería web-push y las claves VAPID.
// Si faltan las claves, el push queda apagado y la app sigue igual
// (los avisos salen solo con la app abierta, como antes).
// ============================================================
const webpush = require('web-push');

let listo = false;
function configurar() {
    if (listo) return true;
    const { VAPID_PUBLICA, VAPID_PRIVADA } = process.env;
    if (!VAPID_PUBLICA || !VAPID_PRIVADA) return false;
    // El "subject" identifica al remitente ante el servicio de push: la URL de la app
    const sujeto = process.env.VAPID_SUJETO || 'https://procesos2627-817509698728.europe-west1.run.app';
    webpush.setVapidDetails(sujeto, VAPID_PUBLICA, VAPID_PRIVADA);
    listo = true;
    return true;
}

function clavePublica() {
    return configurar() ? process.env.VAPID_PUBLICA : null;
}

// Devuelve 'ok', 'caducada' (ese navegador ya no existe: hay que borrarla) o 'error'
async function enviar(sub, { titulo, texto }) {
    if (!configurar()) return 'error';
    try {
        await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.claves },
            JSON.stringify({ titulo, texto }),
            { TTL: 3600 }
        );
        return 'ok';
    } catch (err) {
        return err && (err.statusCode === 404 || err.statusCode === 410) ? 'caducada' : 'error';
    }
}

module.exports = { clavePublica, enviar };
