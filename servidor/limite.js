// ============================================================
// Límite de intentos (mejora del backlog, riesgo de D-15)
// Cuenta los FALLOS por clave (la IP) en una ventana de tiempo.
// Al pasar de `max`, bloquea esa clave hasta que caduque la ventana.
// Sin dependencias y en memoria: basta para una sola instancia de Cloud Run.
// ============================================================

function crearLimitador({ max = 10, ventanaMs = 15 * 60 * 1000 } = {}) {
    const fallos = new Map(); // clave -> { n, desde }

    function vigente(clave, ahora) {
        const f = fallos.get(clave);
        if (f && ahora - f.desde >= ventanaMs) { fallos.delete(clave); return null; }
        return f || null;
    }

    return {
        // ¿Puede intentarlo? Si no, cuántos minutos le quedan
        comprobar(clave, ahora = Date.now()) {
            const f = vigente(clave, ahora);
            if (!f || f.n < max) return { permitido: true };
            return { permitido: false, minutos: Math.ceil((f.desde + ventanaMs - ahora) / 60000) };
        },
        fallo(clave, ahora = Date.now()) {
            const f = vigente(clave, ahora);
            if (f) f.n++;
            else fallos.set(clave, { n: 1, desde: ahora });
            // Limpieza sencilla para que el mapa no crezca sin fin
            if (fallos.size > 5000) for (const [k] of fallos) { if (!vigente(k, ahora)) fallos.delete(k); }
        },
        exito(clave) { fallos.delete(clave); }
    };
}

module.exports = { crearLimitador };
