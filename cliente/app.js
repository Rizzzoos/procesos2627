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
            { id: 'panel', icono: '📊', nombre: 'Panel' },
            { id: 'calendario', icono: '🗓️', nombre: 'Calendario' }
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
    const listas = await Promise.all(
        modulos.map((m) => rest.listarRegistros(m.clave).catch(() => ({ exito: false })))
    );
    registrosCal = [];
    listas.forEach((r, i) => {
        if (r && r.exito && Array.isArray(r.datos)) {
            r.datos.forEach((reg) => registrosCal.push({
                ...reg,
                clave: modulos[i].clave,
                icono: modulos[i].icono,
                nombre: modulos[i].nombre
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
    const texto = (typeof datos === 'object' ? (datos.titulo || datos.nota || datos.texto || datos.tarea) : datos) || JSON.stringify(datos);
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
        const puntos = delDia.slice(0, 3).map(() => '<i></i>').join('');
        html += `<button class="cal-dia${esHoy ? ' hoy' : ''}${k === calSel ? ' sel' : ''}" data-fecha="${k}">
            <span>${d}</span>${puntos ? `<span class="puntos">${puntos}</span>` : ''}</button>`;
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
            <span>${r.icono}</span>
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
        a.innerHTML = `<span class="caja-icono">${meta.icono}</span>
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

    cabecera(`${meta.icono} ${meta.nombre}`, meta.descripcion);
    const cont = document.getElementById('vista');
    cont.innerHTML = '<div class="skeleton"></div>';

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
            De momento este apartado está en construcción; el plan completo está en la vista
            <a class="enlace" href="#/ayuda">Ayuda</a>.</p>
        </div>`;
}

function vistaAyuda() {
    cabecera('💬 Ayuda', 'Cómo funciona Dasna.');
    document.getElementById('vista').innerHTML = `
        <div class="rejilla">
            <div class="tarjeta"><h3>⌨️ Atajos</h3><p><strong>Ctrl / ⌘ + K</strong>: buscador universal.<br>
            <strong>C</strong>: calendario (cuando esté disponible).<br>El tema claro/oscuro lo cambias con 🌙 arriba a la derecha.</p></div>
            <div class="tarjeta"><h3>🧱 Módulos</h3><p>Cada módulo guarda <em>registros</em> (JSON con fecha) en tu cuenta.
            Los recuadros con etiqueta de fase son las ideas planeadas que faltan por construir.</p></div>
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
    document.getElementById('volver').classList.toggle('oculto', limpio === 'panel');
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
        { id: 'calendario', icono: '🗓️', nombre: 'Calendario', grupo: 'Principal' },
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

    window.addEventListener('hashchange', enrutar);
    enrutar();

    // --- Tema claro/oscuro ---
    const btnTema = document.getElementById('btn-tema');
    const meta = document.getElementById('meta-tema');
    function aplicarTema(tema) {
        document.documentElement.dataset.tema = tema;
        btnTema.textContent = tema === 'oscuro' ? '☀️' : '🌙';
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
