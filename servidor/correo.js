// ============================================================
// HITO 4 - ENVÍO DE CORREOS (servicio externo: Resend)
// Solo sabe "cómo" se manda el correo; las decisiones de negocio
// (qué token, cuándo confirmar) viven en logica.js.
// Usa fetch nativo de Node 20: no necesita dependencias.
// ============================================================

// URL pública de la app (para construir el enlace de confirmación).
// En Cloud Run la inyectamos con la variable URL_PUBLICA;
// en local deducimos http://localhost:3000.
function urlBase() {
    return process.env.URL_PUBLICA || 'http://localhost:3000';
}

async function enviarConfirmacion(emailDestino, token) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        // Sin configurar: no lanzamos error para no romper pruebas ni CI,
        // pero avisamos con claridad en el registro del servidor.
        console.log(`[LOG - CORREO] AVISO: falta RESEND_API_KEY. Enlace para ${emailDestino}: ${urlBase()}/api/confirmar?token=${token}`);
        return { enviado: false, motivo: 'sin_api_key' };
    }

    const enlace = `${urlBase()}/api/confirmar?token=${token}`;

    const respuesta = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'Dasna <onboarding@resend.dev>',
            to: [emailDestino],
            subject: 'Confirma tu cuenta de Dasna',
            html: `
                <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
                    <h2>¡Bienvenida a Dasna!</h2>
                    <p>Solo falta un paso para activar tu cuenta: confirma tu correo
                    pulsando el botón de abajo.</p>
                    <p style="text-align: center; margin: 28px 0;">
                        <a href="${enlace}"
                           style="background: #8b5cf6; color: #fff; padding: 12px 24px;
                                  border-radius: 8px; text-decoration: none; font-weight: bold;">
                            Confirmar mi cuenta
                        </a>
                    </p>
                    <p>El enlace caduca en 24 horas. Si no has sido tú, ignora este correo.</p>
                    <p style="color:#888; font-size:12px;">${enlace}</p>
                </div>`
        })
    });

    if (!respuesta.ok) {
        const detalle = await respuesta.text().catch(() => '');
        throw new Error(`Resend respondió ${respuesta.status}: ${detalle.slice(0, 200)}`);
    }

    console.log(`[LOG - CORREO] Correo de confirmación enviado a ${emailDestino}`);
    return { enviado: true };
}

module.exports = { enviarConfirmacion };
