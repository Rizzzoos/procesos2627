// ============================================================
// PWA - SERVICE WORKER (cliente/sw.js)
// Su trabajo: poder usar Dasna sin conexión parcial y cargar
// rápido. ESTRATEGIA:
//   - Navegaciones (abrir la app): primero red, y si no hay
//     internet, se sirve la copia en caché.
//   - Ficheros estáticos (css/js/iconos): caché primero y se
//     revalidan en segundo plano.
//   - Peticiones a /api: NUNCA se guardan en caché, siempre
//     frescas y con la sesión real (seguridad).
// Al cambiar este fichero (por cualquier motivo), el navegador
// lo detecta y monta la caché nueva en la siguiente recarga.
// ============================================================

const CACHE = 'dasna-v2';

const SHELL = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/app.html',
    '/rest.js',
    '/app.js',
    '/estelas.js',
    '/estilos/dasna.css',
    '/manifest.json',
    '/icon-96.png',
    '/icon-192.png',
    '/icon-512.png'
];

// 1. Instalación: guardamos la "carcasa" de la app
self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
    );
});

// 2. Activación: borramos cachés de versiones antiguas
self.addEventListener('activate', (evento) => {
    evento.waitUntil(
        caches.keys().then((nombres) =>
            Promise.all(
                nombres.filter((nombre) => nombre !== CACHE).map((nombre) => caches.delete(nombre))
            )
        ).then(() => self.clients.claim())
    );
});

// 3. Peticiones
self.addEventListener('fetch', (evento) => {
    const req = evento.request;
    const url = new URL(req.url);

    // ¿Es la API? Fuera de la caché: los datos y la sesión siempre reales.
    if (url.pathname.startsWith('/api/')) return;
    if (req.method !== 'GET') return;
    if (url.origin !== self.location.origin) return; // no tocamos recursos externos

    // Navegación (abrir la app): primero red, si falla -> caché
    if (req.mode === 'navigate') {
        evento.respondWith(
            fetch(req)
                .then((respuesta) => {
                    if (respuesta.ok) {
                        const copia = respuesta.clone();
                        caches.open(CACHE).then((cache) => cache.put(req, copia));
                    }
                    return respuesta;
                })
                .catch(() => caches.match(req).then((r) => r || caches.match('/index.html')))
        );
        return;
    }

    // Estáticos: caché primero y actualización en segundo plano
    evento.respondWith(
        caches.match(req).then((cacheteado) => {
            const revalidar = fetch(req)
                .then((respuesta) => {
                    if (respuesta && respuesta.ok) {
                        const copia = respuesta.clone();
                        caches.open(CACHE).then((cache) => cache.put(req, copia));
                    }
                    return respuesta;
                })
                .catch(() => cacheteado);

            return cacheteado || revalidar;
        })
    );
});
