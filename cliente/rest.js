// Cliente de comunicación HTTP con la API del servidor
const API_URL = '/api/usuarios';

async function registrarUsuario(email) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    return res.json();
}
