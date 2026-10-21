// ============================================================
// FONDO ZEN: estelas blancas cayendo suavemente
// Archivo compartido: se carga en index.html y dashboard.html
// No toca la lógica de la app; es solo decoración.
// ============================================================
(function () {
    // Respeto a usuarios con preferencia de movimiento reducido
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lienzo = document.createElement('canvas');
    lienzo.id = 'fondo-estelas';
    document.body.appendChild(lienzo);

    // El lienzo queda SIEMPRE por debajo del contenido
    lienzo.style.position = 'fixed';
    lienzo.style.top = '0';
    lienzo.style.left = '0';
    lienzo.style.width = '100%';
    lienzo.style.height = '100%';
    lienzo.style.pointerEvents = 'none';
    lienzo.style.zIndex = '0';

    // Aseguramos que las tarjetas se pintan por encima
    document.querySelectorAll('.card, .sidebar, .main-content').forEach(el => {
        el.style.position = el.style.position || 'relative';
        el.style.zIndex = '1';
    });

    const ctx = lienzo.getContext('2d');
    let ancho, alto, estelas = [];

    function redimensionar() {
        ancho = lienzo.width = window.innerWidth;
        alto = lienzo.height = window.innerHeight;
    }

    // Crear una estela: trazo blanco vertical, tenue y algo inclinado
    function nuevaEstela(inicioArriba) {
        const largo = 40 + Math.random() * 110;      // longitud del trazo
        return {
            x: Math.random() * ancho,                 // posición horizontal
            y: inicioArriba ? -largo - Math.random() * alto : Math.random() * alto,
            largo: largo,
            velocidad: 18 + Math.random() * 45,       // px por segundo (lento y calmado)
            deriva: (Math.random() - 0.5) * 6,        // vaquita lateral
            opacidad: 0.12 + Math.random() * 0.35,    // tenue
            grosor: 1 + Math.random() * 1.2
        };
    }

    function iniciar() {
        redimensionar();
        // Número de estelas proporcional al tamaño de pantalla
        const total = Math.round((ancho * alto) / 26000);
        estelas = Array.from({ length: Math.max(25, Math.min(total, 90)) }, () => nuevaEstela(false));
    }

    let ultimo = performance.now();
    function pintar(ahora) {
        // Delta de tiempo para que la velocidad sea constante
        const dt = Math.min((ahora - ultimo) / 1000, 0.1);
        ultimo = ahora;

        ctx.clearRect(0, 0, ancho, alto);
        ctx.lineCap = 'round';

        for (const e of estelas) {
            e.y += e.velocidad * dt;
            e.x += e.deriva * dt;

            // Si sale por abajo, vuelve a nacer arriba
            if (e.y - e.largo > alto) {
                Object.assign(e, nuevaEstela(true));
            }

            // Trazo degradado: de transparente (arriba) a blanco (abajo)
            const grad = ctx.createLinearGradient(e.x, e.y - e.largo, e.x + e.deriva, e.y);
            grad.addColorStop(0, 'rgba(255,255,255,0)');
            grad.addColorStop(1, `rgba(255,255,255,${e.opacidad})`);

            ctx.strokeStyle = grad;
            ctx.lineWidth = e.grosor;
            ctx.beginPath();
            ctx.moveTo(e.x, e.y - e.largo);
            ctx.lineTo(e.x + e.deriva, e.y);
            ctx.stroke();
        }

        requestAnimationFrame(pintar);
    }

    window.addEventListener('resize', iniciar);
    iniciar();
    requestAnimationFrame(pintar);
})();
