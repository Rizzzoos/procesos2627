// cliente/rest.js
const API_URL = '/api/usuarios';

document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const mensajeDiv = document.getElementById('mensaje');

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            mensajeDiv.style.color = 'green';
            mensajeDiv.textContent = `¡Éxito! Usuario procesado correctamente.`;
        } else {
            mensajeDiv.style.color = 'red';
            mensajeDiv.textContent = data.error || 'Ocurrió un error.';
        }
    } catch (err) {
        mensajeDiv.style.color = 'red';
        mensajeDiv.textContent = 'Error de conexión con el servidor.';
    }
});