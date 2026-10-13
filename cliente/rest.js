// ============================================================
// Capa de comunicación del cliente con la API (servidor/rest.js)
// Solo se encarga de cambiar de pestaña y de enviar peticiones.
// ============================================================

// --- Cambiar entre pestañas de Iniciar sesión / Crear cuenta ---
function mostrarLogin() {
    document.getElementById('formLogin').classList.remove('oculto');
    document.getElementById('formRegistro').classList.add('oculto');
    document.getElementById('tab-login').classList.add('activo');
    document.getElementById('tab-registro').classList.remove('activo');
    document.getElementById('mensaje').textContent = '';
    document.getElementById('mensajeRegistro').textContent = '';
}

function mostrarRegistro() {
    document.getElementById('formLogin').classList.add('oculto');
    document.getElementById('formRegistro').classList.remove('oculto');
    document.getElementById('tab-login').classList.remove('activo');
    document.getElementById('tab-registro').classList.add('activo');
    document.getElementById('mensaje').textContent = '';
    document.getElementById('mensajeRegistro').textContent = '';
}

// --- Iniciar sesión ---
async function enviarDatos(ruta) {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const mensajeDiv = document.getElementById('mensaje');

    // Vaciamos el mensaje antes de hacer la petición
    mensajeDiv.textContent = '';
    mensajeDiv.style.color = '';

    try {
        const res = await fetch(ruta, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const resultado = await res.json();

        if (res.ok) {
            // Si el login es correcto, vamos al Dashboard
            window.location.href = '/dashboard.html';
        } else {
            // Si hay error, lo mostramos
            mensajeDiv.textContent = resultado.error;
            mensajeDiv.style.color = 'red';
        }
    } catch (error) {
        mensajeDiv.textContent = 'Error de conexión con el servidor.';
        mensajeDiv.style.color = 'red';
    }
}

// --- Crear cuenta ---
async function crearCuenta() {
    const email = document.getElementById('reg-email').value;
    const nombre = document.getElementById('reg-nombre').value;
    const password = document.getElementById('reg-password').value;
    const password2 = document.getElementById('reg-password2').value;
    const mensajeDiv = document.getElementById('mensajeRegistro');

    mensajeDiv.textContent = '';
    mensajeDiv.style.color = '';

    // Validaciones en el cliente (el servidor también valida)
    if (password.length < 8) {
        mensajeDiv.textContent = 'La contraseña debe tener mínimo 8 caracteres.';
        mensajeDiv.style.color = 'red';
        return;
    }
    if (password !== password2) {
        mensajeDiv.textContent = 'Las contraseñas no coinciden.';
        mensajeDiv.style.color = 'red';
        return;
    }

    try {
        const res = await fetch('/api/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, nombre })
        });

        const resultado = await res.json();

        if (res.ok) {
            // Cuenta creada: iniciamos sesión automáticamente y vamos al Dashboard
            window.location.href = '/dashboard.html';
        } else {
            mensajeDiv.textContent = resultado.error;
            mensajeDiv.style.color = 'red';
        }
    } catch (error) {
        mensajeDiv.textContent = 'Error de conexión con el servidor.';
        mensajeDiv.style.color = 'red';
    }
}
