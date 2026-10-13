async function enviarDatos(ruta) {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const mensajeDiv = document.getElementById('mensaje');

    // ¡Solución al mensaje rojo! Lo vaciamos antes de hacer la petición
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
            // Si el login o registro es correcto, vamos al Dashboard
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