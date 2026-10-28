// ============================================================
// DASNA — shell de la aplicación (fase 1)
// Presentación: pinta el menú, las vistas, el mini-calendario y
// el buscador. TODA la comunicación con el servidor vive en
// rest.js (frontera ARQ-03).
// ============================================================

// --- Estructura de navegación (aprobada en el diseño) ---
// `modulo: 'clave'` -> módulo real del catálogo del servidor.
// `proximo: 'Fase N'` -> idea planeada, todavía sin construir.
const GRUPOS = [
    {
        nombre: 'Principal', items: [
            { id: 'panel', icono: '📊', nombre: 'Panel' },
            { id: 'calendario', icono: '🗓️', nombre: 'Calendario', proximo: 'Fase 2' }
        ]
    },
    {
        nombre: 'Vida diaria', items: [
            { modulo: 'estudio' },
            { id: 'comidas', icono: '🍽️', nombre: 'Comidas', proximo: 'Fase 3' },
            { id: 'viajes', icono: '✈️', nombre: 'Viajes', proximo: 'Fase 3' },
            { id: 'eventos', icono: '🎉', nombre: 'Eventos', proximo: 'Fase 2' },
            { id: 'agua', icono: '💧', nombre: 'Beber agua', proximo: 'Fase 3' },
            { modulo: 'sueno' }
        ]
    },
    {
        nombre: 'Estilo', items: [
            { modulo: 'gimnasio' },
            { modulo: 'diario' },
            { id: 'outfits', icono: '👗', nombre: 'Outfits', proximo: 'Fase 4' },
            { modulo: 'visionboard' }
        ]
    },
    { nombre: 'Finanzas', items: [{ modulo: 'ahorros' }] },
    {
        nombre: 'Utilidades', items: [
            { id: 'registros', icono: '🗂️', nombre: 'Registros' },
            { id: 'archivos', icono: '📁', nombre: 'Archivos', proximo: 'Fase 2' },
            { id: 'ayuda', icono: '💬', nombre: 'Ayuda' }
        ]
    }
];

let sesion = null;   // { email, rol } de /api/auth/me
let modulos = [];    // módulos activos del usuario (del servidor)

// Pequeño navegador de fechas del mini-calendario
let calBase = new Date();

// ============================================================
// Utilidades de presentación
// ============================================================

function aviso(texto, tipo = 'ok') {
    const cont = document.getElementById('toasts');
    const div = document.createElement('div');
    div.className = 'toast' + (tipo === 'error' ? ' error' : '');
    div.textContent = texto;
    cont.appendChild(div);
    setTimeout(() => div.remove(), 3400);
}

function cabecera(titulo, subtitulo) {
    document.getElementById('vista-titulo').textContent = titulo;
    document.getElementById('vista-sub').textContent = subtitulo || '';
}

function cristal(html) {
    const c = document.createElement('div');
    c.innerHTML = html;
    return c;
}

function fechaCorta(valor) {
    const f = new Date(valor);
    if (Number.isNaN(f.getTime())) return '—';
    return f.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ============================================================
// Barra lateral
// ============================================================

function metaDe(item) {
    if (item.modulo) {
        const m = modulos.find((m) => m.clave === item.modulo);
        return m ? { id: 'm/' + m.clave, icono: m.icono, nombre: m.nombre } : null;
    }
    return item;
}

function pintarMenu() {
    const nav = document.getElementById('menu');
    nav.innerHTML = '';
    const claves = new Set(modulos.map((m) => m.clave));

    const grupos = GRUPOS.map((g) => ({ ...g }));
    if (sesion && sesion.rol === 'admin') {
        grupos.push({
            nombre: 'Administración', items: [{ id: 'usuarios', icono: '🛡️', nombre: 'Usuarios' }]
        });
    }

    for (const grupo of grupos) {
        const div = document.createElement('div');
        div.className = 'grupo';

        const titulo = document.createElement('button');
        titulo.className = 'grupo-titulo';
        titulo.innerHTML = `<span>${grupo.nombre}</span><span class="flecha">▾</span>`;
        titulo.addEventListener('click', () => div.classList.toggle('cerrado'));
        div.appendChild(titulo);

        const lista = document.createElement('div');
        lista.className = 'grupo-lista';

        for (const item of grupo.items) {
            const meta = metaDe(item);
            if (!meta) continue;                        // módulo fuera del catálogo: no se pinta
            if (item.modulo && !claves.has(item.modulo)) continue; // desactivado por la persona

            const a = document.createElement('a');
            const esProximo = !!meta.proximo;
            a.className = 'item-menu' + (esProximo ? ' proximo' : '');
            a.dataset.vista = meta.id;
            a.href = esProximo ? 'javascript:void(0)' : '#/' + meta.id;
            a.innerHTML = `<span class="icono">${meta.icono}</span><span>${meta.nombre}</span>` +
                (esProximo ? `<span class="marca">${meta.proximo}</span>` : '');

            if (esProximo) {
                a.addEventListener('click', () => aviso(`"${meta.nombre}" llega en la ${meta.proximo} 🚧`, 'error'));
            } else {
                a.addEventListener('click', () => document.getElementById('lateral').classList.remove('abierta'));
            }
            lista.appendChild(a);
        }

        div.appendChild(lista);
        nav.appendChild(div);
    }
}

function marcarActivo() {
    const limpio = location.hash.replace(/^#\/?/, '') || 'panel';
    document.querySelectorAll('.item-menu').forEach((el) => {
        el.classList.toggle('activo', el.dataset.vista === limpio);
    });
}

// ============================================================
// Mini-calendario (solo fechas; los eventos llegan en la fase 2)
// ============================================================

function pintarMiniCal() {
    const cont = document.getElementById('mini-cal');
    const anio = calBase.getFullYear();
    const mes = calBase.getMonth();
    const hoy = new Date();

    const nombres = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const mesNombre = calBase.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    let html = `<div class="mini-cal-cab">
        <button class="mini-cal-nav" data-paso="-1" aria-label="Mes anterior">◀</button>
        <span class="mini-cal-mes">${mesNombre}</span>
        <button class="mini-cal-nav" data-paso="1" aria-label="Mes siguiente">▶</button>
    </div><div class="mini-cal-rejilla">`;

    for (const n of nombres) html += `<span class="nom">${n}</span>`;

    const primerDia = new Date(anio, mes, 1);
    const offset = (primerDia.getDay() + 6) % 7;          // lunes = 0
    const diasMes = new Date(anio, mes + 1, 0).getDate();
    const diasPrev = new Date(anio, mes, 0).getDate();

    for (let i = 0; i < offset; i++) {
        html += `<span class="mini-dia fuera">${diasPrev - offset + i + 1}</span>`;
    }
    for (let d = 1; d <= diasMes; d++) {
        const esHoy = d === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear();
        html += `<button class="mini-dia${esHoy ? ' hoy' : ''}" data-dia="${d}">${d}</button>`;
    }
    html += '</div>';
    cont.innerHTML = html;

    cont.querySelectorAll('.mini-cal-nav').forEach((b) =>
        b.addEventListener('click', () => {
            calBase = new Date(anio, mes + Number(b.dataset.paso), 1);
            pintarMiniCal();
        }));
    cont.querySelectorAll('.mini-dia[data-dia]').forEach((b) =>
        b.addEventListener('click', () => {
            // Con la fase 2, este clic abrirá la vista del calendario en ese día
            aviso(`Fase 2: aquí se abrirá el calendario del ${b.dataset.dia} 🗓️`, 'error');
        }));
}

// ============================================================
// Vistas
// ============================================================

function vistaPanel() {
    cabecera('Panel', `Hola de nuevo, ${sesion.email.split('@')[0]} ✨`);
    const cont = document.getElementById('vista');
    cont.innerHTML = '';

    const rejilla = document.createElement('div');
    rejilla.className = 'rejilla';

    const tarjetas = [
        ['🗓️', 'Calendario global', 'Tus exámenes, tareas, eventos y viajes en una sola vista. Llega en la Fase 2.', 'calendario'],
        ['🗂️', 'Registros del motor', `Tienes ${modulos.length} módulos activos. Explora y añade registros de prueba.`, 'registros'],
        ['💬', 'Ayuda', 'Atajos de teclado, fases del proyecto y cómo funciona Dasna.', 'ayuda']
    ];

    for (const [icono, titulo, texto, destino] of tarjetas) {
        const t = document.createElement('div');
        t.className = 'tarjeta';
        t.innerHTML = `<h3>${icono} ${titulo}</h3><p>${texto}</p>
            <p style="margin-top:0.8rem"><a class="enlace" href="#/${destino}">Abrir →</a></p>`;
        rejilla.appendChild(t);
    }

    cont.appendChild(rejilla);
}

async function vistaModulo(clave) {
    const meta = modulos.find((m) => m.clave === clave);
    if (!meta) return vistaPanel();

    cabecera(`${meta.icono} ${meta.nombre}`, meta.descripcion);
    const cont = document.getElementById('vista');
    cont.innerHTML = '<div class="skeleton"></div>';

    const r = await rest.listarRegistros(clave);
    cont.innerHTML = '';
    if (!r.exito) return aviso(r.error || 'No se pudo leer el módulo.', 'error');

    // Tarjeta: crear un registro (motor genérico: JSON + fecha opcional)
    const crear = cristal(`
        <div class="tarjeta" style="margin-bottom:1.2rem">
            <h3>➕ Nuevo registro</h3>
            <p>Escribe los datos en JSON. La fecha es opcional (por defecto, hoy).</p>
            <label class="etiqueta" style="margin-top:0.9rem">Datos (JSON)</label>
            <textarea class="entrada" id="nuevo-json" placeholder='{"nota": "mi primer registro"}'></textarea>
            <label class="etiqueta" style="margin-top:0.7rem">Fecha (opcional)</label>
            <input type="date" class="entrada" id="nuevo-fecha" style="max-width:220px">
            <div style="margin-top:0.9rem"><button class="boton-primario" id="btn-guardar">Guardar registro</button></div>
        </div>`);
    cont.appendChild(crear);

    cont.querySelector('#btn-guardar').addEventListener('click', async () => {
        let datos;
        try { datos = JSON.parse(cont.querySelector('#nuevo-json').value); }
        catch (e) { return aviso('El JSON no es válido.', 'error'); }
        const fecha = cont.querySelector('#nuevo-fecha').value || undefined;
        const res = await rest.crearRegistro(clave, datos, fecha);
        if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
        aviso('Registro guardado ✅');
        vistaModulo(clave);
    });

    // Lista de registros existentes
    const lista = document.createElement('div');
    lista.className = 'rejilla';

    if (!r.datos.length) {
        lista.innerHTML = `<div class="cristal vacio" style="grid-column:1/-1">Todavía no hay registros aquí. ¡Sé la primera en añadir uno! ✨</div>`;
    }

    for (const reg of r.datos) {
        const t = document.createElement('div');
        t.className = 'tarjeta tarjeta-mini';
        const pie = document.createElement('div');
        pie.innerHTML = `<span class="chip">📅 ${fechaCorta(reg.fecha)}</span>`;
        const borrar = document.createElement('button');
        borrar.className = 'boton-peligro';
        borrar.style.marginLeft = '0.6rem';
        borrar.textContent = 'Borrar';
        borrar.addEventListener('click', async () => {
            const res = await rest.borrarRegistro(clave, reg.id);
            if (!res.exito) return aviso(res.error || 'No se pudo borrar.', 'error');
            aviso('Registro borrado');
            vistaModulo(clave);
        });
        pie.appendChild(borrar);
        const pre = document.createElement('pre');
        pre.className = 'registro-datos';
        pre.textContent = JSON.stringify(reg.datos, null, 2);
        t.appendChild(pie);
        t.appendChild(pre);
        lista.appendChild(t);
    }
    cont.appendChild(lista);
}

function vistaRegistros() {
    cabecera('🗂️ Registros', 'Explora los datos del motor de módulos.');
    const cont = document.getElementById('vista');
    cont.innerHTML = '';

    const selector = cristal(`
        <div class="tarjeta" style="margin-bottom:1.2rem">
            <label class="etiqueta" for="sel-modulo">Módulo</label>
            <select class="entrada" id="sel-modulo" style="max-width:320px">
                ${modulos.map((m) => `<option value="${m.clave}">${m.icono} ${m.nombre}</option>`).join('')}
            </select>
        </div>`);
    cont.appendChild(selector);
    selector.querySelector('#sel-modulo').addEventListener('change', (e) => {
        location.hash = '#/m/' + e.target.value;
    });
    vistaModulo(selector.querySelector('#sel-modulo').value);
}

async function vistaUsuarios() {
    cabecera('🛡️ Usuarios', 'Solo administradores.');
    const cont = document.getElementById('vista');

    if (!sesion || sesion.rol !== 'admin') {
        cont.innerHTML = `<div class="cristal vacio">Esta sección es solo para administradores 🔒</div>`;
        return;
    }

    cont.innerHTML = '<div class="skeleton"></div>';
    const usuarios = await rest.listarUsuarios();
    cont.innerHTML = '';

    if (!Array.isArray(usuarios)) return aviso((usuarios && usuarios.error) || 'No se pudo leer la lista.', 'error');

    const caja = cristal('<div class="cristal" style="padding:0.6rem"></div>');
    const tabla = document.createElement('table');
    tabla.className = 'tabla';
    tabla.innerHTML = '<thead><tr><th>Email</th><th>Rol</th><th>Estado</th><th></th></tr></thead>';
    const cuerpo = document.createElement('tbody');

    for (const u of usuarios) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${u.email}</td><td><span class="chip">${u.rol}</span></td>
            <td><span class="chip" id="estado-${u.email.replace(/[^a-z0-9]/gi, '')}">—</span></td>`;

        const td = document.createElement('td');
        td.style.textAlign = 'right';

        const btnEstado = document.createElement('button');
        btnEstado.className = 'boton-suave';
        btnEstado.style.marginRight = '0.5rem';
        btnEstado.textContent = 'Comprobar';
        btnEstado.addEventListener('click', async () => {
            const res = await rest.estadoUsuario(u.email);
            const chip = tr.querySelector('td:nth-child(3) .chip');
            if (!res || res.activo === undefined) return aviso((res && res.error) || 'Sin respuesta.', 'error');
            chip.textContent = res.activo ? 'Activo ✓' : 'Inactivo';
            chip.className = 'chip ' + (res.activo ? 'chip-ok' : 'chip-peligro');
        });

        const btnBorrar = document.createElement('button');
        btnBorrar.className = 'boton-peligro';
        btnBorrar.textContent = 'Eliminar';
        btnBorrar.addEventListener('click', async () => {
            if (!confirm(`¿Eliminar la cuenta ${u.email}?`)) return;
            const res = await rest.eliminarUsuario(u.email);
            if (!res.exito) return aviso(res.error || 'No se pudo eliminar.', 'error');
            aviso('Usuario eliminado');
            vistaUsuarios();
        });

        td.appendChild(btnEstado);
        td.appendChild(btnBorrar);
        tr.appendChild(td);
        cuerpo.appendChild(tr);
    }

    tabla.appendChild(cuerpo);
    caja.querySelector('.cristal').appendChild(tabla);
    cont.appendChild(caja);
}

function vistaCalendario() {
    cabecera('🗓️ Calendario', 'La pieza central de Dasna.');
    document.getElementById('vista').innerHTML = `
        <div class="cristal">
            <h3 style="margin-top:0">Fase 2 🚧</h3>
            <p style="color:var(--texto-suave);line-height:1.6">Aquí vivirá tu <strong>calendario global</strong>: los exámenes y tareas de
            Estudios, las quedadas de Eventos y la salida de tus Viajes, todo en una sola vista con filtros.
            De momento puedes navegar los meses con el mini-calendario de la izquierda.</p>
        </div>`;
}

function vistaAyuda() {
    cabecera('💬 Ayuda', 'Cómo funciona Dasna.');
    document.getElementById('vista').innerHTML = `
        <div class="rejilla">
            <div class="tarjeta"><h3>⌨️ Atajos</h3><p><strong>Ctrl / ⌘ + K</strong>: buscador universal.<br>
            <strong>C</strong>: calendario (cuando esté disponible).<br>El tema claro/oscuro lo cambias con 🌙 abajo.</p></div>
            <div class="tarjeta"><h3>🧱 Módulos</h3><p>Cada módulo guarda <em>registros</em> (JSON con fecha) en tu cuenta.
            Los marcados como «Fase N» son las ideas planeadas que faltan por construir.</p></div>
            <div class="tarjeta"><h3>🗺️ Fases</h3><p>Fase 1: diseño y navegación (ahora). Fase 2: calendario, estudios y eventos.
            Fase 3: comidas, viajes y agua. Fase 4: outfits, gimnasio, ahorros y diario. Fase 5: panel de métricas.</p></div>
        </div>`;
}

function vistaProximo() {
    const id = location.hash.replace(/^#\/?/, '');
    cabecera('🚧 En construcción', 'Esta idea ya está planeada.');
    document.getElementById('vista').innerHTML = `
        <div class="cristal">
            <p style="color:var(--texto-suave);line-height:1.6">Este módulo está en el plan de fases de Dasna.
            Pronto vivirá aquí. Puedes ver el plan completo en la vista <a class="enlace" href="#/ayuda">Ayuda</a>.</p>
        </div>`;
}

// ============================================================
// Enrutado por hash
// ============================================================

const VISTAS = {
    panel: vistaPanel,
    calendario: vistaCalendario,
    registros: vistaRegistros,
    usuarios: vistaUsuarios,
    ayuda: vistaAyuda
};

function enrutar() {
    const limpio = location.hash.replace(/^#\/?/, '') || 'panel';
    if (limpio.startsWith('m/')) {
        vistaModulo(limpio.slice(2));
    } else if (VISTAS[limpio]) {
        VISTAS[limpio]();
    } else {
        vistaProximo();
    }
    marcarActivo();
}

// ============================================================
// Buscador universal (Ctrl/⌘ + K)
// ============================================================

let buscadorOpciones = [];
let buscadorIndice = 0;

function opcionesDeBusqueda() {
    const fijas = [
        { id: 'panel', icono: '📊', nombre: 'Panel', grupo: 'Principal' },
        { id: 'calendario', icono: '🗓️', nombre: 'Calendario', grupo: 'Principal', proximo: 'Fase 2' },
        { id: 'registros', icono: '🗂️', nombre: 'Registros', grupo: 'Utilidades' },
        { id: 'ayuda', icono: '💬', nombre: 'Ayuda', grupo: 'Utilidades' }
    ];
    if (sesion && sesion.rol === 'admin') {
        fijas.push({ id: 'usuarios', icono: '🛡️', nombre: 'Usuarios', grupo: 'Administración' });
    }
    const deModulos = modulos.map((m) => ({ id: 'm/' + m.clave, icono: m.icono, nombre: m.nombre, grupo: 'Módulos' }));
    const planeados = GRUPOS.flatMap((g) => g.items)
        .filter((i) => i.proximo && i.id)
        .map((i) => ({ id: i.id, icono: i.icono, nombre: i.nombre, grupo: 'Planificado', proximo: i.proximo }));
    return [...fijas, ...deModulos, ...planeados];
}

function pintarBuscador(filtro = '') {
    const lista = document.getElementById('buscador-lista');
    const texto = filtro.trim().toLowerCase();
    buscadorOpciones = opcionesDeBusqueda()
        .filter((o) => !texto || o.nombre.toLowerCase().includes(texto));
    buscadorIndice = 0;

    lista.innerHTML = buscadorOpciones.map((o, i) => `
        <li class="buscador-opcion${i === 0 ? ' activo' : ''}${o.proximo ? ' proximo' : ''}" data-i="${i}">
            <span class="icono">${o.icono}</span><span>${o.nombre}</span>
            <span class="grupo-de">${o.proximo || o.grupo}</span>
        </li>`).join('') || '<li class="buscador-opcion">Sin resultados</li>';

    lista.querySelectorAll('.buscador-opcion[data-i]').forEach((li) =>
        li.addEventListener('click', () => elegirBuscador(Number(li.dataset.i))));
}

function moverBuscador(paso) {
    const items = document.querySelectorAll('.buscador-opcion[data-i]');
    if (!items.length) return;
    items[buscadorIndice]?.classList.remove('activo');
    buscadorIndice = (buscadorIndice + paso + items.length) % items.length;
    items[buscadorIndice].classList.add('activo');
    items[buscadorIndice].scrollIntoView({ block: 'nearest' });
}

function elegirBuscador(i) {
    const op = buscadorOpciones[i];
    if (!op) return;
    cerrarBuscador();
    if (op.proximo) return aviso(`"${op.nombre}" llega en la ${op.proximo} 🚧`, 'error');
    location.hash = '#/' + op.id;
}

function abrirBuscador() {
    document.getElementById('buscador-overlay').classList.remove('oculto');
    const input = document.getElementById('buscador-input');
    input.value = '';
    pintarBuscador();
    input.focus();
}

function cerrarBuscador() {
    document.getElementById('buscador-overlay').classList.add('oculto');
}

// ============================================================
// Arranque
// ============================================================

async function iniciar() {
    // Sesión (si no la hay, de vuelta al login)
    sesion = await rest.obtenerSesion();
    if (!sesion) { window.location.href = '/index.html'; return; }
    document.getElementById('sesion-email').textContent =
        sesion.email + (sesion.rol === 'admin' ? ' · admin' : '');

    // Módulos del usuario desde el motor
    const r = await rest.obtenerModulos();
    modulos = (r && r.exito && r.modulos) || [];

    pintarMenu();
    pintarMiniCal();
    window.addEventListener('hashchange', enrutar);
    enrutar();

    // --- Tema claro/oscuro ---
    const btnTema = document.getElementById('btn-tema');
    const meta = document.getElementById('meta-tema');
    function aplicarTema(tema) {
        document.documentElement.dataset.tema = tema;
        btnTema.textContent = tema === 'oscuro' ? '☀️' : '🌙';
        meta.setAttribute('content', tema === 'oscuro' ? '#0b1a33' : '#14b8a6');
        try { localStorage.setItem('dasna-tema', tema); } catch (e) { /* opcional */ }
    }
    aplicarTema(document.documentElement.dataset.tema || 'claro');
    btnTema.addEventListener('click', () =>
        aplicarTema(document.documentElement.dataset.tema === 'oscuro' ? 'claro' : 'oscuro'));

    // --- Cerrar sesión y menú móvil ---
    document.getElementById('btn-salir').addEventListener('click', () => rest.cerrarSesionApp());
    document.getElementById('btn-menu').addEventListener('click', () =>
        document.getElementById('lateral').classList.toggle('abierta'));

    // --- Buscador ---
    document.getElementById('btn-buscador').addEventListener('click', abrirBuscador);
    document.getElementById('buscador-input').addEventListener('input', (e) => pintarBuscador(e.target.value));
    document.getElementById('buscador-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'buscador-overlay') cerrarBuscador();
    });

    document.addEventListener('keydown', (e) => {
        const escribiendo = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
        const abierto = !document.getElementById('buscador-overlay').classList.contains('oculto');

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            abierto ? cerrarBuscador() : abrirBuscador();
            return;
        }
        if (!escribiendo && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'c' && !abierto) {
            location.hash = '#/calendario';
            return;
        }
        if (!abierto) return;
        if (e.key === 'Escape') cerrarBuscador();
        else if (e.key === 'ArrowDown') { e.preventDefault(); moverBuscador(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); moverBuscador(-1); }
        else if (e.key === 'Enter') { e.preventDefault(); elegirBuscador(buscadorIndice); }
    });

    // PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
}

window.addEventListener('DOMContentLoaded', iniciar);
