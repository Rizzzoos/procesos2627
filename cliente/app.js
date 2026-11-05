// ============================================================
// DASNA — shell de la aplicación
// Sin barra lateral: cabecera arriba (buscar, tema, sesión) y
// un PANEL de recuadros pequeños, uno por apartado.
// Toda la comunicación con el servidor vive en rest.js (ARQ-03).
// ============================================================

// --- Estructura de navegación (aprobada en el diseño) ---
// `modulo: 'clave'` -> módulo real del catálogo del servidor.
// `proximo: 'Fase N'` -> idea planeada, todavía sin construir.
const GRUPOS = [
    {
        nombre: 'Principal', items: [
            { id: 'panel', icono: '📊', nombre: 'Panel' }
        ]
    },
    {
        nombre: 'Vida diaria', items: [
            { modulo: 'estudio' },
            { modulo: 'comidas' },
            { modulo: 'viajes' },
            { modulo: 'eventos' },
            { modulo: 'agua' },
            { modulo: 'sueno' }
        ]
    },
    {
        nombre: 'Estilo', items: [
            { modulo: 'gimnasio' },
            { modulo: 'diario' },
            { modulo: 'outfits' },
            { modulo: 'visionboard' }
        ]
    },
    { nombre: 'Finanzas', items: [{ modulo: 'ahorros' }] },
    {
        nombre: 'Utilidades', items: [
            { id: 'registros', icono: '🎬', nombre: 'Películas Libros' },
            { id: 'archivo', icono: '📁', nombre: 'Archivo', soloAdmin: true },
            { id: 'ayuda', icono: '💬', nombre: 'Ayuda', soloAdmin: true }
        ]
    }
];


// --- Iconos de línea (a trazo, un solo estilo) para cada apartado ---
const TRAZOS_ICONO = {
    panel: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    estudio: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    comidas: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
    viajes: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    eventos: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="m12 13 1.1 2.2 2.4.3-1.7 1.7.4 2.4-2.2-1.2-2.2 1.2.4-2.4-1.7-1.7 2.4-.3z"/>',
    agua: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
    sueno: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    gimnasio: '<path d="M6 5v14"/><path d="M18 5v14"/><path d="M3 8v8"/><path d="M21 8v8"/><path d="M6 12h12"/>',
    diario: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M9 7h7"/>',
    outfits: '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
    visionboard: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    ahorros: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    pelislibros: '<rect x="2" y="2" width="20" height="20" rx="2.2"/><path d="M7 2v20"/><path d="M17 2v20"/><path d="M2 12h20"/><path d="M2 7h5"/><path d="M2 17h5"/><path d="M17 17h5"/><path d="M17 7h5"/>',
    archivo: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
    ayuda: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    usuarios: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
};
TRAZOS_ICONO.registros = TRAZOS_ICONO.pelislibros;

// Icono de línea de un apartado (id 'm/clave', 'clave' o 'archivo'…); si no hay, el de siempre
function iconoDe(id, deRespaldo = '') {
    const trazo = TRAZOS_ICONO[String(id || '').replace('m/', '')];
    if (!trazo) return deRespaldo;
    return `<span class="icono-linea"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${trazo}</svg></span>`;
}

let sesion = null;   // { email, rol } de /api/auth/me
let modulos = [];    // módulos activos del usuario (del servidor)

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
// Panel: recuadros pequeños, uno por apartado
// ============================================================

function metaDe(item) {
    if (item.modulo) {
        const m = modulos.find((m) => m.clave === item.modulo);
        return m ? { id: 'm/' + m.clave, icono: m.icono, nombre: m.nombre } : null;
    }
    return item;
}

// Estado del calendario del panel
let calBase = new Date();      // mes que se muestra
let calSel = null;             // día seleccionado (YYYY-MM-DD)
let registrosCal = null;       // registros de todos los módulos (cargados una vez)

async function cargarRegistrosCal() {
    if (registrosCal) return registrosCal;
    // El diario y las comidas no salen en el calendario del panel
    // (son cosas privadas del día a día, no eventos con fecha)
    const visibles = modulos.filter((m) => !['diario', 'comidas', 'pelislibros', 'sueno', 'agua', 'outfits'].includes(m.clave));
    const listas = await Promise.all(
        visibles.map((m) => rest.listarRegistros(m.clave).catch(() => ({ exito: false })))
    );
    registrosCal = [];
    listas.forEach((r, i) => {
        if (r && r.exito && Array.isArray(r.datos)) {
            r.datos.filter((reg) => !(reg.datos && reg.datos.tipo === 'rutina')).forEach((reg) => registrosCal.push({
                ...reg,
                clave: visibles[i].clave,
                icono: visibles[i].icono,
                nombre: visibles[i].nombre
            }));
        }
    });
    return registrosCal;
}

function claveDia(fecha) {
    const f = new Date(fecha);
    if (Number.isNaN(f.getTime())) return '';
    return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
}

function resumenDe(datos) {
    if (datos == null) return '—';
    const texto = (typeof datos === 'object'
        ? (datos.titulo || datos.resumen || datos.concepto || datos.nombre || datos.nota || datos.texto || datos.tarea)
        : datos) || JSON.stringify(datos);
    return String(texto).slice(0, 70);
}

// --- Fecha en lenguaje natural: "comida familiar mañana", "quedada amigos 26 octubre" ---
const MESES_LARGOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MESES_TXT = {
    ene: 1, enero: 1, feb: 2, febrero: 2, mar: 3, marzo: 3, abr: 4, abril: 4,
    may: 5, mayo: 5, jun: 6, junio: 6, jul: 7, julio: 7, ago: 8, agosto: 8,
    sep: 9, sept: 9, septiembre: 9, setiembre: 9,
    oct: 10, octubre: 10, nov: 11, noviembre: 11, dic: 12, diciembre: 12
};
const NUMEROS_TXT = {
    uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
    diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
    dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
    veinte: 20, veintiuno: 21, veintidos: 22, veintitres: 23, veinticuatro: 24,
    veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
    treinta: 30, treintayuno: 31
};
const RE_MESES = Object.keys(MESES_TXT).sort((a, b) => b.length - a.length).join('|');
const RE_NUMS = Object.keys(NUMEROS_TXT).sort((a, b) => b.length - a.length).join('|');

// Devuelve { fecha, resto }: la fecha interpretada y el texto sin la parte de fecha
function interpretarFecha(texto) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const sumar = (dias) => { const f = new Date(hoy); f.setDate(f.getDate() + dias); return f; };
    const validar = (anio, mes, dia) => {
        const f = new Date(anio, mes - 1, dia);
        return f.getMonth() === mes - 1 && f.getDate() === dia ? f : null;
    };
    // Un "1 enero" escrito en diciembre se entiende del año que viene (si es muy vieja)
    const subirAnioSiVieja = (f) => {
        if (!f) return null;
        const umbral = new Date(hoy);
        umbral.setDate(umbral.getDate() - 180);
        if (f < umbral) f.setFullYear(f.getFullYear() + 1);
        return f;
    };

    let fecha = null;
    let frag = '';
    const intentar = (re, calculo) => {
        if (fecha) return;
        const m = re.exec(texto);
        if (!m) return;
        const f = calculo(m);
        if (f) { fecha = f; frag = m[0]; }
    };

    intentar(/\bpasado\s+ma[ñn]ana\b/i, () => sumar(2));
    intentar(/\bma[ñn]ana\b/i, () => sumar(1));
    intentar(/\bayer\b/i, () => sumar(-1));
    intentar(/\bhoy\b/i, () => new Date(hoy));
    intentar(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/, (m) => validar(Number(m[1]), Number(m[2]), Number(m[3])));
    intentar(/\b(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?\b/, (m) => {
        const anio = m[3] ? (Number(m[3]) < 100 ? 2000 + Number(m[3]) : Number(m[3])) : hoy.getFullYear();
        const f = validar(anio, Number(m[2]), Number(m[1]));
        return m[3] ? f : subirAnioSiVieja(f);
    });
    intentar(new RegExp(`\\b(?:el\\s+)?(\\d{1,2})\\s+(?:de\\s+|del\\s+)?(${RE_MESES})\\b`, 'i'),
        (m) => subirAnioSiVieja(validar(hoy.getFullYear(), MESES_TXT[m[2].toLowerCase()], Number(m[1]))));
    intentar(new RegExp(`\\b(?:el\\s+)?(${RE_NUMS})\\s+(?:de\\s+|del\\s+)?(${RE_MESES})\\b`, 'i'),
        (m) => subirAnioSiVieja(validar(hoy.getFullYear(), MESES_TXT[m[2].toLowerCase()], NUMEROS_TXT[m[1].toLowerCase()])));
    intentar(/\b(?:el\s+)?(\d{1,2})\s+de\s+este\s+mes\b/i,
        (m) => validar(hoy.getFullYear(), hoy.getMonth() + 1, Number(m[1])));
    intentar(new RegExp(`\\b(?:el\\s+)?(${RE_NUMS})\\s+de\\s+este\\s+mes\\b`, 'i'),
        (m) => validar(hoy.getFullYear(), hoy.getMonth() + 1, NUMEROS_TXT[m[1].toLowerCase()]));
    intentar(/\bpr[oó]ximo\s+mes\b/i, () => {
        const mes = hoy.getMonth() + 1;
        const dia = Math.min(hoy.getDate(), new Date(hoy.getFullYear(), mes + 1, 0).getDate());
        return new Date(hoy.getFullYear(), mes, dia);
    });
    intentar(/\b(?:el\s+|este\s+|pr[oó]ximo\s+)?(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/i, (m) => {
        const mapa = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 0 };
        const objetivo = mapa[m[1].toLowerCase().replace(/[éá]/g, (c) => (c === 'é' ? 'e' : 'a'))];
        return sumar((objetivo - hoy.getDay() + 7) % 7);
    });
    intentar(/\b(?:el\s+)?(?:este\s+)?(?:finde|fin\s+de\s+semana)\b/i, () => {
        const d = hoy.getDay();
        if (d === 0 || d === 6) return new Date(hoy);
        return sumar((6 - d + 7) % 7);
    });

    // Quitar la parte de fecha del texto y limpiar conectores sueltos
    let resto = texto;
    if (frag) {
        resto = texto.replace(new RegExp(frag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), ' ');
    }
    resto = resto.replace(/\s+/g, ' ')
        .replace(/^[\s,;:—-]+/, '')
        .replace(/[\s,;:—-]+$/, '')
        .replace(/^(?:de|del|el|la|los|en|para|a)\s+/i, '')
        .replace(/\s+(?:de|del|el|la|los|en|para|a)$/i, '')
        .trim();

    return { fecha: fecha || new Date(hoy), resto };
}

function fechaBonita(f) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (claveDia(f) === claveDia(hoy)) return 'hoy';
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    if (claveDia(f) === claveDia(manana)) return 'mañana';
    return new Date(f).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: f.getFullYear() !== hoy.getFullYear() ? 'numeric' : undefined
    });
}

// --- Menús desplegables del calendario (meses y años) ---
function cerrarMenusCal() {
    document.querySelectorAll('.cal-menu').forEach((m) => m.classList.add('oculto'));
}

function alternarMenu(id) {
    const yo = document.getElementById(id);
    if (!yo) return;
    const seAbre = yo.classList.contains('oculto');
    document.querySelectorAll('.cal-menu').forEach((m) => m.classList.add('oculto'));
    if (!seAbre) return;
    yo.classList.remove('oculto');
    if (id === 'cal-menu-mes') pintarMenuMeses();
    if (id === 'cal-menu-anio') pintarMenuAnios();
}

function pintarMenuMeses() {
    const menu = document.getElementById('cal-menu-mes');
    menu.innerHTML = MESES_LARGOS.map((nombre, i) =>
        `<button data-mes="${i}"${i === calBase.getMonth() ? ' class="activo"' : ''}>${nombre}</button>`).join('');
    menu.querySelectorAll('button').forEach((b) =>
        b.addEventListener('click', () => {
            calBase = new Date(calBase.getFullYear(), Number(b.dataset.mes), 1);
            calSel = null;
            cerrarMenusCal();
            pintarCalendario();
        }));
}

function pintarMenuAnios() {
    const menu = document.getElementById('cal-menu-anio');
    const actual = calBase.getFullYear();
    let html = '';
    for (let y = actual - 5; y <= actual + 5; y++) {
        html += `<button data-anio="${y}"${y === actual ? ' class="activo"' : ''}>${y}</button>`;
    }
    menu.innerHTML = html;
    menu.querySelectorAll('button').forEach((b) =>
        b.addEventListener('click', () => {
            calBase = new Date(Number(b.dataset.anio), calBase.getMonth(), 1);
            calSel = null;
            cerrarMenusCal();
            pintarCalendario();
        }));
}

function pintarCalendario() {
    const rejilla = document.getElementById('cal-rejilla');
    if (!rejilla) return;
    const anio = calBase.getFullYear();
    const mes = calBase.getMonth();
    const hoy = new Date();

    const nombres = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    document.getElementById('cal-mes').textContent = MESES_LARGOS[mes];
    document.getElementById('cal-anio').textContent = String(anio);

    // Días con registros, agrupados por día
    const porDia = new Map();
    for (const reg of registrosCal || []) {
        const k = claveDia(reg.fecha);
        if (!k) continue;
        if (!porDia.has(k)) porDia.set(k, []);
        porDia.get(k).push(reg);
    }

    let html = nombres.map((n) => `<span class="cal-nom">${n}</span>`).join('');
    const primerDia = new Date(anio, mes, 1);
    const offset = (primerDia.getDay() + 6) % 7;          // lunes = 0
    const diasMes = new Date(anio, mes + 1, 0).getDate();
    const diasPrev = new Date(anio, mes, 0).getDate();

    for (let i = 0; i < offset; i++) {
        html += `<span class="cal-dia fuera">${diasPrev - offset + i + 1}</span>`;
    }
    for (let d = 1; d <= diasMes; d++) {
        const fecha = new Date(anio, mes, d);
        const k = claveDia(fecha);
        const delDia = porDia.get(k) || [];
        const esHoy = d === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear();
        const marca = delDia.length === 1 ? '<span class="puntos"><i></i></span>'
            : delDia.length > 1 ? `<span class="cuenta">${delDia.length}</span>` : '';
        html += `<button class="cal-dia${esHoy ? ' hoy' : ''}${delDia.length ? ' con-registro' : ''}${k === calSel ? ' sel' : ''}" data-fecha="${k}">
            <span>${d}</span>${marca}</button>`;
    }
    rejilla.innerHTML = html;
    rejilla.querySelectorAll('.cal-dia[data-fecha]').forEach((b) =>
        b.addEventListener('click', () => { calSel = b.dataset.fecha; pintarCalendario(); }));

    pintarDetalle();
}

function pintarDetalle() {
    const det = document.getElementById('cal-detalle');
    if (!det) return;
    if (!calSel) {
        det.innerHTML = '<p class="cal-vacio">Toca un día para ver lo que tienes apuntado ahí ✨</p>';
        return;
    }
    const delDia = (registrosCal || []).filter((r) => claveDia(r.fecha) === calSel);
    if (!delDia.length) {
        const bonito = new Date(calSel + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
        det.innerHTML = `<p class="cal-vacio">Nada apuntado el ${bonito}.</p>`;
        return;
    }
    det.innerHTML = delDia.map((r) => `
        <a class="cal-item" href="#/m/${r.clave}">
            <span>${iconoDe(r.clave, r.icono)}</span>
            <span class="de-modulo">${r.nombre}</span>
            <span class="dato">${resumenDe(r.datos)}</span>
        </a>`).join('');
}

function vistaPanel() {
    cabecera('Panel', `Hola de nuevo, ${sesion.email.split('@')[0]} ✨`);
    const cont = document.getElementById('vista');
    cont.innerHTML = '';
    registrosCal = null;   // al volver al panel, se leen los registros frescos

    const dos = document.createElement('div');
    dos.className = 'panel-dos';

    // --- Calendario del mes (columna izquierda) ---
    const cal = document.createElement('div');
    cal.className = 'cristal calendario-panel';
    cal.innerHTML = `
        <div class="cal-cab">
            <button class="cal-pick" id="cal-mes" title="Elegir mes"></button>
            <button class="cal-pick" id="cal-anio" title="Elegir año"></button>
        </div>
        <div class="cal-menu oculto" id="cal-menu-mes"></div>
        <div class="cal-menu oculto" id="cal-menu-anio"></div>
        <div class="cal-rejilla" id="cal-rejilla"></div>
        <div class="cal-detalle" id="cal-detalle"></div>`;
    dos.appendChild(cal);
    cal.querySelector('#cal-mes').addEventListener('click', () => alternarMenu('cal-menu-mes'));
    cal.querySelector('#cal-anio').addEventListener('click', () => alternarMenu('cal-menu-anio'));

    // --- Recuadros de los apartados (columna derecha) ---
    const rejilla = document.createElement('div');
    rejilla.className = 'rejilla-panel';
    const claves = new Set(modulos.map((m) => m.clave));

    const items = [];
    for (const grupo of GRUPOS) {
        for (const item of grupo.items) {
            if (item.id === 'panel') continue;           // ya estás en el panel
            if (item.soloAdmin && !esAdmin()) continue;   // Ayuda y Archivo: solo admin
            const meta = metaDe(item);
            if (!meta) continue;                          // módulo fuera del catálogo
            if (item.modulo && !claves.has(item.modulo)) continue; // desactivado
            items.push(meta);
        }
    }
    if (sesion && sesion.rol === 'admin') {
        items.push({ id: 'usuarios', icono: '🛡️', nombre: 'Usuarios' });
    }

    for (const meta of items) {
        const a = document.createElement('a');
        const esProximo = !!meta.proximo;
        a.className = 'caja' + (esProximo ? ' proxima' : '');
        a.href = esProximo ? 'javascript:void(0)' : '#/' + meta.id;
        a.title = meta.nombre + (esProximo ? ` — llega en la ${meta.proximo}` : '');
        a.innerHTML = `<span class="caja-icono">${iconoDe(meta.id, meta.icono)}</span>
            <span class="caja-nombre">${meta.nombre}</span>` +
            (esProximo ? `<span class="caja-nota">${meta.proximo}</span>` : '');

        if (esProximo) {
            a.addEventListener('click', () => aviso(`"${meta.nombre}" llega en la ${meta.proximo} 🚧`, 'error'));
        }
        rejilla.appendChild(a);
    }
    dos.appendChild(rejilla);

    cont.appendChild(dos);
    pintarCalendario();

    // Los puntos de los registros llegan después (una petición por módulo)
    cargarRegistrosCal().then(() => {
        if (document.getElementById('cal-rejilla')) pintarCalendario();
    });
}

// ============================================================
// Vistas
// ============================================================

async function vistaModulo(clave) {
    const meta = modulos.find((m) => m.clave === clave);
    if (!meta) return vistaPanel();

    // Cabeceras de módulo sin emoji (regla de Sandra: títulos limpios);
    // Comidas además sin descripción
    const esComidas = clave === 'comidas';
    cabecera(meta.nombre, esComidas ? '' : meta.descripcion);
    const cont = document.getElementById('vista');
    cont.innerHTML = '<div class="skeleton"></div>';

    // Módulos con ficha propia (sin el formulario genérico)
    if (clave === 'diario') return fichaDiario(cont);
    if (clave === 'ahorros') return fichaAhorros(cont);
    if (clave === 'comidas') return fichaComidas(cont);
    if (clave === 'pelislibros') return fichaPelisLibros(cont);
    if (clave === 'estudio') return fichaEstudio(cont);
    if (clave === 'gimnasio') return fichaGimnasio(cont);
    if (clave === 'sueno') return fichaSueno(cont);
    if (clave === 'visionboard') return fichaVisionboard(cont);
    if (clave === 'viajes') return fichaViajes(cont);
    if (clave === 'agua') return fichaAgua(cont);
    if (clave === 'outfits') return fichaOutfits(cont);
    if (clave === 'eventos') return fichaEventos(cont);

    const r = await rest.listarRegistros(clave);
    cont.innerHTML = '';
    if (!r.exito) return aviso(r.error || 'No se pudo leer el módulo.', 'error');

    // Tarjeta: crear un registro escribiendo con palabras (la fecha la interpreta el cliente)
    const crear = cristal(`
        <div class="tarjeta" style="margin-bottom:1.2rem">
            <h3>➕ Nuevo registro</h3>
            <p>Escríbelo con tus palabras y yo pillo la fecha: «comida familiar mañana», «quedada amigos 26 octubre»…</p>
            <label class="etiqueta" style="margin-top:0.9rem">¿Qué añades?</label>
            <input class="entrada" id="nuevo-texto" placeholder="Ej: comida familiar el veinte de este mes" autocomplete="off">
            <div class="preview-fecha" id="nuevo-preview">📅 Escribe algo con una fecha: «mañana», «26 octubre»…</div>
            <div style="margin-top:0.9rem"><button class="boton-primario" id="btn-guardar">Guardar registro</button></div>
        </div>`);
    cont.appendChild(crear);

    const inpTexto = cont.querySelector('#nuevo-texto');
    inpTexto.addEventListener('input', () => {
        const frase = inpTexto.value.trim();
        const prev = document.getElementById('nuevo-preview');
        if (!frase) { prev.textContent = '📅 Escribe algo con una fecha: «mañana», «26 octubre»…'; return; }
        const it = interpretarFecha(frase);
        prev.textContent = `📅 ${fechaBonita(it.fecha)}${it.resto ? ' · «' + it.resto + '»' : ''}`;
    });

    cont.querySelector('#btn-guardar').addEventListener('click', async () => {
        const frase = inpTexto.value.trim();
        if (!frase) return aviso('Escribe primero qué quieres añadir.', 'error');
        const it = interpretarFecha(frase);
        const titulo = (it.resto || frase).slice(0, 160);
        const fecha = claveDia(it.fecha);
        const res = await rest.crearRegistro(clave, { titulo }, fecha);
        if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
        aviso(`Guardado: «${titulo}» · ${fechaBonita(it.fecha)} ✅`);
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

// Escapado de textos que vienen de la usuaría (nada de HTML en los huecos)
function esc(valor) {
    return String(valor == null ? '' : valor).replace(/[&<>"']/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

// --- Recap del diario: visor de todos los días escritos ---
function mostrarRecap(htmlDias, total) {
    let capa = document.getElementById('recap-overlay');
    if (!capa) {
        capa = document.createElement('div');
        capa.id = 'recap-overlay';
        capa.className = 'recap-overlay oculto';
        capa.innerHTML = `
            <div class="recap-caja tarjeta">
                <div class="recap-cabecera">
                    <h3>Recap del diario</h3>
                    <button class="boton-suave" id="recap-cerrar">✕ Cerrar</button>
                </div>
                <p class="recap-total" id="recap-total"></p>
                <div class="recap-lista" id="recap-lista"></div>
            </div>`;
        document.body.appendChild(capa);
        capa.querySelector('#recap-cerrar').addEventListener('click', () => capa.classList.add('oculto'));
        capa.addEventListener('click', (e) => { if (e.target === capa) capa.classList.add('oculto'); });
    }
    capa.querySelector('#recap-total').textContent =
        `Llevas ${total} ${total === 1 ? 'día' : 'días'} escribiendo el diario`;
    capa.querySelector('#recap-lista').innerHTML = htmlDias;
    capa.classList.remove('oculto');
}

// --- Recordatorio de las 22:00 para escribir el diario ---
let temporizadorRecordatorio = null;

async function enviarNotificacion(titulo, cuerpo) {
    try {
        if (navigator.serviceWorker && navigator.serviceWorker.ready) {
            const sw = await navigator.serviceWorker.ready;
            await sw.showNotification(titulo, { body: cuerpo });
        } else {
            new Notification(titulo, { body: cuerpo });
        }
    } catch (e) {
        try { new Notification(titulo, { body: cuerpo }); } catch (_) { /* sin permiso */ }
    }
}

function programarRecordatorioDiario() {
    if (temporizadorRecordatorio) clearTimeout(temporizadorRecordatorio);
    temporizadorRecordatorio = null;
    let activo = false;
    try { activo = localStorage.getItem('dasna-recordatorio') === 'si'; } catch (e) { /* opcional */ }
    if (!activo || !('Notification' in window) || Notification.permission !== 'granted') return;

    const ahora = new Date();
    const objetivo = new Date(ahora);
    objetivo.setHours(22, 0, 0, 0);
    if (ahora >= objetivo) objetivo.setDate(objetivo.getDate() + 1);
    const ms = Math.min(objetivo - ahora, 2147483647);

    temporizadorRecordatorio = setTimeout(async () => {
        try {
            const r = await rest.listarRegistros('diario');
            const escritoHoy = r && r.exito && r.datos.some((x) =>
                claveDia(x.fecha) === claveDia(new Date()) &&
                ((x.datos && x.datos.resumen) || (x.datos && x.datos.humor)));
            if (!escritoHoy) {
                await enviarNotificacion('Dasna · Diario', '¿Ya has escrito tu día? Cinco minutitos y listo.');
            }
        } catch (e) { /* silencioso */ }
        programarRecordatorioDiario();
    }, ms);
}

// ============================================================
// Ficha del Diario: un día seleccionado, su resumen y sus preguntas
// (sin fechas escritas a mano: el día lo eliges con ‹ ›)
// ============================================================
async function fichaDiario(cont) {
    let diaSel = claveDia(new Date());
    let periodo = 'semana';          // resumen de la semana o del mes
    let fotoPendiente = null;        // base64 recién elegida; null = sin cambios
    cont.innerHTML = '';
    const envoltorio = document.createElement('div');
    envoltorio.className = 'ficha-propia';
    cont.appendChild(envoltorio);

    const desdeClave = (k) => {
        const [a, m, d] = k.split('-').map(Number);
        return new Date(a, m - 1, d);
    };
    const TIEMPOS = [
        ['☀️', 'soleado'], ['⛅', 'nublado'], ['🌧️', 'lluvia'], ['⛈️', 'tormenta'],
        ['❄️', 'frío'], ['🌫️', 'niebla'], ['💨', 'viento'], ['🌈', 'arcoíris']
    ];

    const render = async () => {
        envoltorio.innerHTML = '<div class="skeleton"></div>';
        const r = await rest.listarRegistros('diario');
        if (!r.exito) return aviso(r.error || 'No se pudo leer el diario.', 'error');

        const porDia = new Map();
        for (const reg of r.datos) porDia.set(claveDia(reg.fecha), reg);
        const reg = porDia.get(diaSel) || null;
        const d = (reg && reg.datos) || {};

        const fecha = desdeClave(diaSel);
        const esHoy = diaSel === claveDia(new Date());
        const titulo = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
            .replace(/^./, (c) => c.toUpperCase());
        const emociones = ['😞', '😕', '😐', '🙂', '😄'];

        // Días de la semana (lunes-domingo) o del mes que contiene el día elegido
        let clavesPeriodo = [];
        if (periodo === 'semana') {
            const lunes = new Date(fecha);
            lunes.setDate(fecha.getDate() - ((fecha.getDay() + 6) % 7));
            for (let i = 0; i < 7; i++) {
                const df = new Date(lunes);
                df.setDate(lunes.getDate() + i);
                clavesPeriodo.push(claveDia(df));
            }
        } else {
            const diasMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
            for (let i = 1; i <= diasMes; i++) clavesPeriodo.push(claveDia(new Date(fecha.getFullYear(), fecha.getMonth(), i)));
        }
        const caritas = clavesPeriodo
            .map((k) => porDia.get(k))
            .filter((rg) => rg && rg.datos && rg.datos.humor)
            .map((rg) => Number(rg.datos.humor));
        const media = caritas.length ? caritas.reduce((s, v) => s + v, 0) / caritas.length : 0;
        const palabras = [null, 'día flojito', 'día bajón', 'día normal', 'bien', 'genial'];
        const etiqueta = caritas.length ? palabras[Math.round(media)] : 'sin datos aún';
        const emojiPeriodo = caritas.length ? emociones[Math.round(media) - 1] : '';

        const totalEscritos = porDia.size;

        const fotoActual = fotoPendiente !== null ? fotoPendiente : (d.foto || '');
        const fotoHtml = fotoActual
            ? `<div class="foto-caja"><img src="${fotoActual}" alt="Foto del día"><button class="boton-peligro" id="foto-quitar">Quitar foto</button></div>`
            : '<label class="foto-slot">Añadir una foto del día<input type="file" id="dia-foto-input" accept="image/*" hidden></label>';

        let recordatorioActivo = false;
        try { recordatorioActivo = localStorage.getItem('dasna-recordatorio') === 'si'; } catch (e) { /* opcional */ }

        envoltorio.innerHTML = `
            <div class="tarjeta dia-cab">
                <button class="cal-pick pick-flecha" id="dia-menos" aria-label="Día anterior">‹</button>
                <div class="dia-titulo">
                    <h3 style="margin:0">${esc(titulo)}${esHoy ? ' · hoy' : ''}</h3>
                    <p class="pista" style="margin:0.25rem 0 0">${reg ? 'Día escrito' : 'Este día todavía no está escrito'}</p>
                </div>
                <div class="periodo">
                    <div class="periodo-toggle">
                        <button type="button" id="per-semana" class="${periodo === 'semana' ? 'activo' : ''}">Semana</button>
                        <button type="button" id="per-mes" class="${periodo === 'mes' ? 'activo' : ''}">Mes</button>
                    </div>
                    <div class="periodo-dato">
                        <span class="periodo-emoji">${emojiPeriodo}</span>
                        <span><strong>${etiqueta}</strong><br><small>${caritas.length}/${clavesPeriodo.length} días con carita</small></span>
                    </div>
                </div>
                <button class="cal-pick pick-flecha" id="dia-mas" aria-label="Día siguiente" ${esHoy ? 'disabled' : ''}>›</button>
                <button class="boton-suave" id="dia-recap" ${porDia.size ? '' : 'disabled'}>Recap</button>
            </div>
            <div class="tarjeta">
                <h3>Resume tu día</h3>
                <textarea class="entrada" id="dia-resumen" rows="4" placeholder="Lo mejor, lo peor, lo que quieras contar…">${esc(d.resumen)}</textarea>
                <div class="dia-foto">${fotoHtml}</div>
                <h3 style="margin-top:1.2rem">Unas preguntitas</h3>
                <label class="etiqueta">¿Cómo te ha ido el día?</label>
                <div class="humor" id="dia-humor">
                    ${emociones.map((e, i) => `<button type="button" data-valor="${i + 1}" title="${['muy mal', 'mal', 'normal', 'bien', 'genial'][i]}"${Number(d.humor) === i + 1 ? ' class="activo"' : ''}>${e}</button>`).join('')}
                </div>
                <label class="etiqueta" style="margin-top:0.9rem">¿Qué tiempo hacía?</label>
                <div class="humor" id="dia-tiempo">
                    ${TIEMPOS.map(([e, nombre]) => `<button type="button" data-valor="${e}" title="${nombre}"${d.tiempo === e ? ' class="activo"' : ''}>${e}</button>`).join('')}
                </div>
                <label class="etiqueta" style="margin-top:0.9rem">¿Qué ha sido lo mejor del día?</label>
                <input class="entrada" id="dia-mejor" placeholder="Ej: la quedada de tarde" value="${esc(d.mejor)}">
                <label class="etiqueta" style="margin-top:0.9rem">Algo por lo que agradecer</label>
                <input class="entrada" id="dia-gratitud" placeholder="Ej: mi familia, un café rico, el parque…" value="${esc(d.gratitud)}">
                <label class="etiqueta" style="margin-top:0.9rem">¿Qué has aprendido nuevo?</label>
                <input class="entrada" id="dia-aprender" placeholder="Ej: a montar una estantería" value="${esc(d.aprender)}">
                <label class="etiqueta" style="margin-top:0.9rem">Mejoras para mañana</label>
                <input class="entrada" id="dia-mejorar" placeholder="Ej: dormir antes" value="${esc(d.mejorar)}">
                <div class="fila-botones">
                    <button class="boton-primario" id="dia-guardar">Guardar el día</button>
                    ${reg ? '<button class="boton-peligro" id="dia-borrar">Borrar este día</button>' : ''}
                    <button class="boton-suave" id="dia-recordatorio">${recordatorioActivo ? 'Recordatorio de las 22:00 activo' : 'Activar recordatorio de las 22:00'}</button>
                </div>
            </div>
            <div class="tarjeta contador-dias">
                Llevas <strong>${totalEscritos}</strong> ${totalEscritos === 1 ? 'día' : 'días'} escribiendo el diario
            </div>`;

        const cambiarDia = (nuevaClave) => {
            diaSel = nuevaClave;
            fotoPendiente = null;
            render();
        };
        envoltorio.querySelector('#dia-menos').addEventListener('click', () => {
            const f = desdeClave(diaSel);
            f.setDate(f.getDate() - 1);
            cambiarDia(claveDia(f));
        });
        if (!esHoy) {
            envoltorio.querySelector('#dia-mas').addEventListener('click', () => {
                const f = desdeClave(diaSel);
                f.setDate(f.getDate() + 1);
                cambiarDia(claveDia(f));
            });
        }
        envoltorio.querySelectorAll('#dia-humor button, #dia-tiempo button').forEach((b) =>
            b.addEventListener('click', () => {
                envoltorio.querySelectorAll('#' + b.parentElement.id + ' button').forEach((x) => x.classList.remove('activo'));
                b.classList.add('activo');
            }));
        // (la lista de días ya no existe: abajo solo queda un contador)
        envoltorio.querySelectorAll('#per-semana, #per-mes').forEach((b) =>
            b.addEventListener('click', () => {
                periodo = b.id === 'per-mes' ? 'mes' : 'semana';
                render();
            }));

        // Foto del día (se reduce en el navegador antes de guardarla)
        const inputFoto = envoltorio.querySelector('#dia-foto-input');
        if (inputFoto) {
            inputFoto.addEventListener('change', () => {
                const archivo = inputFoto.files && inputFoto.files[0];
                if (!archivo) return;
                const lector = new FileReader();
                lector.onload = () => {
                    const img = new Image();
                    img.onload = () => {
                        const maxLado = 720;
                        const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
                        const lienzo = document.createElement('canvas');
                        lienzo.width = Math.round(img.width * escala);
                        lienzo.height = Math.round(img.height * escala);
                        lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height);
                        fotoPendiente = lienzo.toDataURL('image/jpeg', 0.7);
                        render();
                    };
                    img.onerror = () => aviso('No se pudo leer esa imagen.', 'error');
                    img.src = lector.result;
                };
                lector.readAsDataURL(archivo);
            });
        }
        const btnQuitarFoto = envoltorio.querySelector('#foto-quitar');
        if (btnQuitarFoto) {
            btnQuitarFoto.addEventListener('click', () => { fotoPendiente = ''; render(); });
        }

        // Recap: visor con todos los días escritos (con su foto y todo)
        const btnRecap = envoltorio.querySelector('#dia-recap');
        if (btnRecap) {
            btnRecap.addEventListener('click', () => {
                const claves = [...porDia.keys()].sort().reverse();
                const emocionesRecap = ['😞', '😕', '😐', '🙂', '😄'];
                const tarjetas = claves.map((k) => {
                    const rd = porDia.get(k).datos || {};
                    const carita = rd.humor ? emocionesRecap[Number(rd.humor) - 1] : '';
                    const foto = rd.foto ? `<img class="recap-foto" src="${rd.foto}" alt="Foto del día">` : '';
                    const filas = [
                        rd.resumen ? `<p class="recap-texto">${esc(rd.resumen)}</p>` : '',
                        rd.mejor ? `<p class="recap-dato"><strong>Lo mejor:</strong> ${esc(rd.mejor)}</p>` : '',
                        rd.gratitud ? `<p class="recap-dato"><strong>Agradecimiento:</strong> ${esc(rd.gratitud)}</p>` : '',
                        rd.aprender ? `<p class="recap-dato"><strong>Aprendido:</strong> ${esc(rd.aprender)}</p>` : '',
                        rd.mejorar ? `<p class="recap-dato"><strong>Mejoras:</strong> ${esc(rd.mejorar)}</p>` : ''
                    ].filter(Boolean).join('');
                    return `
                        <article class="recap-dia">
                            <div class="recap-dia-cab">
                                <strong>${fechaCorta(k)}</strong>
                                <span>${carita}${rd.tiempo ? ' ' + esc(String(rd.tiempo)) : ''}</span>
                            </div>
                            ${foto}
                            ${filas || '<p class="pista">Día guardado sin detalles.</p>'}
                        </article>`;
                }).join('');
                mostrarRecap(tarjetas, claves.length);
            });
        }

        // Recordatorio de las 22:00
        envoltorio.querySelector('#dia-recordatorio').addEventListener('click', async () => {
            if (!('Notification' in window)) return aviso('Este navegador no soporta notificaciones.', 'error');
            let permiso = Notification.permission;
            if (permiso === 'default') permiso = await Notification.requestPermission();
            if (permiso !== 'granted') return aviso('Sin permiso de notificaciones.', 'error');
            const activado = localStorage.getItem('dasna-recordatorio') === 'si';
            try { localStorage.setItem('dasna-recordatorio', activado ? 'no' : 'si'); } catch (e) { /* opcional */ }
            aviso(activado ? 'Recordatorio apagado' : 'Te avisaré a las 22:00 si falta tu día');
            programarRecordatorioDiario();
            render();
        });

        envoltorio.querySelector('#dia-guardar').addEventListener('click', async () => {
            const marcada = envoltorio.querySelector('#dia-humor button.activo');
            const conTiempo = envoltorio.querySelector('#dia-tiempo button.activo');
            const datos = {
                resumen: envoltorio.querySelector('#dia-resumen').value.trim(),
                humor: marcada ? Number(marcada.dataset.valor) : null,
                tiempo: conTiempo ? conTiempo.dataset.valor : null,
                mejor: envoltorio.querySelector('#dia-mejor').value.trim(),
                gratitud: envoltorio.querySelector('#dia-gratitud').value.trim(),
                aprender: envoltorio.querySelector('#dia-aprender').value.trim(),
                mejorar: envoltorio.querySelector('#dia-mejorar').value.trim(),
                foto: fotoPendiente !== null ? fotoPendiente : (d.foto || '')
            };
            const vacio = !datos.resumen && !datos.tiempo && !datos.mejor && !datos.gratitud
                && !datos.aprender && !datos.mejorar && !datos.humor && !datos.foto;
            if (vacio) return aviso('Escribe algo antes de guardar.', 'error');
            const res = reg
                ? await rest.actualizarRegistro('diario', reg.id, datos)
                : await rest.crearRegistro('diario', datos, diaSel);
            if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
            fotoPendiente = null;
            aviso(`Día guardado (${fechaCorta(diaSel)})`);
            render();
        });

        if (reg) {
            envoltorio.querySelector('#dia-borrar').addEventListener('click', async () => {
                const res = await rest.borrarRegistro('diario', reg.id);
                if (!res.exito) return aviso(res.error || 'No se pudo borrar.', 'error');
                aviso('Día borrado');
                render();
            });
        }
    };

    await render();
}

// ============================================================
// Ficha de Ahorros: gastos e ingresos, cada uno con su día
// ============================================================
async function fichaAhorros(cont) {
    cont.innerHTML = '';
    const envoltorio = document.createElement('div');
    envoltorio.className = 'ficha-propia';
    cont.appendChild(envoltorio);

    const render = async () => {
        envoltorio.innerHTML = '<div class="skeleton"></div>';
        const r = await rest.listarRegistros('ahorros');
        if (!r.exito) return aviso(r.error || 'No se pudieron leer los ahorros.', 'error');

        const gastos = r.datos.filter((x) => x.datos && x.datos.tipo === 'gasto');
        const ingresos = r.datos.filter((x) => x.datos && x.datos.tipo === 'ingreso');
        const mesActual = claveDia(new Date()).slice(0, 7);
        const sumaMes = (lista) => lista
            .filter((x) => claveDia(x.fecha).startsWith(mesActual))
            .reduce((s, x) => s + (Number(x.datos.cantidad) || 0), 0);
        const eur = (n) => n.toLocaleString('es-ES', { maximumFractionDigits: 2 }) + ' €';

        const pintarSeccion = (tipo, titulo, lista) => `
            <div class="tarjeta">
                <h3>${titulo}</h3>
                <div class="ahorro-alta">
                    <input class="entrada" id="${tipo}-concepto" placeholder="Concepto" autocomplete="off">
                    <input class="entrada" id="${tipo}-cantidad" type="number" min="0" step="0.01" placeholder="0,00 €">
                    <input class="entrada" id="${tipo}-fecha" type="date" value="${claveDia(new Date())}">
                    <button class="boton-primario" id="${tipo}-btn">Añadir</button>
                </div>
                ${lista.length ? `<div class="ahorro-lista">${lista.map((x) => `
                    <div class="ahorro-fila">
                        <span class="ahorro-fecha">${fechaCorta(x.fecha)}</span>
                        <span class="ahorro-concepto">${esc((x.datos && x.datos.concepto) || '(sin concepto)')}</span>
                        <span class="ahorro-cantidad-ver ${tipo}">${tipo === 'gasto' ? '−' : '+'}${eur(Number(x.datos && x.datos.cantidad) || 0)}</span>
                        <button class="boton-peligro" data-borrar="${x.id}">Borrar</button>
                    </div>`).join('')}</div>`
                    : '<p class="pista" style="margin-top:0.9rem">Aquí todavía no hay nada.</p>'}
            </div>`;

        const totalGastos = sumaMes(gastos);
        const totalIngresos = sumaMes(ingresos);
        const saldo = totalIngresos - totalGastos;

        envoltorio.innerHTML = `
            <div class="tarjeta resumen-plata">
                <div><p class="pista" style="margin:0">Ingresos del mes</p><strong class="verde">${eur(totalIngresos)}</strong></div>
                <div><p class="pista" style="margin:0">Gastos del mes</p><strong class="rojo">${eur(totalGastos)}</strong></div>
                <div><p class="pista" style="margin:0">Saldo del mes</p><strong class="${saldo >= 0 ? 'verde' : 'rojo'}">${eur(saldo)}</strong></div>
            </div>
            <div class="dos-flex">
                ${pintarSeccion('gasto', 'Gastos', gastos)}
                ${pintarSeccion('ingreso', 'Ingresos', ingresos)}
            </div>`;

        for (const tipo of ['gasto', 'ingreso']) {
            envoltorio.querySelector(`#${tipo}-btn`).addEventListener('click', async () => {
                const concepto = envoltorio.querySelector(`#${tipo}-concepto`).value.trim();
                const cantidad = Number(envoltorio.querySelector(`#${tipo}-cantidad`).value);
                const fecha = envoltorio.querySelector(`#${tipo}-fecha`).value || claveDia(new Date());
                if (!concepto) return aviso('Escribe un concepto.', 'error');
                if (!cantidad || cantidad <= 0) return aviso('La cantidad debe ser mayor que 0.', 'error');
                const res = await rest.crearRegistro('ahorros', { tipo, concepto, cantidad }, fecha);
                if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
                aviso(`${tipo === 'gasto' ? 'Gasto' : 'Ingreso'} añadido ✅`);
                render();
            });
        }
        envoltorio.querySelectorAll('[data-borrar]').forEach((b) =>
            b.addEventListener('click', async () => {
                const res = await rest.borrarRegistro('ahorros', b.dataset.borrar);
                if (!res.exito) return aviso(res.error || 'No se pudo borrar.', 'error');
                aviso('Movimiento borrado');
                render();
            }));
    };

    await render();
}

// Unidades sugeridas en los formularios (escribiendo las va a ir
// detectando el navegador; se puede poner cualquier otra a mano)
const UNIDADES = ['g', 'kg', 'l', 'ml', 'ud', 'docena', 'paquete', 'bolsa', 'lata', 'caja', 'bandeja', 'cucharada', 'cucharadita', 'taza', 'tercio'];

// ============================================================
// Ficha de Comidas: despensa, recetas propias, ideas y lista
// de la compra. Cada cosa es un registro con `tipo`:
//   alimento | comida | preparado | compra
// ============================================================
// Iconos de línea (SVG monocromo) para el menú de Comidas:
// dibujos a trazo, no emoticonos de colores
const svgLinea = (cuerpo) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${cuerpo}</svg>`;
const ICONO_MENU = {
    ideas: svgLinea('<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>'),
    comidas: svgLinea('<circle cx="9.5" cy="12.5" r="5.5"/><path d="M14.9 12.5H21"/>'),
    despensa: svgLinea('<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12"/>'),
    compra: svgLinea('<path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.6a2 2 0 0 0 2-1.6L23 6H6"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/>')
};
// Papelera de línea para borrar en Despensa: icono sobre recuadro rojo
const SVG_PAPELERA = svgLinea('<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>');

// Reduce la foto del ticket en el navegador antes de subirla:
// una foto de móvil son varios MB y así viaja en cientos de KB.
async function comprimirImagen(archivo, maxLado = 1400) {
    const imagen = await createImageBitmap(archivo);
    const escala = Math.min(1, maxLado / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.max(1, Math.round(imagen.width * escala));
    lienzo.height = Math.max(1, Math.round(imagen.height * escala));
    lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    return { data: lienzo.toDataURL('image/jpeg', 0.82).split(',')[1], mime: 'image/jpeg' };
}

async function fichaComidas(cont) {
    cont.innerHTML = '';
    const envoltorio = document.createElement('div');
    envoltorio.className = 'ficha-propia';
    cont.appendChild(envoltorio);

    // Aviso de uso: solo la primera vez que se entra en Cocina (se repite desde Ayuda)
    tutorialPrimeraVez('dasna-tutorial-comidas', PASOS_COMIDAS);

    let pestana = 'ideas';      // ideas | comidas | despensa | compra (empieza en Ideas)
    let ideaBusq = '';
    let ideaTiempo = 'todas';   // todas | rapido | medio | largo
    let ideaTengo = false;
    let filtroSuper = 'todos';
    let editando = null;        // { tipo, id } mientras se corrige algo
    let ticket = null;          // foto del ticket: null | { estado, lineas, error }

    const render = async () => {
        envoltorio.innerHTML = '<div class="skeleton"></div>';
        const r = await rest.listarRegistros('comidas', { limite: 500 });
        if (!r.exito) return aviso(r.error || 'No se pudo leer el módulo.', 'error');

        const q = (sel) => envoltorio.querySelector(sel);
        const comidas = r.datos.filter((x) => x.datos && x.datos.tipo === 'comida');
        const alimentos = r.datos.filter((x) => x.datos && x.datos.tipo === 'alimento');
        const preparados = r.datos.filter((x) => x.datos && x.datos.tipo === 'preparado');
        const compra = r.datos.filter((x) => x.datos && x.datos.tipo === 'compra');
        const pendientes = compra.filter((x) => !x.datos.comprado);

        const eur = (n) => Number(n).toLocaleString('es-ES', { maximumFractionDigits: 2 }) + ' €';
        // Comparaciones sin distinguir mayúsculas ni tildes: "Tomate Frito" == "tomate frito"
        const normal = (s) => String(s == null ? '' : s)
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .trim().toLowerCase();
        // Valoración en la fila: punto de color. El formulario enseña cada
        // punto junto a su palabra, así que el punto solo se entiende solo
        const valorPunto = (v) => v
            ? `<span class="punto ${v === 'me gusta' ? 'p-ok' : v === 'malo' ? 'p-malo' : 'p-med'}" title="${v === 'me gusta' ? 'Me gusta' : v === 'malo' ? 'Malo' : 'Regular'}"></span>`
            : '';
        // Lo que "tienes en casa": alimentos marcados + tapers/congelados
        const tengo = new Set([
            ...alimentos.filter((a) => a.datos.enCasa).map((a) => normal(a.datos.nombre)),
            ...preparados.map((p) => normal(p.datos.nombre))
        ]);
        const categoriaPrep = (c) => (c ? `<span class="pista">(${esc(c)})</span>` : '');
        // Dibujo de comida para la nevera: se busca por palabras del nombre
        const DIBUJOS = [
            ['pollo', '🍗'], ['pechuga', '🍗'], ['pavo', '🍗'],
            ['ternera', '🥩'], ['carne', '🥩'], ['lomo', '🥩'], ['chuleta', '🥩'], ['hamburguesa', '🥩'], ['picada', '🥩'], ['cerdo', '🥩'], ['costilla', '🍖'], ['cordero', '🍖'], ['conejo', '🍖'],
            ['jamon', '🥓'], ['chorizo', '🥓'], ['salchichon', '🥓'], ['bacon', '🥓'], ['beicon', '🥓'],
            ['bacalao', '🐟'], ['merluza', '🐟'], ['pescado', '🐟'], ['atun', '🐟'], ['salmon', '🍤'], ['gamba', '🍤'], ['marisco', '🍤'], ['mejillon', '🦪'],
            ['huevo', '🥚'],
            ['queso', '🧀'], ['mantequilla', '🧈'], ['leche', '🥛'], ['yogur', '🍶'], ['nata', '🥛'],
            ['tomate', '🍅'], ['patata', '🥔'], ['papa', '🥔'], ['cebolla', '🧅'], ['ajo', '🧄'], ['zanahoria', '🥕'], ['lechuga', '🥬'], ['espinaca', '🥬'], ['brocoli', '🥦'], ['calabacin', '🥒'], ['pepino', '🥒'], ['pimiento', '🫑'], ['maiz', '🌽'], ['champinon', '🍄'], ['seta', '🍄'], ['apio', '🥬'], ['remolacha', '🥗'],
            ['garbanzo', '🫘'], ['lenteja', '🫘'], ['alubia', '🫘'], ['judia', '🫘'], ['arroz', '🍚'], ['pasta', '🍝'], ['espagueti', '🍝'], ['macarron', '🍝'], ['fideo', '🍜'], ['pan', '🍞'], ['harina', '🌾'], ['avena', '🌾'], ['cereal', '🥣'],
            ['platano', '🍌'], ['manzana', '🍎'], ['pera', '🍐'], ['naranja', '🍊'], ['limon', '🍋'], ['fresa', '🍓'], ['frambuesa', '🍇'], ['uva', '🍇'], ['melocoton', '🍑'], ['sandia', '🍉'], ['melon', '🍉'], ['pina', '🍍'], ['mango', '🥭'], ['cereza', '🍒'], ['coco', '🥥'], ['kiwi', '🥝'], ['aguacate', '🥑'],
            ['cafe', '☕'], ['zumo', '🥤'], ['refresco', '🥤'], ['cerveza', '🍺'], ['vino', '🍷'], ['agua', '💧'],
            ['aceite', '🫗'], ['vinagre', '🫙'], ['miel', '🍯'], ['azucar', '🍬'], ['salsa', '🥫'], ['sal', '🧂'], ['pimienta', '🌶️'], ['chile', '🌶️'], ['especia', '🌶️'], ['sopa', '🍲'], ['conserva', '🥫'],
            ['chocolate', '🍫'], ['galleta', '🍪'], ['bizcocho', '🧁'], ['pastel', '🧁'], ['tarta', '🧁'], ['helado', '🍨'], ['pizza', '🍕'], ['taco', '🌮'], ['sushi', '🍣'],
            ['albondiga', '🍝'], ['tortilla', '🍳'], ['estofado', '🍲'], ['guiso', '🍲'], ['croqueta', '🥟'], ['empanadilla', '🥟'], ['bolon', '🥟'],
        ];
        const dibujoDe = (nombre) => {
            const n = normal(nombre);
            const hallado = DIBUJOS.find(([clave]) => n.includes(clave));
            return hallado ? hallado[1] : '🍽️';
        };

        const filaIng = (i, ing) => `
            <div class="com-ing-fila">
                <input class="entrada" list="alimentos-dl" data-campo="nombre" placeholder="Ingrediente${i ? ` ${i + 1}` : ''}" value="${esc(ing && ing.nombre ? ing.nombre : '')}" autocomplete="off">
                <input class="entrada" data-campo="cantidad" placeholder="Cant." inputmode="decimal" value="${esc(ing && ing.cantidad ? ing.cantidad : '')}">
                <input class="entrada" data-campo="unidad" list="unidades-dl" placeholder="Unidad" value="${esc(ing && ing.unidad ? ing.unidad : '')}" autocomplete="off">
                <button type="button" class="com-ing-quitar" title="Quitar ingrediente">✕</button>
            </div>`;

        // --- Resultados de Ideas (se repintan solos al filtrar) ---
        const htmlIdeas = () => {
            const lista = comidas.filter((x) => {
                const d = x.datos;
                const mins = Number(d.minutos) || 0;
                if (ideaTiempo === 'rapido' && mins > 15) return false;
                if (ideaTiempo === 'medio' && (mins <= 15 || mins > 45)) return false;
                if (ideaTiempo === 'largo' && mins <= 45) return false;
                const ings = d.ingredientes || [];
                if (ideaTengo && (!ings.length || ings.some((i) => !tengo.has(normal(i.nombre))))) return false;
                if (ideaBusq) {
                    const busca = normal(ideaBusq);
                    if (!normal(d.nombre).includes(busca) && !ings.some((i) => normal(i.nombre).includes(busca))) return false;
                }
                return true;
            });
            if (!lista.length) return '<p class="pista">Ninguna comida encaja con esos filtros… ¡invéntate una nueva!</p>';
            return lista.map((x) => {
                const d = x.datos;
                const ings = d.ingredientes || [];
                const chips = ings.length
                    ? ings.map((i) => `<span class="chip ${tengo.has(normal(i.nombre)) ? 'chip-ok' : 'chip-no'}">${esc(i.nombre)}</span>`).join(' ')
                    : '<span class="pista">Sin ingredientes anotados</span>';
                const faltan = ings.filter((i) => !tengo.has(normal(i.nombre)));
                return `<div class="com-fila-card">
                    <div class="com-fila-cab"><strong>${esc(d.nombre)}</strong><span class="chip">${Number(d.minutos) || '?'} min</span></div>
                    <div class="com-ings">${chips}</div>
                    <div class="com-acciones">
                        ${faltan.length && ings.length
                            ? `<button class="boton-suave" data-faltantes="${x.id}">Comprar lo que falta (${faltan.length})</button>`
                            : `<button class="boton-suave" data-anadir="${x.id}">A la compra</button>`}
                        <button class="com-editar" data-editar-comida="${x.id}" title="Editar">Editar</button>
                        <button class="com-x" data-borrar-comida="${x.id}" title="Borrar">Borrar</button>
                    </div>
                </div>`;
            }).join('');
        };

        // --- Nevera dibujada: lo que tienes en casa, debajo del menú ---
        const enCasa = alimentos.filter((a) => a.datos.enCasa);
        const nevera = (() => {
            // Sin límite ni "+N más": lo que no cabe de un vistazo se ve con scroll
            const porBalda = Math.max(1, Math.ceil(enCasa.length / 4));
            const baldas = [];
            for (let i = 0; i < enCasa.length; i += porBalda) baldas.push(enCasa.slice(i, i + porBalda));
            while (baldas.length < 4) baldas.push([]);
            const item = (a) => `<button type="button" class="nevera-item" data-pestana="despensa" title="${esc(a.datos.nombre)}">${dibujoDe(a.datos.nombre)}</button>`;
            const congs = preparados;
            const dibujoCong = (p) => `<button type="button" class="nevera-item" data-pestana="despensa" title="${esc(p.datos.nombre)}">${dibujoDe(p.datos.nombre)}</button>`;
            return `
            <div class="nevera" aria-label="Tu nevera">
                <div class="nevera-aparato">
                    <div class="nevera-puerta">
                        <span class="nevera-jarra j1"></span>
                        <span class="nevera-jarra j2"></span>
                        <span class="nevera-jarra j3"></span>
                    </div>
                    <div class="nevera-cuerpo">
                        <div class="nevera-cong">${congs.length ? congs.map(dibujoCong).join('') : '<span class="nevera-vacia">Congelador vacío</span>'}</div>
                        <div class="nevera-baldas">
                            ${baldas.map((b) => `<div class="nevera-balda">${b.map(item).join('')}</div>`).join('')}
                        </div>
                        ${!enCasa.length ? '<p class="nevera-vacia">La nevera está vacía: apunta alimentos en Despensa.</p>' : ''}
                    </div>
                </div>
            </div>`;
        })();

        // --- Menú lateral (el contenido va al lado) ---
        const menuLateral = `
            <div class="com-izq">
                <nav class="com-menu">
                    ${[['ideas', 'Ideas'], ['comidas', 'Comidas'], ['despensa', 'Despensa'],
                        ['compra', `Compra${pendientes.length ? ` (${pendientes.length})` : ''}`]]
                        .map(([k, t]) => `<button type="button" data-pestana="${k}" class="${pestana === k ? 'activo' : ''}">${ICONO_MENU[k]}<span>${t}</span></button>`).join('')}
                </nav>
                ${nevera}
            </div>`;

        // --- Pestaña Comidas ---
        const pintarComidas = () => {
            const ec = editando && editando.tipo === 'comida' ? comidas.find((x) => x.id === editando.id) : null;
            const ingsForm = ec && (ec.datos.ingredientes || []).length ? ec.datos.ingredientes : [null, null, null];
            return `
            <div class="dos-flex">
                <div class="tarjeta">
                    <h3>${ec ? 'Editar comida' : 'Nueva comida'}</h3>
                    ${ec ? `<p class="com-editando">Modificando «${esc(ec.datos.nombre)}»</p>` : ''}
                    <label class="etiqueta">Nombre del plato</label>
                    <input class="entrada" id="c-nombre" placeholder="Ej: Lentejas con chorizo" value="${esc(ec ? ec.datos.nombre : '')}" autocomplete="off">
                    <label class="etiqueta" style="margin-top:0.9rem">¿Cuánto tarda? (minutos)</label>
                    <input class="entrada" id="c-minutos" type="number" min="1" placeholder="Ej: 35" value="${ec && ec.datos.minutos ? Number(ec.datos.minutos) : ''}">
                    <label class="etiqueta" style="margin-top:0.9rem">Ingredientes</label>
                    <div id="c-ings">${ingsForm.map((ing, i) => filaIng(i, ing)).join('')}</div>
                    <button type="button" class="boton-suave" id="c-mas-ing" style="margin-top:0.6rem">Añadir ingrediente</button>
                    <div class="fila-botones">
                        <button class="boton-primario" id="c-guardar">${ec ? 'Guardar cambios' : 'Guardar comida'}</button>
                        ${ec ? '<button class="boton-suave" id="c-cancelar">Cancelar</button>' : ''}
                    </div>
                </div>
                <div class="tarjeta">
                    <h3>Tus comidas (${comidas.length})</h3>
                    ${comidas.length ? comidas.map((x) => {
                        const d = x.datos;
                        const chips = (d.ingredientes || []).map((i) =>
                            `<span class="chip">${esc(i.nombre)}${i.cantidad ? ` · ${esc(i.cantidad)}${i.unidad ? ' ' + esc(i.unidad) : ''}` : ''}</span>`).join(' ');
                        return `<div class="com-fila-card${ec && ec.id === x.id ? ' editando' : ''}">
                            <div class="com-fila-cab"><strong>${esc(d.nombre)}</strong><span class="chip">${Number(d.minutos) || '?'} min</span></div>
                            <div class="com-ings">${chips || '<span class="pista">Sin ingredientes</span>'}</div>
                            <div class="com-acciones">
                                <button class="boton-suave" data-anadir="${x.id}">A la compra</button>
                                <button class="com-editar" data-editar-comida="${x.id}" title="Editar">Editar</button>
                                <button class="com-x" data-borrar-comida="${x.id}" title="Borrar">Borrar</button>
                            </div>
                        </div>`;
                    }).join('') : '<p class="pista">Todavía no tienes comidas. ¡La primera, arriba!</p>'}
                </div>
            </div>`;
        };

        // --- Pestaña Despensa ---
        const pintarDespensa = () => {
            const ea = editando && editando.tipo === 'alimento' ? alimentos.find((x) => x.id === editando.id) : null;
            const ep = editando && editando.tipo === 'preparado' ? preparados.find((x) => x.id === editando.id) : null;
            return `
            <div class="dos-flex">
                <div class="tarjeta">
                    <h3>${ea ? 'Editar alimento' : 'Alimentos'}</h3>
                    ${ea ? `<p class="com-editando">Modificando «${esc(ea.datos.nombre)}»</p>` : ''}
                    <div class="com-alta">
                        <input class="entrada" id="a-nombre" placeholder="Ej: Tomate frito" value="${esc(ea ? ea.datos.nombre : '')}" autocomplete="off">
                        <input class="entrada" id="a-unidad" list="unidades-dl" placeholder="Unidad (ud, kg…)" value="${esc(ea ? (ea.datos.unidad || '') : '')}" autocomplete="off">
                        <div class="valor-radios" id="a-valor" role="radiogroup" aria-label="Valoración">
                            ${[['', 'p-nada'], ['me gusta', 'p-ok'], ['regular', 'p-med'], ['malo', 'p-malo']]
                                .map(([v, p]) => {
                                    const t = v === '' ? 'Sin valorar' : v === 'me gusta' ? 'Me gusta' : v === 'malo' ? 'Malo' : 'Regular';
                                    const sel = (ea && ea.datos.valoracion ? ea.datos.valoracion : '') === v;
                                    return `<label class="vr"><input type="radio" name="a-valor" value="${v}" ${sel ? 'checked' : ''}><span class="punto ${p}"></span>${t}</label>`;
                                }).join('')}
                        </div>
                        <label class="com-check"><input type="checkbox" id="a-casa" ${ea ? (ea.datos.enCasa ? 'checked' : '') : 'checked'}> En casa</label>
                        <button class="boton-primario" id="a-guardar">${ea ? 'Guardar cambios' : 'Añadir alimento'}</button>
                        ${ea ? '<button class="boton-suave" id="a-cancelar">Cancelar</button>' : ''}
                    </div>
                    ${alimentos.length ? `<div class="com-lista">${alimentos.map((x) => `
                        <div class="com-fila${ea && ea.id === x.id ? ' editando' : ''}">
                            <span>${esc(x.datos.nombre)}${x.datos.unidad ? ` <span class="pista">(${esc(x.datos.unidad)})</span>` : ''}</span>
                            <span class="com-fila-acciones">${valorPunto(x.datos.valoracion)}${x.datos.enCasa ? ' <span class="chip">en casa</span>' : ''}
                                <button class="com-editar" data-editar-alimento="${x.id}" title="Editar">Editar</button>
                                <button class="com-papelera" data-borrar-alimento="${x.id}" title="Borrar">${SVG_PAPELERA}</button></span>
                        </div>`).join('')}</div>` : '<p class="pista">Sin alimentos todavía.</p>'}
                </div>
                <div class="tarjeta">
                    <h3>${ep ? 'Editar preparado' : 'Tapers y congelados'}</h3>
                    ${ep ? `<p class="com-editando">Modificando «${esc(ep.datos.nombre)}»</p>` : ''}
                    <div class="com-alta">
                        <input class="entrada" id="p-nombre" placeholder="Ej: Albóndigas en salsa" value="${esc(ep ? ep.datos.nombre : '')}" autocomplete="off">
                        <select class="entrada" id="p-tipo">
                            <option value="congelado" ${ep && ep.datos.categoria === 'congelado' ? 'selected' : ''}>Congelado</option>
                            <option value="taper" ${ep && ep.datos.categoria === 'taper' ? 'selected' : ''}>Taper</option>
                            <option value="nevera" ${ep && ep.datos.categoria === 'nevera' ? 'selected' : ''}>Nevera</option>
                        </select>
                        <input class="entrada" id="p-raciones" type="number" min="1" placeholder="Raciones" value="${ep ? Number(ep.datos.raciones) || 1 : ''}">
                        <button class="boton-primario" id="p-guardar">${ep ? 'Guardar cambios' : 'Añadir'}</button>
                        ${ep ? '<button class="boton-suave" id="p-cancelar">Cancelar</button>' : ''}
                    </div>
                    ${preparados.length ? `<div class="com-lista">${preparados.map((x) => `
                        <div class="com-fila${ep && ep.id === x.id ? ' editando' : ''}">
                            <span>${esc(x.datos.nombre)} ${categoriaPrep(x.datos.categoria)}
                                <span class="chip">×${Number(x.datos.raciones) || 1}</span></span>
                            <span class="com-fila-acciones">
                                <button class="boton-suave" data-usar="${x.id}">Usada</button>
                                <button class="com-editar" data-editar-preparado="${x.id}" title="Editar">Editar</button>
                                <button class="com-papelera" data-borrar-preparado="${x.id}" title="Borrar">${SVG_PAPELERA}</button>
                            </span>
                        </div>`).join('')}</div>` : '<p class="pista">No tienes nada preparado.</p>'}
                </div>
            </div>`;
        };

        // --- Pestaña Ideas ---
        const pintarIdeas = () => {
            // Rápidas con lo que ya tienes: recetas de ≤15 min cuyos
            // ingredientes están todos en casa (no solo lo del congelador)
            const rapidas = comidas.filter((x) => {
                const ings = (x.datos && x.datos.ingredientes) || [];
                return (Number(x.datos.minutos) || 0) <= 15
                    && ings.length
                    && ings.every((i) => tengo.has(normal(i.nombre)));
            });
            const rapidoHtml = rapidas.map((x) => {
                const d = x.datos;
                return `<div class="com-fila-card">
                    <div class="com-fila-cab"><strong>${esc(d.nombre)}</strong><span class="chip">${Number(d.minutos) || '?'} min</span></div>
                    <div class="com-ings">${(d.ingredientes || []).map((i) => `<span class="chip chip-ok">${esc(i.nombre)}</span>`).join(' ')}</div>
                </div>`;
            }).join('');
            return `
                ${rapidas.length ? `<div class="tarjeta"><h3>Recetas rápidas con ingredientes que tengas</h3>${rapidoHtml}</div>` : ''}
                <div class="tarjeta">
                    <h3>Ideas para cocinar</h3>
                    <div class="com-filtros">
                        <input class="entrada" id="idea-busq" placeholder="Busca por plato o ingrediente…" value="${esc(ideaBusq)}" autocomplete="off">
                        <div class="periodo-toggle">
                            ${[['todas', 'Todas'], ['rapido', '≤15 min'], ['medio', '15-45 min'], ['largo', '>45 min']]
                                .map(([k, t]) => `<button type="button" data-tiempo="${k}" class="${ideaTiempo === k ? 'activo' : ''}">${t}</button>`).join('')}
                        </div>
                        <label class="com-check"><input type="checkbox" id="idea-tengo" ${ideaTengo ? 'checked' : ''}> Solo con lo que tengo</label>
                    </div>
                    <div id="idea-resultados">${htmlIdeas()}</div>
                </div>`;
        };

        // --- Pestaña Compra ---
        const pintarCompra = () => {
            const supers = [...new Set(compra.map((x) => normal(x.datos.super)).filter(Boolean))];
            const enLista = compra.filter((x) => !filtroSuper || filtroSuper === 'todos' || normal(x.datos.super) === normal(filtroSuper));
            const pend = enLista.filter((x) => !x.datos.comprado);
            const hechos = enLista.filter((x) => x.datos.comprado);
            const subtotales = supers.map((s) => {
                const total = compra
                    .filter((x) => normal(x.datos.super) === s && Number(x.datos.precio) > 0)
                    .reduce((sum, x) => sum + Number(x.datos.precio), 0);
                return `<span class="chip">${esc(s)}: ${eur(total)}</span>`;
            }).join(' ');

            const filaItem = (x) => {
                const d = x.datos;
                return `<div class="com-item ${d.comprado ? 'hecho' : ''}">
                    <label class="com-check"><input type="checkbox" data-tachar="${x.id}" ${d.comprado ? 'checked' : ''}></label>
                    <span class="com-item-nombre">${esc(d.nombre)}${d.cantidad ? ` <span class="pista">· ${esc(d.cantidad)}${d.unidad ? ' ' + esc(d.unidad) : ''}</span>` : ''}</span>
                    <input class="entrada com-mini" data-super="${x.id}" placeholder="Super" value="${esc(d.super || '')}" autocomplete="off">
                    <input class="entrada com-mini" data-precio="${x.id}" type="number" min="0" step="0.01" placeholder="€" value="${d.precio != null && d.precio !== '' ? Number(d.precio) : ''}">
                    <button type="button" class="com-item-x" data-borrar-compra="${x.id}" title="Quitar de la lista">✕</button>
                </div>`;
            };

            // Revisión del ticket: solo aparece mientras hay algo que mirar
            const panelTicket = !ticket ? '' : ticket.estado === 'leyendo'
                ? `<div class="tarjeta"><h3>Foto al ticket</h3><p class="pista">Leyendo el ticket, un momento…</p><div class="skeleton"></div></div>`
                : ticket.estado === 'error'
                    ? `<div class="tarjeta"><h3>Foto al ticket</h3><p class="pista ticket-error">${esc(ticket.error)}</p>
                        <div class="com-acciones">
                            <button class="boton-suave" id="ticket-reintentar">Reintentar</button>
                            <button class="boton-suave" id="ticket-cerrar">Cerrar</button>
                        </div></div>`
                    : `<div class="tarjeta">
                        <h3>He leído esto del ticket</h3>
                        <p class="pista">Quita lo que esté mal: lo que quede entra a la despensa con «En casa» marcado.</p>
                        <div class="ticket-lineas">${ticket.lineas.map((l, i) => `
                            <div class="ticket-linea">
                                <span class="ticket-nombre">${esc(l.nombre)}</span>
                                <span class="ticket-precio">${l.precio != null ? eur(l.precio) : '—'}</span>
                                <button type="button" class="ticket-borrar" data-ticket-borrar="${i}">Borrar</button>
                            </div>`).join('')}
                        </div>
                        <div class="com-acciones">
                            <button class="boton-primario" id="ticket-ok">Añadir a la despensa</button>
                            <button class="boton-suave" id="ticket-cerrar">Cancelar</button>
                        </div>
                    </div>`;

            return `${panelTicket}
                <div class="tarjeta">
                    <h3>Lista de la compra ${pendientes.length ? `<span class="chip">${pendientes.length} pendientes</span>` : ''}</h3>
                    <div class="com-acciones">
                        <button class="boton-suave" id="com-generar">Generar desde mis comidas</button>
                        <button class="boton-suave" id="com-ticket">Foto al ticket</button>
                        <input type="file" id="ticket-foto" accept="image/*" capture="environment" class="oculto">
                        ${hechos.length ? '<button class="boton-suave" id="com-limpiar">Quitar comprados</button>' : ''}
                        ${compra.length ? '<button class="boton-peligro" id="com-vaciar">Vaciar lista</button>' : ''}
                        ${supers.length ? `<select class="entrada com-mini" id="com-super" style="max-width:200px">
                            <option value="todos">Voy a… (todos)</option>
                            ${supers.map((s) => `<option value="${esc(s)}" ${filtroSuper === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}
                        </select>` : ''}
                    </div>
                    <div class="com-generador oculto" id="com-generador">
                        ${comidas.length ? comidas.map((x) => `<label class="com-check"><input type="checkbox" data-gen="${x.id}"> ${esc(x.datos.nombre)} <span class="pista">(${(x.datos.ingredientes || []).length} ingredientes)</span></label>`).join('') + '<div class="fila-botones"><button class="boton-primario" id="com-generar-ok">Añadir lo marcado a la lista</button></div>' : '<p class="pista">Primero guarda comidas en la pestaña Comidas.</p>'}
                    </div>
                    ${pend.length || hechos.length ? `
                        <div class="com-lista">
                            ${pend.map(filaItem).join('')}
                            ${hechos.map(filaItem).join('')}
                        </div>
                        ${subtotales ? `<p class="pista" style="margin-top:0.8rem">Subtotales: ${subtotales}</p>` : ''}
                        <p class="pista" style="margin-top:0.4rem">Pon super y precio a cada producto y comparo dónde sale más barato.</p>`
            : '<p class="pista" style="margin-top:0.9rem">La lista está vacía: genera desde tus comidas o añade a mano aquí abajo.</p>'}
                </div>
                <div class="tarjeta">
                    <h3>Añadir a mano</h3>
                    <div class="com-alta">
                        <input class="entrada" id="m-nombre" placeholder="Ej: Plátanos" autocomplete="off">
                        <input class="entrada" id="m-cantidad" placeholder="Cant. (opcional)" autocomplete="off">
                        <button class="boton-primario" id="m-guardar">Añadir a la lista</button>
                    </div>
                </div>`;
        };

        const datalists = `
            <datalist id="alimentos-dl">${alimentos.map((a) => `<option value="${esc(a.datos.nombre)}">`).join('')}</datalist>
            <datalist id="unidades-dl">${UNIDADES.map((u) => `<option value="${u}">`).join('')}</datalist>`;

        envoltorio.innerHTML = datalists + `<div class="com-layout">${menuLateral}<div class="com-cuerpo">${
            pestana === 'comidas' ? pintarComidas()
                : pestana === 'despensa' ? pintarDespensa()
                    : pestana === 'ideas' ? pintarIdeas()
                        : pintarCompra()
        }</div></div>`;

        // --- Añadir ingredientes a la compra (sin duplicar lo pendiente) ---
        const anadirACompra = async (listasDeIngs) => {
            const enLista = new Set(pendientes.map((p) => normal(p.datos.nombre)));
            let n = 0;
            for (const ings of listasDeIngs) {
                for (const i of ings) {
                    if (!i || !i.nombre || enLista.has(normal(i.nombre))) continue;
                    const res = await rest.crearRegistro('comidas', {
                        tipo: 'compra', nombre: i.nombre, cantidad: i.cantidad || '', unidad: i.unidad || '',
                        comprado: false, super: '', precio: null
                    });
                    if (res.exito) { enLista.add(normal(i.nombre)); n++; }
                }
            }
            aviso(n ? `${n} ${n === 1 ? 'producto añadido' : 'productos añadidos'} a la compra` : 'Ya estaba todo en la lista');
            render();
        };

        // --- Pestañas ---
        envoltorio.querySelectorAll('[data-pestana]').forEach((b) =>
            b.addEventListener('click', () => { pestana = b.dataset.pestana; editando = null; render(); }));

        // --- Ideas: los filtros repintan solo los resultados ---
        const inpIdea = q('#idea-busq');
        if (inpIdea) {
            inpIdea.addEventListener('input', () => {
                ideaBusq = inpIdea.value;
                q('#idea-resultados').innerHTML = htmlIdeas();
            });
            envoltorio.querySelectorAll('[data-tiempo]').forEach((b) =>
                b.addEventListener('click', () => {
                    ideaTiempo = b.dataset.tiempo;
                    envoltorio.querySelectorAll('[data-tiempo]').forEach((x) => x.classList.toggle('activo', x === b));
                    q('#idea-resultados').innerHTML = htmlIdeas();
                }));
            q('#idea-tengo').addEventListener('change', (e) => {
                ideaTengo = e.target.checked;
                q('#idea-resultados').innerHTML = htmlIdeas();
            });
        }

        // --- Comidas: alta y edición ---
        if (q('#c-guardar')) {
            q('#c-mas-ing').addEventListener('click', () => {
                const div = document.createElement('div');
                div.innerHTML = filaIng(1, null);
                q('#c-ings').appendChild(div.firstElementChild);
                const nueva = div.firstElementChild.querySelector('input');
                if (nueva) nueva.focus();
            });
            envoltorio.querySelectorAll('.com-ing-quitar').forEach((b) =>
                b.addEventListener('click', () => {
                    const filas = q('#c-ings').querySelectorAll('.com-ing-fila');
                    if (filas.length > 1) b.closest('.com-ing-fila').remove();
                    else filas.forEach((f) => f.querySelectorAll('input').forEach((i) => { i.value = ''; }));
                }));
            const cancelar = q('#c-cancelar');
            if (cancelar) cancelar.addEventListener('click', () => { editando = null; render(); });
            q('#c-guardar').addEventListener('click', async () => {
                const nombre = q('#c-nombre').value.trim();
                if (!nombre) return aviso('Ponle nombre a la comida.', 'error');
                const ingredientes = [...q('#c-ings').querySelectorAll('.com-ing-fila')]
                    .map((fila) => ({
                        nombre: fila.querySelector('[data-campo="nombre"]').value.trim(),
                        cantidad: fila.querySelector('[data-campo="cantidad"]').value.trim(),
                        unidad: fila.querySelector('[data-campo="unidad"]').value.trim()
                    })).filter((i) => i.nombre);
                const minutos = Number(q('#c-minutos').value) || null;
                const ec = editando && editando.tipo === 'comida' ? comidas.find((x) => x.id === editando.id) : null;
                const datos = { tipo: 'comida', nombre, minutos, ingredientes };
                const res = ec
                    ? await rest.actualizarRegistro('comidas', ec.id, datos)
                    : await rest.crearRegistro('comidas', datos);
                if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
                editando = null;
                aviso(ec ? `Comida actualizada: ${nombre}` : `Comida guardada: ${nombre}`);
                render();
            });
        }

        // --- Despensa: altas y ediciones ---
        if (q('#a-guardar')) {
            const cancelarA = q('#a-cancelar');
            if (cancelarA) cancelarA.addEventListener('click', () => { editando = null; render(); });
            q('#a-guardar').addEventListener('click', async () => {
                const nombre = q('#a-nombre').value.trim();
                if (!nombre) return aviso('Escribe el nombre del alimento.', 'error');
                const ea = editando && editando.tipo === 'alimento' ? alimentos.find((x) => x.id === editando.id) : null;
                // Mismo alimento aunque cambien mayúsculas o tildes = el mismo
                const repetido = alimentos.find((a) => a.id !== (ea && ea.id) && normal(a.datos.nombre) === normal(nombre));
                if (repetido) return aviso(`Ya tienes «${repetido.datos.nombre}» — edítalo en vez de repetirlo.`, 'error');
                const vSel = q('#a-valor input:checked');
                const datos = {
                    tipo: 'alimento', nombre,
                    unidad: q('#a-unidad').value.trim(),
                    valoracion: vSel && vSel.value ? vSel.value : null,
                    enCasa: q('#a-casa').checked
                };
                const res = ea
                    ? await rest.actualizarRegistro('comidas', ea.id, datos)
                    : await rest.crearRegistro('comidas', datos);
                if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
                editando = null;
                aviso(ea ? `Alimento actualizado: ${nombre}` : `Alimento añadido: ${nombre}`);
                render();
            });
        }
        if (q('#p-guardar')) {
            const cancelarP = q('#p-cancelar');
            if (cancelarP) cancelarP.addEventListener('click', () => { editando = null; render(); });
            q('#p-guardar').addEventListener('click', async () => {
                const nombre = q('#p-nombre').value.trim();
                if (!nombre) return aviso('Escribe qué tienes preparado.', 'error');
                const ep = editando && editando.tipo === 'preparado' ? preparados.find((x) => x.id === editando.id) : null;
                const datos = {
                    tipo: 'preparado', nombre,
                    categoria: q('#p-tipo').value,
                    raciones: Number(q('#p-raciones').value) || 1
                };
                const res = ep
                    ? await rest.actualizarRegistro('comidas', ep.id, datos)
                    : await rest.crearRegistro('comidas', datos);
                if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
                editando = null;
                aviso(ep ? `Preparado actualizado: ${nombre}` : `Anotado: ${nombre}`);
                render();
            });
        }

        // --- Botones de edición (ponen el formulario en modo editar) ---
        const empezarEdicion = (tipo, x) => {
            if (!x) return;
            editando = { tipo, id: x.id };
            pestana = tipo === 'alimento' || tipo === 'preparado' ? 'despensa' : 'comidas';
            render().then(() => {
                const foco = tipo === 'comida' ? q('#c-nombre') : tipo === 'alimento' ? q('#a-nombre') : q('#p-nombre');
                if (foco) { foco.focus(); foco.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            });
            aviso(`Editando «${x.datos.nombre}»`);
        };
        envoltorio.querySelectorAll('[data-editar-comida]').forEach((b) =>
            b.addEventListener('click', () => empezarEdicion('comida', comidas.find((c) => c.id === b.dataset.editarComida))));
        envoltorio.querySelectorAll('[data-editar-alimento]').forEach((b) =>
            b.addEventListener('click', () => empezarEdicion('alimento', alimentos.find((a) => a.id === b.dataset.editarAlimento))));
        envoltorio.querySelectorAll('[data-editar-preparado]').forEach((b) =>
            b.addEventListener('click', () => empezarEdicion('preparado', preparados.find((p) => p.id === b.dataset.editarPreparado))));

        // --- Botones que aparecen en varias pestañas ---
        envoltorio.querySelectorAll('[data-anadir]').forEach((b) =>
            b.addEventListener('click', () => {
                const x = comidas.find((c) => c.id === b.dataset.anadir);
                if (x) anadirACompra([x.datos.ingredientes || []]);
            }));
        envoltorio.querySelectorAll('[data-faltantes]').forEach((b) =>
            b.addEventListener('click', () => {
                const x = comidas.find((c) => c.id === b.dataset.faltantes);
                if (x) anadirACompra([(x.datos.ingredientes || []).filter((i) => !tengo.has(normal(i.nombre)))]);
            }));
        const borrarEn = (sel, claveDs, etiqueta) => envoltorio.querySelectorAll(sel).forEach((b) =>
            b.addEventListener('click', async () => {
                const res = await rest.borrarRegistro('comidas', b.dataset[claveDs]);
                if (!res.exito) return aviso(res.error || 'No se pudo borrar.', 'error');
                aviso(`${etiqueta} borrado`);
                render();
            }));
        borrarEn('[data-borrar-comida]', 'borrarComida', 'Comida');
        borrarEn('[data-borrar-alimento]', 'borrarAlimento', 'Alimento');
        borrarEn('[data-borrar-preparado]', 'borrarPreparado', 'Preparado');
        borrarEn('[data-borrar-compra]', 'borrarCompra', 'Producto');

        // --- Despensa: usar una ración ---
        envoltorio.querySelectorAll('[data-usar]').forEach((b) =>
            b.addEventListener('click', async () => {
                const x = preparados.find((p) => p.id === b.dataset.usar);
                if (!x) return;
                const quedan = (Number(x.datos.raciones) || 1) - 1;
                if (quedan <= 0) {
                    const res = await rest.borrarRegistro('comidas', x.id);
                    if (!res.exito) return aviso(res.error || 'No se pudo actualizar.', 'error');
                    aviso(`¡Se te acaban los ${x.datos.nombre}! Apunta receta nueva`, 'error');
                } else {
                    const res = await rest.actualizarRegistro('comidas', x.id, { ...x.datos, raciones: quedan });
                    if (!res.exito) return aviso(res.error || 'No se pudo actualizar.', 'error');
                    aviso(`Quedan ${quedan} de ${x.datos.nombre}`);
                }
                render();
            }));

        // --- Compra: tachar, super y precio ---
        envoltorio.querySelectorAll('[data-tachar]').forEach((b) =>
            b.addEventListener('change', async () => {
                const x = compra.find((c) => c.id === b.dataset.tachar);
                if (!x) return;
                const res = await rest.actualizarRegistro('comidas', x.id, { ...x.datos, comprado: b.checked });
                if (!res.exito) return aviso(res.error || 'No se pudo actualizar.', 'error');
                render();
            }));
        envoltorio.querySelectorAll('[data-super]').forEach((inp) =>
            inp.addEventListener('change', async () => {
                const x = compra.find((c) => c.id === inp.dataset.super);
                if (!x) return;
                const res = await rest.actualizarRegistro('comidas', x.id, { ...x.datos, super: inp.value.trim() });
                if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
                aviso('Super guardado');
                render();
            }));
        envoltorio.querySelectorAll('[data-precio]').forEach((inp) =>
            inp.addEventListener('change', async () => {
                const x = compra.find((c) => c.id === inp.dataset.precio);
                if (!x) return;
                const precio = inp.value === '' ? null : Number(inp.value);
                const res = await rest.actualizarRegistro('comidas', x.id, { ...x.datos, precio });
                if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
                aviso('Precio guardado');
                render();
            }));

        // --- Compra: generar, limpiar y alta manual ---
        if (q('#com-generar')) {
            q('#com-generar').addEventListener('click', () => q('#com-generador').classList.toggle('oculto'));
            const ok = q('#com-generar-ok');
            if (ok) ok.addEventListener('click', () => {
                const marcadas = [...envoltorio.querySelectorAll('[data-gen]:checked')]
                    .map((c) => comidas.find((x) => x.id === c.dataset.gen))
                    .filter(Boolean);
                if (!marcadas.length) return aviso('Marca alguna comida primero.', 'error');
                anadirACompra(marcadas.map((c) => c.datos.ingredientes || []));
            });
        }
        const limpiar = q('#com-limpiar');
        if (limpiar) limpiar.addEventListener('click', async () => {
            const hechos = compra.filter((x) => x.datos.comprado);
            let n = 0;
            for (const x of hechos) {
                const res = await rest.borrarRegistro('comidas', x.id);
                if (res.exito) n++;
            }
            aviso(`${n} comprados quitados`);
            render();
        });
        const vaciar = q('#com-vaciar');
        if (vaciar) vaciar.addEventListener('click', async () => {
            if (!window.confirm('¿Vaciar toda la lista de la compra?')) return;
            let n = 0;
            for (const x of compra) {
                const res = await rest.borrarRegistro('comidas', x.id);
                if (res.exito) n++;
            }
            aviso(`Lista vacía (${n} productos)`);
            render();
        });
        const selSuper = q('#com-super');
        if (selSuper) selSuper.addEventListener('change', () => { filtroSuper = selSuper.value; render(); });
        const guardarManual = q('#m-guardar');
        if (guardarManual) guardarManual.addEventListener('click', async () => {
            const nombre = q('#m-nombre').value.trim();
            if (!nombre) return aviso('Escribe el producto.', 'error');
            if (pendientes.some((p) => normal(p.datos.nombre) === normal(nombre))) {
                return aviso('Ese producto ya está en la lista pendiente.', 'error');
            }
            const res = await rest.crearRegistro('comidas', {
                tipo: 'compra', nombre, cantidad: q('#m-cantidad').value.trim(), unidad: '',
                comprado: false, super: '', precio: null
            });
            if (!res.exito) return aviso(res.error || 'No se pudo añadir.', 'error');
            aviso(`${nombre} en la lista`);
            render();
        });

        // --- Foto al ticket: elegir foto, leer y revisar ---
        const inpTicket = q('#ticket-foto');
        const abrirFoto = () => { if (inpTicket) inpTicket.click(); };
        const btnTicket = q('#com-ticket');
        if (btnTicket) btnTicket.addEventListener('click', abrirFoto);
        const btnReintentar = q('#ticket-reintentar');
        if (btnReintentar) btnReintentar.addEventListener('click', abrirFoto);
        if (inpTicket) inpTicket.addEventListener('change', async () => {
            const archivo = inpTicket.files && inpTicket.files[0];
            inpTicket.value = ''; // así se puede repetir la misma foto
            if (!archivo) return;
            ticket = { estado: 'leyendo' };
            render();
            try {
                const foto = await comprimirImagen(archivo);
                const res = await fetch('/api/ticket', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imagen: foto.data, mime: foto.mime })
                });
                const r = await res.json().catch(() => ({}));
                if (res.ok && Array.isArray(r.productos)) {
                    ticket = r.productos.length
                        ? { estado: 'revision', lineas: r.productos }
                        : { estado: 'error', error: 'No he leído ningún producto: prueba con más luz y la foto bien recta.' };
                } else {
                    ticket = { estado: 'error', error: (r && r.error) || 'No se pudo leer el ticket.' };
                }
            } catch (e) {
                ticket = { estado: 'error', error: 'No se pudo leer el ticket.' };
            }
            render();
        });
        envoltorio.querySelectorAll('[data-ticket-borrar]').forEach((b) =>
            b.addEventListener('click', () => {
                if (!ticket || !ticket.lineas) return;
                ticket.lineas.splice(Number(b.dataset.ticketBorrar), 1);
                if (!ticket.lineas.length) { ticket = null; aviso('No queda ningún producto del ticket.'); }
                render();
            }));
        const ticketCerrar = q('#ticket-cerrar');
        if (ticketCerrar) ticketCerrar.addEventListener('click', () => { ticket = null; render(); });
        const ticketOk = q('#ticket-ok');
        if (ticketOk) ticketOk.addEventListener('click', async () => {
            const lineas = (ticket && ticket.lineas) || [];
            if (!lineas.length) return aviso('No queda ningún producto.', 'error');
            let anadidos = 0, yaEnCasa = 0;
            for (const l of lineas) {
                const ex = alimentos.find((a) => normal(a.datos.nombre) === normal(l.nombre));
                if (ex) {
                    if (ex.datos.enCasa) { yaEnCasa++; continue; }
                    const res = await rest.actualizarRegistro('comidas', ex.id, { ...ex.datos, enCasa: true });
                    if (res.exito) anadidos++;
                } else {
                    const res = await rest.crearRegistro('comidas', {
                        tipo: 'alimento', nombre: l.nombre, unidad: 'ud', valoracion: null, enCasa: true
                    });
                    if (res.exito) anadidos++;
                }
            }
            // Lo leído que coincida con la lista se tacha solo
            // (coincidencia por nombre completo o contenida; nada de 2-3 letras sueltas)
            const coincide = (a, b) => a === b || (a.length >= 4 && b.includes(a)) || (b.length >= 4 && a.includes(b));
            let tachados = 0;
            for (const p of compra) {
                if (p.datos.comprado) continue;
                const np = normal(p.datos.nombre);
                if (lineas.some((l) => coincide(np, normal(l.nombre)))) {
                    const res = await rest.actualizarRegistro('comidas', p.id, { ...p.datos, comprado: true });
                    if (res.exito) tachados++;
                }
            }
            ticket = null;
            aviso(`${anadidos} a la despensa${yaEnCasa ? ` (${yaEnCasa} ya estaban)` : ''}${tachados ? ` y ${tachados} tachados de la lista` : ''}`);
            render();
        });
    };

    await render();
}

function vistaRegistros() {
    cabecera('Películas Libros', '');
    const cont = document.getElementById('vista');
    fichaPelisLibros(cont);
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
            De momento este apartado está en construcción; el plan completo está en la vista
            <a class="enlace" href="#/ayuda">Ayuda</a>.</p>
        </div>`;
}

function vistaAyuda() {
    cabecera('💬 Ayuda', 'Cómo funciona Dasna.');
    document.getElementById('vista').innerHTML = `
        <div class="rejilla">
            <div class="tarjeta"><h3>⌨️ Atajos</h3><p><strong>Ctrl / ⌘ + K</strong>: buscador universal.<br>
El tema claro/oscuro lo cambias con la luna de arriba a la derecha.</p></div>
            <div class="tarjeta"><h3>🧱 Módulos</h3><p>Cada módulo guarda <em>registros</em> (JSON con fecha) en tu cuenta.
            Los recuadros con etiqueta de fase son las ideas planeadas que faltan por construir.</p></div>
            <div class="tarjeta"><h3>✨ Tutorial</h3><p>Si quieres volver a ver las explicaciones:</p>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.6rem">
                <button class="boton-suave" id="btn-tutorial">Ver el tutorial</button>
                <button class="boton-suave" id="btn-tutorial-comidas">Ver cómo se usa Comidas</button>
            </div></div>
        </div>`;
    document.getElementById('btn-tutorial').addEventListener('click', () => abrirTutorial(PASOS_TUTORIAL, 'dasna-tutorial'));
    document.getElementById('btn-tutorial-comidas').addEventListener('click', () => abrirTutorial(PASOS_COMIDAS, 'dasna-tutorial-comidas'));
}

function esAdmin() {
    return !!(sesion && sesion.rol === 'admin');
}

// Archivo (solo admin): la idea de Dasna y sus fases
function vistaArchivo() {
    cabecera('Archivo', 'La idea de Dasna y cómo se ha ido construyendo.');
    const fases = [
        ['Fase 0', 'Hito 4: credenciales, pruebas reales, despliegue en Cloud Run y etiqueta.', true],
        ['Fase 1', 'Sistema de diseño en cristal, tema claro/oscuro, panel sin barra lateral y buscador (Ctrl/⌘ + K).', true],
        ['Fase 2', 'Estudio con recordatorios y plan de temas, y Eventos escritos o dictados.', true],
        ['Fase 3', 'Comidas (nevera, despensa, compra y foto al ticket), Viajes y Beber agua.', true],
        ['Fase 4', 'Outfits, Gimnasio, Diario, Ahorros, Sueño, Visionboard y Películas Libros.', true],
        ['Fase 5', 'Aspecto profesional, barra inferior en el móvil y adaptación móvil completa.', false]
    ];
    document.getElementById('vista').innerHTML = `
        <div class="ficha-propia">
            <div class="tarjeta">
                <h3>La idea</h3>
                <p>Dasna es un panel personal de vida: un núcleo estable (sesión, usuarios y motor de módulos) sobre el que crecen apartados de uso diario. Cada módulo es una colección de registros con fecha más su propia ficha en el cliente; añadir uno no toca el núcleo. Es una PWA instalable, con tema claro y oscuro.</p>
            </div>
            <div class="tarjeta">
                <h3>Fases</h3>
                <div class="ahorro-lista">${fases.map(([f, t, hecha]) => `
                    <div class="ahorro-fila">
                        <span class="ahorro-fecha"><strong>${f}</strong></span>
                        <span class="ahorro-concepto">${t}</span>
                        <span class="chip ${hecha ? 'chip-ok' : 'chip-med'}">${hecha ? 'Hecha' : 'Pendiente'}</span>
                    </div>`).join('')}</div>
            </div>
            <div class="tarjeta">
                <h3>Reglas de construcción</h3>
                <p>Cada módulo = 1 colección + 1 ficha + 1 entrada en el catálogo. JavaScript sin frameworks mientras quepa. Lógica nueva con pruebas. Todo por rama → PR → CI verde → despliegue.</p>
            </div>
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
    registros: vistaRegistros,
    usuarios: vistaUsuarios,
    archivo: vistaArchivo,
    ayuda: vistaAyuda
};

// ============================================================
// Barra inferior (solo móvil): 4 accesos + «Más» (abre el buscador)
// ============================================================
const ACCESOS_MOVIL = [
    { id: 'panel', nombre: 'Panel' },
    { id: 'm/estudio', nombre: 'Estudio' },
    { id: 'm/eventos', nombre: 'Eventos' },
    { id: 'm/comidas', nombre: 'Comidas' }
];
const TRAZO_MAS = '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>';

function pintarBarraInferior() {
    if (document.getElementById('barra-inferior')) return;
    const claves = new Set(modulos.map((m) => m.clave));
    const nav = document.createElement('nav');
    nav.id = 'barra-inferior';
    nav.className = 'barra-inferior';
    nav.setAttribute('aria-label', 'Navegación principal');
    nav.innerHTML = ACCESOS_MOVIL
        .filter((a) => !a.id.startsWith('m/') || claves.has(a.id.slice(2)))
        .map((a) => `<a href="#/${a.id}" data-ruta="${a.id}">${iconoDe(a.id)}<span>${a.nombre}</span></a>`).join('')
        + `<button type="button" id="barra-mas"><span class="icono-linea"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRAZO_MAS}</svg></span><span>Más</span></button>`;
    document.body.appendChild(nav);
    nav.querySelector('#barra-mas').addEventListener('click', abrirBuscador);
}

function marcarBarraInferior(ruta) {
    document.querySelectorAll('#barra-inferior [data-ruta]').forEach((a) =>
        a.classList.toggle('activo', a.dataset.ruta === ruta));
}

function enrutar() {
    const limpio = location.hash.replace(/^#\/?/, '') || 'panel';
    marcarBarraInferior(limpio);
    document.getElementById('volver').classList.toggle('oculto', limpio === 'panel');
    if (['ayuda', 'archivo', 'usuarios'].includes(limpio) && !esAdmin()) {
        location.hash = '#/panel';
        return;
    }
    if (limpio.startsWith('m/')) {
        vistaModulo(limpio.slice(2));
    } else if (VISTAS[limpio]) {
        VISTAS[limpio]();
    } else {
        vistaProximo();
    }
}

// ============================================================
// Buscador universal (Ctrl/⌘ + K)
// ============================================================

let buscadorOpciones = [];
let buscadorIndice = 0;

function opcionesDeBusqueda() {
    const fijas = [
        { id: 'panel', icono: '📊', nombre: 'Panel', grupo: 'Principal' },
        { id: 'registros', icono: '🎬', nombre: 'Películas Libros', grupo: 'Utilidades' },
    ];
    if (esAdmin()) {
        fijas.push({ id: 'ayuda', icono: '💬', nombre: 'Ayuda', grupo: 'Administración' });
        fijas.push({ id: 'archivo', icono: '📁', nombre: 'Archivo', grupo: 'Administración' });
        fijas.push({ id: 'usuarios', icono: '🛡️', nombre: 'Usuarios', grupo: 'Administración' });
    }
    const deModulos = modulos.filter((m) => m.clave !== 'pelislibros').map((m) => ({ id: 'm/' + m.clave, icono: m.icono, nombre: m.nombre, grupo: 'Módulos' }));
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
            <span class="icono">${iconoDe(o.id, o.icono)}</span><span>${o.nombre}</span>
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
    // En pantallas táctiles no se enfoca (si no, salta el teclado al abrir «Más»)
    if (!window.matchMedia("(pointer: coarse)").matches) input.focus();
}

function cerrarBuscador() {
    document.getElementById('buscador-overlay').classList.add('oculto');
}

// ============================================================
// Tutoriales (solo la primera vez; se repiten desde Ayuda)
// ============================================================
const PASOS_TUTORIAL = [
    ['Tu panel', 'Esta es tu casa: cada recuadro es un módulo (Diario, Ahorros, Comidas…). Púlsalo y entrarás en él.']
];

const PASOS_COMIDAS = [
    ['Tu menú', 'Ideas te enseña lo que ya tienes y recetas rápidas; Comidas guarda tus platos; Despensa es tu alacena; Compra es la lista con super y precio.'],
    ['Tu nevera', 'Debajo del menú está tu nevera: todo lo que guardas con «En casa» sale dibujado ahí. Toca un dibujo y saltas a la despensa. Se repinta sola: si añades o borras comida, cambia al momento.'],
    ['Añadir y corregir', 'Cada sección tiene su formulario arriba: escribe y guarda. En cada fila encuentras Editar y Borrar.']
];

function abrirTutorial(pasos, claveFlag) {
    let paso = 0;
    const capa = document.createElement('div');
    capa.className = 'tut-overlay';
    const pintar = () => {
        const ultimo = paso === pasos.length - 1;
        capa.innerHTML = `
            <div class="tut-caja" role="dialog" aria-label="Tutorial">
                <p class="tut-paso">Paso ${paso + 1} de ${pasos.length}</p>
                <h3>${pasos[paso][0]}</h3>
                <p class="tut-texto">${pasos[paso][1]}</p>
                <div class="tut-botones">
                    <button class="boton-suave" data-tut="salir">Salir</button>
                    ${paso > 0 ? '<button class="boton-suave" data-tut="antes">Antes</button>' : ''}
                    <button class="boton-primario" data-tut="sigue">${ultimo ? '¡Listo!' : 'Siguiente'}</button>
                </div>
            </div>`;
    };
    const cerrar = () => {
        capa.remove();
        try { localStorage.setItem(claveFlag, 'visto'); } catch (e) { /* opcional */ }
    };
    capa.addEventListener('click', (ev) => {
        const b = ev.target.closest('[data-tut]');
        if (!b) return;
        if (b.dataset.tut === 'salir') return cerrar();
        if (b.dataset.tut === 'antes') { paso -= 1; pintar(); return; }
        if (paso === pasos.length - 1) return cerrar();
        paso += 1; pintar();
    });
    pintar();
    document.body.appendChild(capa);
}

function tutorialPrimeraVez(clave, pasos) {
    let visto = null;
    try { visto = localStorage.getItem(clave); } catch (e) { visto = 'visto'; }
    if (visto) return;
    setTimeout(() => abrirTutorial(pasos, clave), 700);
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

    pintarBarraInferior();
    window.addEventListener('hashchange', enrutar);
    enrutar();

    // Tutorial: solo la primera vez que se entra (se repite desde Ayuda)
    tutorialPrimeraVez('dasna-tutorial', PASOS_TUTORIAL);

    // El día pasa solo cuando cambia la fecha del dispositivo
    let diaEnPantalla = claveDia(new Date());
    setInterval(() => {
        const hoy = claveDia(new Date());
        if (hoy === diaEnPantalla) return;
        diaEnPantalla = hoy;
        registrosCal = null;   // el calendario del panel se refresca también
        if (location.hash.indexOf('/diario') !== -1) enrutar();
    }, 60000);

    // Recordatorio de las 22:00 para escribir el diario (si está activado)
    programarRecordatorioDiario();
    programarAvisosEstudio();
    programarAvisosViajes();
    programarAvisosAgua();

    // --- Tema claro/oscuro (icono de línea: sol o luna) ---
    const SVG_SOL = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
    const SVG_LUNA = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
    const btnTema = document.getElementById('btn-tema');
    const meta = document.getElementById('meta-tema');
    function aplicarTema(tema) {
        document.documentElement.dataset.tema = tema;
        btnTema.innerHTML = tema === 'oscuro' ? SVG_SOL : SVG_LUNA;
        meta.setAttribute('content', tema === 'oscuro' ? '#0b1a33' : '#23a6d5');
        try { localStorage.setItem('dasna-tema', tema); } catch (e) { /* opcional */ }
    }
    aplicarTema(document.documentElement.dataset.tema || 'claro');
    btnTema.addEventListener('click', () =>
        aplicarTema(document.documentElement.dataset.tema === 'oscuro' ? 'claro' : 'oscuro'));

    // --- Cerrar sesión ---
    document.getElementById('btn-salir').addEventListener('click', () => rest.cerrarSesionApp());

    // --- Buscador ---
    document.getElementById('btn-buscador').addEventListener('click', abrirBuscador);
    document.getElementById('buscador-input').addEventListener('input', (e) => pintarBuscador(e.target.value));
    document.getElementById('buscador-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'buscador-overlay') cerrarBuscador();
    });

    // Los menús del calendario del panel se cierran al tocar fuera
    document.addEventListener('click', (e) => {
        if (e.target.closest('.cal-pick') || e.target.closest('.cal-menu')) return;
        cerrarMenusCal();
    });

    document.addEventListener('keydown', (e) => {
        const escribiendo = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
        const abierto = !document.getElementById('buscador-overlay').classList.contains('oculto');

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            abierto ? cerrarBuscador() : abrirBuscador();
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
