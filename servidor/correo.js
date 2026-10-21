// ============================================================
// HITO 4 - ENVÍO DE CORREOS (servicio externo)
// Solo sabe "cómo" se manda el correo; las decisiones de negocio
// (qué token, cuándo confirmar) viven en logica.js.
//
// Soporta dos proveedores y elige según la variable de entorno:
//   - BREVO_API_KEY   -> Brevo (Sendinblue). Envía a cualquier destinatario
//                        sin necesidad de tener un dominio propio.
//   - RESEND_API_KEY  -> Resend. Solo permite enviar al correo de la cuenta
//                        salvo que verifiques un dominio.
//
// Usa fetch nativo de Node 20: no necesita dependencias.
// ============================================================

// URL pública de la app (para construir el enlace de confirmación).
// En Cloud Run la inyectamos con la variable URL_PUBLICA;
// en local deducimos http://localhost:3000.
function urlBase() {
    return process.env.URL_PUBLICA || 'http://localhost:3000';
}

function remitente() {
    // EMAIL_FROM es el correo verificado como remitente en el proveedor
    return process.env.EMAIL_FROM || 'garasandra8@gmail.com';
}

function nombreRemitente() {
    return process.env.EMAIL_FROM_NAME || 'Dasna';
}

function cuerpoCorreo(enlace) {
    return `
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
        </div>`;
}

// --- Brevo (Sendinblue): POST https://api.brevo.com/v3/smtp/email ---
async function enviarConBrevo(emailDestino, enlace) {
    const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': process.env.BREVO_API_KEY,
            'accept': 'application/json',
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: { name: nombreRemitente(), email: remitente() },
            to: [{ email: emailDestino }],
            subject: 'Confirma tu cuenta de Dasna',
            htmlContent: cuerpoCorreo(enlace)
        })
    });

    if (!respuesta.ok) {
        const detalle = await respuesta.text().catch(() => '');
        throw new Error(`Brevo respondió ${respuesta.status}: ${detalle.slice(0, 300)}`);
    }
}

// --- Resend: POST https://api.resend.com/emails ---
async function enviarConResend(emailDestino, enlace) {
    const respuesta = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: `${nombreRemitente()} <${remitente()}>`,
            to: [emailDestino],
            subject: 'Confirma tu cuenta de Dasna',
            html: cuerpoCorreo(enlace)
        })
    });

    if (!respuesta.ok) {
        const detalle = await respuesta.text().catch(() => '');
        throw new Error(`Resend respondió ${respuesta.status}: ${detalle.slice(0, 300)}`);
    }
}

// Función principal: envía el correo de confirmación con el proveedor configurado.
async function enviarConfirmacion(emailDestino, token) {
    const enlace = `${urlBase()}/api/confirmar?token=${token}`;

    if (process.env.BREVO_API_KEY) {
        await enviarConBrevo(emailDestino, enlace);
        console.log(`[LOG - CORREO] Correo de confirmación enviado (Brevo) a ${emailDestino}`);
        return { enviado: true, proveedor: 'brevo' };
    }

    if (process.env.RESEND_API_KEY) {
        await enviarConResend(emailDestino, enlace);
        console.log(`[LOG - CORREO] Correo de confirmación enviado (Resend) a ${emailDestino}`);
        return { enviado: true, proveedor: 'resend' };
    }

    // Sin configurar: no lanzamos error para no romper pruebas ni CI,
    // pero avisamos con claridad en el registro del servidor.
    console.log(`[LOG - CORREO] AVISO: falta BREVO_API_KEY (o RESEND_API_KEY). Enlace para ${emailDestino}: ${enlace}`);
    return { enviado: false, motivo: 'sin_api_key' };
}

module.exports = { enviarConfirmacion };
