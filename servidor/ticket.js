// ============================================================
// LECTOR DE TICKETS (foto del ticket -> lista de productos)
// Integración con la API de Gemini. La clave GEMINI_API_KEY
// vive SOLO en el .env local o en las variables de Cloud Run:
// nunca se envía al navegador ni aparece en el repositorio.
//
// Modelos: cadena de respaldo del nivel gratuito. Si el primero
// está saturado (503), no existe (404) o se cuelga (30s), se
// prueba el siguiente automáticamente. GEMINI_MODELO lo cambia.
// ============================================================

const MODELOS = (() => {
    const principal = process.env.GEMINI_MODELO || 'gemini-3.6-flash';
    const cadena = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];
    return [principal, ...cadena.filter((m) => m !== principal)];
})();
const API = 'https://generativelanguage.googleapis.com/v1beta/models/';
const TIMEOUT_MS = 30000;

// Prompt corto y estricto: queremos SOLO el JSON de productos.
const PROMPT = [
    'Eres un lector de tickets de supermercado en español.',
    'Devuelve SOLO un JSON con esta forma exacta, sin nada antes ni después:',
    '{"productos":[{"nombre":"Leche semidesnatada","precio":1.35}]}',
    'Reglas:',
    '- Solo artículos comprados. Nada de TOTAL, SUBTOTAL, IVA, EFECTIVO, CAMBIO, fidelidad ni promociones.',
    '- "precio" en euros: número con punto decimal y como mucho 2 decimales. Si no se ve el precio, usa null.',
    '- "nombre" corto y limpio, tal y como sale impreso en el ticket.',
    '- Si el mismo artículo aparece varias veces, devuélvelo en una sola línea con la suma.',
    '- No inventes artículos que no estén en la imagen. Si no se lee nada, devuelve {"productos":[]}.'
].join('\n');

// Intenta la cadena de modelos hasta que uno responda bien.
// Devuelve { ok: true, datos, modelo } o { ok: false, status, cuerpo }.
async function llamarGemini(clave, base64, mime) {
    let ultimo = { status: 0, cuerpo: '' };
    for (const modelo of MODELOS) {
        let respuesta;
        try {
            respuesta = await fetch(`${API}${modelo}:generateContent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': clave },
                body: JSON.stringify({
                    contents: [{
                        role: 'user',
                        parts: [
                            { text: PROMPT },
                            { inline_data: { mime_type: mime || 'image/jpeg', data: base64 } }
                        ]
                    }],
                    generationConfig: { temperature: 0, responseMimeType: 'application/json' }
                }),
                signal: AbortSignal.timeout(TIMEOUT_MS)
            });
        } catch (err) {
            const tiempo = err && (err.name === 'TimeoutError' || err.name === 'AbortError');
            console.log(`[LOG - TICKET] ${modelo}: ${tiempo ? 'cuelgado (' + TIMEOUT_MS / 1000 + 's)' : 'sin conexión'} (${err && err.message})`);
            // Timeout de ESTE modelo: seguimos con el siguiente.
            // Red caída de verdad: no tiene sentido probar el resto.
            if (!tiempo) return { ok: false, status: 0, cuerpo: 'red' };
            ultimo = { status: 0, cuerpo: 'tiempo' };
            continue;
        }

        if (respuesta.ok) {
            const datos = await respuesta.json().catch(() => null);
            console.log(`[LOG - TICKET] leído con ${modelo}`);
            return { ok: true, datos, modelo };
        }

        let cuerpo = '';
        try { cuerpo = (await respuesta.text()).slice(0, 400); } catch (e) { /* sin cuerpo */ }
        console.log(`[LOG - TICKET] ${modelo} respondió ${respuesta.status}: ${cuerpo.slice(0, 160)}`);
        ultimo = { status: respuesta.status, cuerpo };

        // 503 (saturado), 429 (límite) o 404 (ya no existe): probamos el siguiente.
        // Cualquier otro error (clave mala, 400 de la foto...) no lo repetimos.
        if (![404, 429, 503].includes(respuesta.status)) return ultimo;
    }
    return ultimo;
}

// Devuelve { productos: [{ nombre, precio }] } o { error, codigo }
async function leerImagen(base64, mime) {
    const clave = process.env.GEMINI_API_KEY;
    if (!clave) return { error: 'Falta la clave de lectura: añade GEMINI_API_KEY al .env del servidor.', codigo: 'sin_clave' };
    if (!base64 || typeof base64 !== 'string') return { error: 'No ha llegado ninguna foto.', codigo: 'sin_foto' };
    if (base64.length > 12000000) return { error: 'La foto es demasiado grande.', codigo: 'grande' };

    const intento = await llamarGemini(clave, base64, mime);
    if (!intento.ok) {
        if (intento.cuerpo === 'tiempo') return { error: 'La lectura tardó demasiado: comprueba la conexión y reintenta.', codigo: 'tiempo' };
        if (intento.cuerpo === 'red') return { error: 'No se ha podido contactar con el lector de tickets.', codigo: 'sin_red' };
        if (intento.status === 429) return { error: 'Demasiadas fotos seguidas: espera unos segundos y prueba otra vez.', codigo: 'limite', status: 429 };
        if (intento.status === 400 && /api[ _]key/i.test(intento.cuerpo)) return { error: 'La clave GEMINI_API_KEY no es válida.', codigo: 'clave_mala' };
        if (intento.status === 403) return { error: 'La clave GEMINI_API_KEY no tiene permisos.', codigo: 'clave_mala' };
        if (intento.status === 404) return { error: 'Ningún modelo de lectura está disponible para esta clave.', codigo: 'modelo' };
        if (intento.status === 503) return { error: 'Los lectores están saturados ahora mismo: prueba dentro de un ratito.', codigo: 'saturado' };
        return { error: 'El lector de tickets ha fallado. Inténtalo más tarde.', codigo: 'ia', status: intento.status || undefined };
    }

    const datos = intento.datos;
    const texto = datos && Array.isArray(datos.candidates)
        ? datos.candidates
            .flatMap((c) => (c.content && Array.isArray(c.content.parts) ? c.content.parts : []))
            .map((p) => p.text || '')
            .join('')
        : '';
    if (!texto) {
        console.log('[LOG - TICKET] Respuesta sin texto: ' + JSON.stringify(datos || {}).slice(0, 400));
        return { error: 'No se ha podido leer la foto: prueba con más luz y sin sombras.', codigo: 'vacio' };
    }

    // Por si acaso el modelo envuelve el JSON en ```json pese al modo estricto
    const limpio = texto.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
    let leido;
    try {
        leido = JSON.parse(limpio);
    } catch (e) {
        console.log('[LOG - TICKET] JSON ilegible: ' + limpio.slice(0, 300));
        return { error: 'La lectura ha salido rara: reintenta con la foto más recta.', codigo: 'json' };
    }

    // Limpieza final: nombres cortos y precios en números reales
    const productos = (Array.isArray(leido.productos) ? leido.productos : [])
        .map((p) => {
            const nombre = String((p && p.nombre) || '').replace(/\s+/g, ' ').trim().slice(0, 90);
            const crudo = p ? p.precio : null;
            const n = Number(String(crudo).replace(',', '.'));
            const precio = crudo == null || crudo === '' || !Number.isFinite(n) || n < 0
                ? null
                : Math.round(n * 100) / 100;
            return { nombre, precio };
        })
        .filter((p) => p.nombre)
        .slice(0, 100);

    return { productos };
}

module.exports = { leerImagen };
