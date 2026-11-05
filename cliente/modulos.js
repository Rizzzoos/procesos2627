// ============================================================
// DASNA — fichas propias de Películas Libros, Estudio, Gimnasio,
// Sueño y Visionboard. Usan las utilidades de app.js (rest, aviso,
// esc, claveDia, fechaCorta, comprimirImagen, svgLinea).
// ============================================================

// --- Utilidades comunes ---
function hoyClave() { return claveDia(new Date()); }

function desdeClaveDia(k) {
    const [a, m, d] = String(k).slice(0, 10).split('-').map(Number);
    return new Date(a, m - 1, d);
}

function sumarDias(k, n) {
    const f = desdeClaveDia(k);
    f.setDate(f.getDate() + n);
    return claveDia(f);
}

function diasHasta(k) {
    return Math.round((desdeClaveDia(k) - desdeClaveDia(hoyClave())) / 86400000);
}

function textoFaltan(n) {
    if (n === 0) return 'hoy';
    if (n === 1) return 'mañana';
    if (n < 0) return `hace ${-n} ${n === -1 ? 'día' : 'días'}`;
    return `en ${n} días`;
}

// Ventana flotante reutilizable (mismo cristal que el Recap del diario)
function abrirModal(titulo, html) {
    const capa = document.createElement('div');
    capa.className = 'recap-overlay';
    capa.innerHTML = `
        <div class="recap-caja tarjeta">
            <div class="recap-cabecera">
                <h3>${esc(titulo)}</h3>
                <button class="boton-suave" data-cerrar>Cerrar</button>
            </div>
            <div class="modal-cuerpo">${html}</div>
        </div>`;
    document.body.appendChild(capa);
    const cerrar = () => { capa.remove(); window.removeEventListener('hashchange', cerrar); };
    // Si cambias de apartado (barra inferior, buscador, atrás), la ventana se cierra
    window.addEventListener('hashchange', cerrar);
    capa.querySelector('[data-cerrar]').addEventListener('click', cerrar);
    capa.addEventListener('click', (e) => { if (e.target === capa) cerrar(); });
    return { caja: capa.querySelector('.modal-cuerpo'), cerrar };
}

// Foto -> dataURL pequeño (para guardarlo dentro del registro)
async function fotoADataUrl(archivo, maxLado = 800) {
    const { data, mime } = await comprimirImagen(archivo, maxLado);
    return `data:${mime};base64,${data}`;
}

async function listarOrdenado(clave) {
    const r = await rest.listarRegistros(clave);
    if (!r.exito) { aviso(r.error || 'No se pudo leer el módulo.', 'error'); return null; }
    return r.datos;
}

const SVG_MAS = svgLinea('<path d="M12 5v14"/><path d="M5 12h14"/>');

// ============================================================
// PELÍCULAS LIBROS: una estantería que se va llenando
// ============================================================
const EMOCIONES_LECTURA = ['😍', '🥰', '😂', '😊', '😌', '🤔', '🤯', '😱', '😢', '😭', '😡', '😴'];
const COLORES_LOMO = ['#ee7752', '#e73c7e', '#23a6d5', '#23d5ab', '#f59e0b', '#8b5cf6', '#0ea5e9', '#ec4899'];

function hashTexto(t) {
    let h = 0;
    for (const c of String(t)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h;
}

function estrellasHtml(n) {
    return '★'.repeat(Number(n) || 0) + '<span class="estrella-vacia">' + '★'.repeat(5 - (Number(n) || 0)) + '</span>';
}

async function fichaPelisLibros(cont) {
    let pestana = 'libro';
    cont.innerHTML = '';
    const env = document.createElement('div');
    env.className = 'ficha-propia';
    cont.appendChild(env);

    const render = async () => {
        env.innerHTML = '<div class="skeleton"></div>';
        const datos = await listarOrdenado('pelislibros');
        if (!datos) return;
        const items = datos
            .filter((x) => x.datos && (pestana === 'libro' ? x.datos.tipo === 'libro' : x.datos.tipo !== 'libro'))
            .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));

        // Baldas de 10 lomos; siempre al menos 3 baldas (aunque estén vacías)
        const porBalda = 10;
        const nBaldas = Math.max(3, Math.ceil(items.length / porBalda));
        let baldas = '';
        for (let i = 0; i < nBaldas; i++) {
            const trozo = items.slice(i * porBalda, (i + 1) * porBalda);
            baldas += `<div class="balda">${trozo.map((x) => {
                const h = hashTexto(x.datos.titulo);
                const alto = 78 + (h % 22);
                const color = COLORES_LOMO[h % COLORES_LOMO.length];
                return `<button class="lomo ${pestana === 'libro' ? '' : 'lomo-peli'}" data-id="${x.id}" style="height:${alto}%;background:${color}" title="${esc(x.datos.titulo)}">
                    <span class="lomo-titulo">${esc(x.datos.titulo)}</span>
                    <span class="lomo-estrellas">${'★'.repeat(Number(x.datos.estrellas) || 0)}</span>
                </button>`;
            }).join('')}</div>`;
        }

        env.innerHTML = `
            <div class="tarjeta estante-cab">
                <div class="periodo-toggle">
                    <button type="button" data-pest="libro" class="${pestana === 'libro' ? 'activo' : ''}">Libros</button>
                    <button type="button" data-pest="peli" class="${pestana === 'peli' ? 'activo' : ''}">Películas y series</button>
                </div>
                <p class="pista" style="margin:0">${items.length} ${pestana === 'libro' ? (items.length === 1 ? 'libro leído' : 'libros leídos') : (items.length === 1 ? 'vista' : 'vistas')}</p>
                <button class="boton-primario boton-icono" id="pl-nuevo">${SVG_MAS} Añadir</button>
            </div>
            <div class="tarjeta estanteria">${baldas}</div>`;

        env.querySelectorAll('[data-pest]').forEach((b) => b.addEventListener('click', () => {
            pestana = b.dataset.pest;
            render();
        }));
        env.querySelector('#pl-nuevo').addEventListener('click', () => formulario(null));
        env.querySelectorAll('.lomo').forEach((b) => b.addEventListener('click', () => {
            const reg = items.find((x) => x.id === b.dataset.id);
            if (reg) verFicha(reg);
        }));
    };

    const verFicha = (reg) => {
        const d = reg.datos;
        const esLibro = d.tipo === 'libro';
        const m = abrirModal(d.titulo, `
            <p class="pista" style="margin-top:0">${esLibro ? esc(d.autor || 'Autor sin indicar') : (d.tipo === 'serie' ? 'Serie' : 'Película')} · ${fechaCorta(reg.fecha)}</p>
            <p class="ficha-estrellas">${estrellasHtml(d.estrellas)}</p>
            ${d.emociones ? `<p class="ficha-emociones">${esc(d.emociones)}</p>` : ''}
            <p>${d.gusta === 'si' ? 'Te ha gustado' : d.gusta === 'no' ? 'No te ha gustado' : ''}</p>
            ${d.favorito ? `<p class="recap-dato"><strong>Lo que más te ha gustado:</strong> ${esc(d.favorito)}</p>` : ''}
            <div class="fila-botones">
                <button class="boton-suave" data-editar>Editar</button>
                <button class="boton-peligro" data-borrar>Borrar</button>
            </div>`);
        m.caja.querySelector('[data-editar]').addEventListener('click', () => { m.cerrar(); formulario(reg); });
        m.caja.querySelector('[data-borrar]').addEventListener('click', async () => {
            const res = await rest.borrarRegistro('pelislibros', reg.id);
            if (!res.exito) return aviso(res.error || 'No se pudo borrar.', 'error');
            m.cerrar();
            aviso('Quitado de la estantería');
            render();
        });
    };

    const formulario = (reg) => {
        const d = (reg && reg.datos) || { tipo: pestana === 'libro' ? 'libro' : 'pelicula' };
        const esLibro = d.tipo === 'libro';
        const elegidas = new Set(EMOCIONES_LECTURA.filter((e) => String(d.emociones || '').includes(e)));
        let estrellas = Number(d.estrellas) || 0;
        let gusta = d.gusta || '';
        const m = abrirModal(reg ? 'Editar' : (esLibro ? 'Nuevo libro' : 'Nueva película o serie'), `
            ${esLibro ? '' : `
                <label class="etiqueta">Tipo</label>
                <div class="periodo-toggle" id="pl-tipo">
                    <button type="button" data-v="pelicula" class="${d.tipo !== 'serie' ? 'activo' : ''}">Película</button>
                    <button type="button" data-v="serie" class="${d.tipo === 'serie' ? 'activo' : ''}">Serie</button>
                </div>`}
            <label class="etiqueta" style="margin-top:0.8rem">${esLibro ? 'Nombre del libro' : 'Título'}</label>
            <input class="entrada" id="pl-titulo" value="${esc(d.titulo)}" autocomplete="off">
            ${esLibro ? `<label class="etiqueta" style="margin-top:0.8rem">Autor</label>
            <input class="entrada" id="pl-autor" value="${esc(d.autor)}" autocomplete="off">` : ''}
            <label class="etiqueta" style="margin-top:0.8rem">¿Cómo te has sentido? ¿Qué te ha hecho sentir?</label>
            <div class="humor humor-multi" id="pl-emo">
                ${EMOCIONES_LECTURA.map((e) => `<button type="button" data-e="${e}" class="${elegidas.has(e) ? 'activo' : ''}">${e}</button>`).join('')}
            </div>
            <label class="etiqueta" style="margin-top:0.8rem">¿Te ha gustado?</label>
            <div class="periodo-toggle" id="pl-gusta">
                <button type="button" data-v="si" class="${gusta === 'si' ? 'activo' : ''}">Sí</button>
                <button type="button" data-v="no" class="${gusta === 'no' ? 'activo' : ''}">No</button>
            </div>
            <label class="etiqueta" style="margin-top:0.8rem">Puntuación</label>
            <div class="estrellas-elegir" id="pl-estrellas">
                ${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-n="${n}" class="${n <= estrellas ? 'activo' : ''}" aria-label="${n} estrellas">★</button>`).join('')}
            </div>
            ${esLibro ? '' : `<label class="etiqueta" style="margin-top:0.8rem">Lo que más te ha gustado</label>
            <textarea class="entrada" id="pl-favorito" rows="3">${esc(d.favorito)}</textarea>`}
            <label class="etiqueta" style="margin-top:0.8rem">${esLibro ? 'Terminado el' : 'Vista el'}</label>
            <input class="entrada" id="pl-fecha" type="date" value="${reg ? claveDia(reg.fecha) : hoyClave()}" style="max-width:200px">
            <div class="fila-botones"><button class="boton-primario" id="pl-guardar">Guardar</button></div>`);
        const c = m.caja;
        let tipo = d.tipo;
        c.querySelectorAll('#pl-tipo button').forEach((b) => b.addEventListener('click', () => {
            c.querySelectorAll('#pl-tipo button').forEach((x) => x.classList.toggle('activo', x === b));
            tipo = b.dataset.v;
        }));
        c.querySelectorAll('#pl-emo button').forEach((b) => b.addEventListener('click', () => {
            if (elegidas.has(b.dataset.e)) elegidas.delete(b.dataset.e); else elegidas.add(b.dataset.e);
            b.classList.toggle('activo');
        }));
        c.querySelectorAll('#pl-gusta button').forEach((b) => b.addEventListener('click', () => {
            gusta = b.dataset.v;
            c.querySelectorAll('#pl-gusta button').forEach((x) => x.classList.toggle('activo', x === b));
        }));
        c.querySelectorAll('#pl-estrellas button').forEach((b) => b.addEventListener('click', () => {
            estrellas = Number(b.dataset.n);
            c.querySelectorAll('#pl-estrellas button').forEach((x) => x.classList.toggle('activo', Number(x.dataset.n) <= estrellas));
        }));
        c.querySelector('#pl-guardar').addEventListener('click', async () => {
            const titulo = c.querySelector('#pl-titulo').value.trim();
            if (!titulo) return aviso('Ponle un título.', 'error');
            const nuevo = {
                tipo,
                titulo,
                autor: esLibro ? c.querySelector('#pl-autor').value.trim() : undefined,
                emociones: [...elegidas].join(''),
                gusta,
                estrellas,
                favorito: esLibro ? undefined : c.querySelector('#pl-favorito').value.trim()
            };
            const fecha = c.querySelector('#pl-fecha').value || hoyClave();
            const res = await guardarConFecha('pelislibros', reg, nuevo, fecha);
            if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
            m.cerrar();
            aviso(reg ? 'Guardado' : 'A la estantería');
            render();
        });
    };

    await render();
}

// Actualizar sin cambiar el día, o volver a crear si el día cambia
// (el servidor solo actualiza los datos, no la fecha del registro)
async function guardarConFecha(clave, reg, datos, fecha) {
    if (!reg) return rest.crearRegistro(clave, datos, fecha);
    if (claveDia(reg.fecha) === fecha) return rest.actualizarRegistro(clave, reg.id, datos);
    const res = await rest.crearRegistro(clave, datos, fecha);
    if (res.exito) await rest.borrarRegistro(clave, reg.id);
    return res;
}

// ============================================================
// ESTUDIO: exámenes, deberes, prácticas y tareas + recordatorios
// + planificación de temas para los exámenes
// ============================================================
const TIPOS_ESTUDIO = [['examen', 'Examen'], ['deberes', 'Deberes'], ['practica', 'Práctica'], ['tarea', 'Tarea']];
const NOMBRE_TIPO_ESTUDIO = Object.fromEntries(TIPOS_ESTUDIO);

// Reparte los temas en los días que quedan antes del examen.
// El último día antes del examen se deja para repaso general.
function planificarTemas(temas, fechaExamen, horasDia) {
    const inicio = hoyClave();
    const ultimo = sumarDias(fechaExamen, -1);
    const dias = [];
    for (let k = inicio; k < ultimo; k = sumarDias(k, 1)) dias.push(k);
    const total = temas.reduce((s, t) => s + (Number(t.horas) || 0), 0);
    const plan = [];
    if (!dias.length) return { plan: [{ dia: inicio, texto: 'Repaso general' }], falta: total };
    let iDia = 0;
    let libre = horasDia;
    for (const t of temas) {
        let resto = Number(t.horas) || 0;
        while (resto > 0.01 && iDia < dias.length) {
            const toca = Math.min(resto, libre);
            plan.push({ dia: dias[iDia], texto: `${t.nombre} (${String(Math.round(toca * 10) / 10).replace('.', ',')} h)` });
            resto -= toca;
            libre -= toca;
            if (libre <= 0.01) { iDia++; libre = horasDia; }
        }
    }
    const capacidad = dias.length * horasDia;
    plan.push({ dia: ultimo, texto: 'Repaso general' });
    // Juntar las líneas del mismo día
    const porDia = new Map();
    for (const p of plan) porDia.set(p.dia, [...(porDia.get(p.dia) || []), p.texto]);
    return {
        plan: [...porDia].map(([dia, textos]) => ({ dia, texto: textos.join(' · ') })),
        falta: Math.max(0, total - capacidad)
    };
}

// Avisos de Estudio: si hay permiso de notificaciones, a las 9:00
// del día de cada recordatorio (mientras la app esté abierta)
let temporizadoresEstudio = [];
async function programarAvisosEstudio(lista) {
    temporizadoresEstudio.forEach(clearTimeout);
    temporizadoresEstudio = [];
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    let activo = false;
    try { activo = localStorage.getItem('dasna-avisos-estudio') === 'si'; } catch (e) { /* opcional */ }
    if (!activo) return;
    if (!lista) {
        const r = await rest.listarRegistros('estudio').catch(() => null);
        if (!r || !r.exito) return;
        lista = r.datos;
    }
    const ahora = Date.now();
    for (const a of avisosDe(lista)) {
        const cuando = desdeClaveDia(a.dia);
        cuando.setHours(9, 0, 0, 0);
        const ms = cuando - ahora;
        if (ms > 0 && ms < 2147483647) {
            temporizadoresEstudio.push(setTimeout(() => enviarNotificacion('Dasna · Estudio', a.texto), ms));
        }
    }
}

// Todos los avisos (recordatorios + días del plan + la propia entrega)
function avisosDe(lista) {
    const out = [];
    for (const x of lista) {
        const d = x.datos || {};
        const fecha = claveDia(x.fecha);
        const nombre = `${NOMBRE_TIPO_ESTUDIO[d.tipo] || 'Tarea'}: ${d.titulo || ''}${d.asignatura ? ' (' + d.asignatura + ')' : ''}`;
        out.push({ dia: fecha, texto: nombre, entrega: true });
        for (const r of d.recordatorios || []) out.push({ dia: r.dia, texto: `${r.texto || 'Recordatorio'} · ${nombre}` });
        for (const p of d.plan || []) out.push({ dia: p.dia, texto: `Estudiar ${d.titulo}: ${p.texto}` });
    }
    return out.sort((a, b) => a.dia.localeCompare(b.dia));
}

async function fichaEstudio(cont) {
    cont.innerHTML = '';
    const env = document.createElement('div');
    env.className = 'ficha-propia';
    cont.appendChild(env);
    let abierto = null;

    const render = async () => {
        env.innerHTML = '<div class="skeleton"></div>';
        const lista = await listarOrdenado('estudio');
        if (!lista) return;
        programarAvisosEstudio(lista);
        const hoy = hoyClave();
        const ordenadas = lista.slice().sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
        const futuras = ordenadas.filter((x) => claveDia(x.fecha) >= hoy);
        const pasadas = ordenadas.filter((x) => claveDia(x.fecha) < hoy).reverse();
        const proximos = avisosDe(lista).filter((a) => a.dia >= hoy && a.dia <= sumarDias(hoy, 7));
        let avisosOn = false;
        try { avisosOn = localStorage.getItem('dasna-avisos-estudio') === 'si'; } catch (e) { /* opcional */ }

        const fila = (x) => {
            const d = x.datos || {};
            const f = claveDia(x.fecha);
            const n = diasHasta(f);
            return `
                <div class="est-item ${abierto === x.id ? 'abierto' : ''}">
                    <button class="est-fila" data-abrir="${x.id}">
                        <span class="chip">${NOMBRE_TIPO_ESTUDIO[d.tipo] || 'Tarea'}</span>
                        <span class="est-nombre">${esc(d.titulo)}${d.asignatura ? ` <small>· ${esc(d.asignatura)}</small>` : ''}</span>
                        <span class="est-cuando ${n >= 0 && n <= 3 ? 'cerca' : ''}">${fechaCorta(f)} · ${textoFaltan(n)}</span>
                    </button>
                    ${abierto === x.id ? `
                        <div class="est-detalle">
                            ${(d.recordatorios || []).length ? `<p class="etiqueta">Recordatorios</p><ul class="est-lista">${d.recordatorios.map((r) => `<li><strong>${fechaCorta(r.dia)}</strong> · ${esc(r.texto)}</li>`).join('')}</ul>` : ''}
                            ${(d.plan || []).length ? `<p class="etiqueta">Planificación</p><ul class="est-lista">${d.plan.map((p) => `<li class="${p.dia < hoy ? 'pasado' : ''}"><strong>${fechaCorta(p.dia)}</strong> · ${esc(p.texto)}</li>`).join('')}</ul>` : ''}
                            ${d.notas ? `<p class="recap-dato">${esc(d.notas)}</p>` : ''}
                            <div class="fila-botones">
                                <button class="boton-suave" data-editar="${x.id}">Editar</button>
                                <button class="boton-peligro" data-borrar="${x.id}">Borrar</button>
                            </div>
                        </div>` : ''}
                </div>`;
        };

        env.innerHTML = `
            <div class="tarjeta">
                <div class="ev-alta">
                    <input class="entrada" id="est-dictar" placeholder="Ej: tengo examen de Procesos el 12 de diciembre" autocomplete="off">
                    <button class="boton-suave boton-voz" id="est-voz" title="Dictar" aria-label="Dictar">${SVG_MICRO}</button>
                    <button class="boton-primario" id="est-dictar-ok">Seguir</button>
                </div>
            </div>
            <div class="dos-flex">
                <div class="tarjeta">
                    <h3>Próximos 7 días</h3>
                    ${proximos.length ? `<ul class="est-lista">${proximos.map((a) => `<li class="${a.entrega ? 'entrega' : ''}"><strong>${textoFaltan(diasHasta(a.dia))}</strong> · ${esc(a.texto)}</li>`).join('')}</ul>`
                        : '<p class="pista">Nada a la vista esta semana.</p>'}
                    <div class="fila-botones">
                        <button class="boton-suave" id="est-avisos">${avisosOn ? 'Avisos activados (9:00)' : 'Activar avisos (9:00)'}</button>
                    </div>
                </div>
                <div class="tarjeta">
                    <div class="recap-cabecera"><h3>Pendientes</h3><button class="boton-primario boton-icono" id="est-nuevo">${SVG_MAS} Añadir</button></div>
                    <div class="est-items">${futuras.length ? futuras.map(fila).join('') : '<p class="pista">No tienes nada pendiente.</p>'}</div>
                </div>
            </div>
            ${pasadas.length ? `<div class="tarjeta"><h3>Ya pasados</h3><div class="est-items">${pasadas.map(fila).join('')}</div></div>` : ''}`;

        env.querySelector('#est-nuevo').addEventListener('click', () => formulario(null));
        const dictar = env.querySelector('#est-dictar');
        const desdeTexto = () => {
            const t = dictar.value.trim();
            if (!t) return aviso('Escribe o dicta qué tienes.', 'error');
            formulario(null, interpretarEstudio(t));
        };
        dictar.addEventListener('keydown', (e) => { if (e.key === 'Enter') desdeTexto(); });
        env.querySelector('#est-dictar-ok').addEventListener('click', desdeTexto);
        botonVoz(env.querySelector('#est-voz'), dictar, () => desdeTexto());
        env.querySelectorAll('[data-abrir]').forEach((b) => b.addEventListener('click', () => {
            abierto = abierto === b.dataset.abrir ? null : b.dataset.abrir;
            render();
        }));
        env.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () =>
            formulario(lista.find((x) => x.id === b.dataset.editar))));
        env.querySelectorAll('[data-borrar]').forEach((b) => b.addEventListener('click', async () => {
            const res = await rest.borrarRegistro('estudio', b.dataset.borrar);
            if (!res.exito) return aviso(res.error || 'No se pudo borrar.', 'error');
            aviso('Borrado');
            render();
        }));
        env.querySelector('#est-avisos').addEventListener('click', async () => {
            if (!('Notification' in window)) return aviso('Este navegador no soporta notificaciones.', 'error');
            let permiso = Notification.permission;
            if (permiso === 'default') permiso = await Notification.requestPermission();
            if (permiso !== 'granted') return aviso('Sin permiso de notificaciones.', 'error');
            try { localStorage.setItem('dasna-avisos-estudio', avisosOn ? 'no' : 'si'); } catch (e) { /* opcional */ }
            aviso(avisosOn ? 'Avisos apagados' : 'Te avisaré a las 9:00 los días con recordatorio');
            render();
        });
    };

    const formulario = (reg, pre = null) => {
        const d = (reg && reg.datos) || (pre ? { tipo: pre.tipo, titulo: pre.titulo, asignatura: pre.asignatura } : { tipo: 'examen' });
        let tipo = d.tipo;
        let recordatorios = (d.recordatorios || []).slice();
        let temas = (d.temas || []).slice();
        let plan = (d.plan || []).slice();
        const m = abrirModal(reg ? 'Editar' : 'Añadir', `
            <label class="etiqueta">Tipo</label>
            <div class="periodo-toggle" id="es-tipo">
                ${TIPOS_ESTUDIO.map(([v, t]) => `<button type="button" data-v="${v}" class="${tipo === v ? 'activo' : ''}">${t}</button>`).join('')}
            </div>
            <div class="est-form-dos">
                <div><label class="etiqueta">Título</label><input class="entrada" id="es-titulo" value="${esc(d.titulo)}" placeholder="Ej: Parcial 1" autocomplete="off"></div>
                <div><label class="etiqueta">Asignatura</label><input class="entrada" id="es-asig" value="${esc(d.asignatura)}" placeholder="Ej: Procesos" autocomplete="off"></div>
                <div><label class="etiqueta" id="es-fecha-lbl">Fecha</label><input class="entrada" id="es-fecha" type="date" value="${reg ? claveDia(reg.fecha) : (pre && pre.fecha > hoyClave() ? pre.fecha : sumarDias(hoyClave(), 7))}"></div>
            </div>
            <label class="etiqueta" style="margin-top:0.9rem">Recordatorios</label>
            <div class="est-rapidos">
                <button type="button" class="boton-suave" data-antes="1">1 día antes</button>
                <button type="button" class="boton-suave" data-antes="3">3 días antes</button>
                <button type="button" class="boton-suave" data-antes="7">1 semana antes</button>
                <button type="button" class="boton-suave" data-antes="14">2 semanas antes</button>
            </div>
            <div class="est-rec-alta">
                <input class="entrada" id="es-rec-dia" type="date">
                <input class="entrada" id="es-rec-texto" placeholder="Ej: empezar a repasar" autocomplete="off">
                <button type="button" class="boton-suave" id="es-rec-add">Añadir</button>
            </div>
            <ul class="est-lista" id="es-recs"></ul>
            <div id="es-temas-zona"></div>
            <label class="etiqueta" style="margin-top:0.9rem">Notas</label>
            <textarea class="entrada" id="es-notas" rows="2">${esc(d.notas)}</textarea>
            <div class="fila-botones"><button class="boton-primario" id="es-guardar">Guardar</button></div>`);
        const c = m.caja;
        const fechaVal = () => c.querySelector('#es-fecha').value;

        const pintarRecs = () => {
            recordatorios.sort((a, b) => a.dia.localeCompare(b.dia));
            c.querySelector('#es-recs').innerHTML = recordatorios.map((r, i) =>
                `<li><strong>${fechaCorta(r.dia)}</strong> · ${esc(r.texto)} <button type="button" class="com-x" data-quitar-rec="${i}" aria-label="Quitar">✕</button></li>`).join('');
            c.querySelectorAll('[data-quitar-rec]').forEach((b) => b.addEventListener('click', () => {
                recordatorios.splice(Number(b.dataset.quitarRec), 1);
                pintarRecs();
            }));
        };
        const pintarTemas = () => {
            const zona = c.querySelector('#es-temas-zona');
            if (tipo !== 'examen') { zona.innerHTML = ''; return; }
            const total = temas.reduce((s, t) => s + (Number(t.horas) || 0), 0);
            zona.innerHTML = `
                <label class="etiqueta" style="margin-top:0.9rem">Temas del examen</label>
                <div class="est-temas">${temas.map((t, i) => `
                    <div class="est-tema">
                        <input class="entrada" data-tema-nombre="${i}" value="${esc(t.nombre)}" placeholder="Tema ${i + 1}">
                        <input class="entrada" data-tema-horas="${i}" type="number" min="0.5" step="0.5" value="${t.horas}" title="Horas que tardas">
                        <span class="pista">h</span>
                        <button type="button" class="com-x" data-quitar-tema="${i}" aria-label="Quitar">✕</button>
                    </div>`).join('')}
                </div>
                <div class="est-rec-alta">
                    <button type="button" class="boton-suave" id="es-tema-add">Añadir tema</button>
                    <span class="pista">Total: ${String(total).replace('.', ',')} h · Horas al día</span>
                    <input class="entrada" id="es-horas-dia" type="number" min="0.5" step="0.5" value="${d.horasDia || 2}" style="max-width:90px">
                    <button type="button" class="boton-primario" id="es-planificar" ${temas.length ? '' : 'disabled'}>Planificar</button>
                </div>
                <ul class="est-lista" id="es-plan">${plan.map((p) => `<li><strong>${fechaCorta(p.dia)}</strong> · ${esc(p.texto)}</li>`).join('')}</ul>`;
            zona.querySelectorAll('[data-tema-nombre]').forEach((inp) => inp.addEventListener('input', () => { temas[Number(inp.dataset.temaNombre)].nombre = inp.value; }));
            zona.querySelectorAll('[data-tema-horas]').forEach((inp) => inp.addEventListener('change', () => { temas[Number(inp.dataset.temaHoras)].horas = Number(inp.value) || 0; pintarTemas(); }));
            zona.querySelectorAll('[data-quitar-tema]').forEach((b) => b.addEventListener('click', () => { temas.splice(Number(b.dataset.quitarTema), 1); pintarTemas(); }));
            zona.querySelector('#es-tema-add').addEventListener('click', () => { temas.push({ nombre: `Tema ${temas.length + 1}`, horas: 2 }); pintarTemas(); });
            zona.querySelector('#es-planificar').addEventListener('click', () => {
                const horasDia = Number(zona.querySelector('#es-horas-dia').value) || 2;
                d.horasDia = horasDia;
                if (!fechaVal() || fechaVal() <= hoyClave()) return aviso('Pon una fecha de examen futura.', 'error');
                const res = planificarTemas(temas.map((t, i) => ({ nombre: t.nombre || `Tema ${i + 1}`, horas: t.horas })), fechaVal(), horasDia);
                plan = res.plan;
                pintarTemas();
                if (res.falta > 0) aviso(`No da tiempo: faltan ${String(res.falta).replace('.', ',')} h. Sube las horas al día.`, 'error');
            });
        };

        c.querySelectorAll('#es-tipo button').forEach((b) => b.addEventListener('click', () => {
            tipo = b.dataset.v;
            c.querySelectorAll('#es-tipo button').forEach((x) => x.classList.toggle('activo', x === b));
            pintarTemas();
        }));
        c.querySelectorAll('[data-antes]').forEach((b) => b.addEventListener('click', () => {
            if (!fechaVal()) return aviso('Pon primero la fecha.', 'error');
            const dia = sumarDias(fechaVal(), -Number(b.dataset.antes));
            if (dia < hoyClave()) return aviso('Esa fecha ya ha pasado.', 'error');
            recordatorios.push({ dia, texto: tipo === 'examen' ? 'Repasar' : 'Ponerse con ello' });
            pintarRecs();
        }));
        c.querySelector('#es-rec-add').addEventListener('click', () => {
            const dia = c.querySelector('#es-rec-dia').value;
            const texto = c.querySelector('#es-rec-texto').value.trim() || 'Recordatorio';
            if (!dia) return aviso('Elige el día del recordatorio.', 'error');
            recordatorios.push({ dia, texto });
            c.querySelector('#es-rec-texto').value = '';
            pintarRecs();
        });
        c.querySelector('#es-guardar').addEventListener('click', async () => {
            const titulo = c.querySelector('#es-titulo').value.trim();
            if (!titulo) return aviso('Ponle un título.', 'error');
            if (!fechaVal()) return aviso('Pon la fecha.', 'error');
            const datos = {
                tipo,
                titulo,
                asignatura: c.querySelector('#es-asig').value.trim(),
                recordatorios,
                temas: tipo === 'examen' ? temas : [],
                plan: tipo === 'examen' ? plan : [],
                horasDia: d.horasDia || 2,
                notas: c.querySelector('#es-notas').value.trim()
            };
            const res = await guardarConFecha('estudio', reg, datos, fechaVal());
            if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
            m.cerrar();
            if (typeof registrosCal !== 'undefined') registrosCal = null;   // que el calendario del panel lo vea
            aviso('Guardado');
            render();
        });
        pintarRecs();
        pintarTemas();
    };

    await render();
}

// ============================================================
// GIMNASIO: rutinas (con sus máquinas y pesos) y días que vas
// ============================================================
async function fichaGimnasio(cont) {
    let pestana = 'hoy';
    cont.innerHTML = '';
    const env = document.createElement('div');
    env.className = 'ficha-propia';
    cont.appendChild(env);

    const render = async () => {
        env.innerHTML = '<div class="skeleton"></div>';
        const lista = await listarOrdenado('gimnasio');
        if (!lista) return;
        const rutinas = lista.filter((x) => x.datos && x.datos.tipo === 'rutina');
        const sesiones = lista.filter((x) => x.datos && x.datos.tipo === 'sesion')
            .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
        const mes = hoyClave().slice(0, 7);
        const diasMes = new Set(sesiones.filter((s) => claveDia(s.fecha).startsWith(mes)).map((s) => claveDia(s.fecha))).size;

        let cuerpo = '';
        if (pestana === 'hoy') {
            cuerpo = rutinas.length ? `
                <div class="tarjeta">
                    <h3>¿Qué has hecho hoy?</h3>
                    <div class="est-form-dos">
                        <div><label class="etiqueta">Rutina</label>
                            <select class="entrada" id="gy-rutina">${rutinas.map((r) => `<option value="${r.id}">${esc(r.datos.nombre)}</option>`).join('')}</select></div>
                        <div><label class="etiqueta">Día</label><input class="entrada" id="gy-dia" type="date" value="${hoyClave()}"></div>
                    </div>
                    <div id="gy-ejercicios"></div>
                    <label class="etiqueta" style="margin-top:0.9rem">Notas</label>
                    <input class="entrada" id="gy-nota" placeholder="Ej: me ha costado la última serie" autocomplete="off">
                    <div class="fila-botones"><button class="boton-primario" id="gy-guardar">Guardar entreno</button></div>
                </div>`
                : '<div class="tarjeta"><p class="pista" style="margin:0">Primero crea una rutina en «Rutinas» (por ejemplo, Pierna con sus máquinas).</p></div>';
        } else if (pestana === 'rutinas') {
            cuerpo = `
                <div class="tarjeta">
                    <div class="recap-cabecera"><h3>Tus rutinas</h3><button class="boton-primario boton-icono" id="gy-nueva">${SVG_MAS} Nueva rutina</button></div>
                </div>
                <div class="rejilla">${rutinas.map((r) => `
                    <div class="tarjeta">
                        <h3>${esc(r.datos.nombre)}</h3>
                        <table class="tabla gy-tabla"><thead><tr><th>Máquina / ejercicio</th><th>Series</th><th>Repes</th><th>Peso</th></tr></thead>
                        <tbody>${(r.datos.ejercicios || []).map((e) => `<tr><td>${esc(e.maquina)}</td><td>${esc(e.series)}</td><td>${esc(e.repes)}</td><td>${e.peso ? esc(e.peso) + ' kg' : '—'}</td></tr>`).join('')}</tbody></table>
                        <div class="fila-botones">
                            <button class="boton-suave" data-editar="${r.id}">Editar</button>
                            <button class="boton-peligro" data-borrar="${r.id}">Borrar</button>
                        </div>
                    </div>`).join('') || '<p class="pista">Aún no tienes rutinas.</p>'}</div>`;
        } else {
            cuerpo = `
                <div class="tarjeta">
                    <h3>Días que has ido</h3>
                    ${sesiones.length ? `<div class="ahorro-lista">${sesiones.map((s) => `
                        <div class="ahorro-fila gy-sesion">
                            <span class="ahorro-fecha">${fechaCorta(s.fecha)}</span>
                            <span class="ahorro-concepto" title="${esc((s.datos.ejercicios || []).map((e) => `${e.maquina} ${e.series}x${e.repes} ${e.peso || 0} kg`).join(' · '))}">
                                <strong>${esc(s.datos.rutina)}</strong> · ${(s.datos.ejercicios || []).map((e) => `${esc(e.maquina)} ${e.peso ? esc(e.peso) + ' kg' : ''}`).join(' · ')}${s.datos.nota ? ' · ' + esc(s.datos.nota) : ''}
                            </span>
                            <button class="boton-peligro" data-borrar="${s.id}">Borrar</button>
                        </div>`).join('')}</div>` : '<p class="pista">Todavía no has registrado ningún día.</p>'}
                </div>`;
        }

        env.innerHTML = `
            <div class="tarjeta estante-cab">
                <div class="periodo-toggle">
                    <button type="button" data-pest="hoy" class="${pestana === 'hoy' ? 'activo' : ''}">Hoy</button>
                    <button type="button" data-pest="rutinas" class="${pestana === 'rutinas' ? 'activo' : ''}">Rutinas</button>
                    <button type="button" data-pest="historial" class="${pestana === 'historial' ? 'activo' : ''}">Historial</button>
                </div>
                <p class="pista" style="margin:0">Este mes has ido <strong>${diasMes}</strong> ${diasMes === 1 ? 'día' : 'días'}</p>
            </div>
            ${cuerpo}`;

        env.querySelectorAll('[data-pest]').forEach((b) => b.addEventListener('click', () => { pestana = b.dataset.pest; render(); }));
        env.querySelectorAll('[data-borrar]').forEach((b) => b.addEventListener('click', async () => {
            const res = await rest.borrarRegistro('gimnasio', b.dataset.borrar);
            if (!res.exito) return aviso(res.error || 'No se pudo borrar.', 'error');
            aviso('Borrado');
            render();
        }));
        env.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () =>
            formRutina(rutinas.find((r) => r.id === b.dataset.editar))));
        const btnNueva = env.querySelector('#gy-nueva');
        if (btnNueva) btnNueva.addEventListener('click', () => formRutina(null));

        // Registrar el entreno de hoy (con los pesos de la rutina ya puestos)
        const sel = env.querySelector('#gy-rutina');
        if (sel) {
            const pintarEj = () => {
                const r = rutinas.find((x) => x.id === sel.value);
                env.querySelector('#gy-ejercicios').innerHTML = `
                    <table class="tabla gy-tabla"><thead><tr><th></th><th>Máquina / ejercicio</th><th>Series</th><th>Repes</th><th>Peso (kg)</th></tr></thead>
                    <tbody>${(r.datos.ejercicios || []).map((e, i) => `
                        <tr data-fila="${i}">
                            <td><input type="checkbox" checked data-hecho></td>
                            <td>${esc(e.maquina)}</td>
                            <td><input class="entrada gy-num" type="number" min="0" value="${esc(e.series)}" data-c="series"></td>
                            <td><input class="entrada gy-num" type="number" min="0" value="${esc(e.repes)}" data-c="repes"></td>
                            <td><input class="entrada gy-num" type="number" min="0" step="0.5" value="${esc(e.peso)}" data-c="peso"></td>
                        </tr>`).join('')}</tbody></table>
                    <p class="pista">Si cambias un peso, se actualiza también en la rutina.</p>`;
            };
            sel.addEventListener('change', pintarEj);
            pintarEj();
            env.querySelector('#gy-guardar').addEventListener('click', async () => {
                const r = rutinas.find((x) => x.id === sel.value);
                const filas = [...env.querySelectorAll('[data-fila]')];
                const hechos = [];
                const ejerciciosRutina = (r.datos.ejercicios || []).map((e, i) => {
                    const f = filas[i];
                    const val = (c) => f.querySelector(`[data-c="${c}"]`).value;
                    const nuevo = { ...e, series: val('series'), repes: val('repes'), peso: val('peso') };
                    if (f.querySelector('[data-hecho]').checked) hechos.push(nuevo);
                    return nuevo;
                });
                if (!hechos.length) return aviso('Marca al menos un ejercicio.', 'error');
                const res = await rest.crearRegistro('gimnasio', {
                    tipo: 'sesion', rutinaId: r.id, rutina: r.datos.nombre, ejercicios: hechos,
                    nota: env.querySelector('#gy-nota').value.trim()
                }, env.querySelector('#gy-dia').value || hoyClave());
                if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
                if (JSON.stringify(ejerciciosRutina) !== JSON.stringify(r.datos.ejercicios)) {
                    await rest.actualizarRegistro('gimnasio', r.id, { ...r.datos, ejercicios: ejerciciosRutina });
                }
                if (typeof registrosCal !== 'undefined') registrosCal = null;
                aviso('Entreno guardado');
                pestana = 'historial';
                render();
            });
        }
    };

    const formRutina = (reg) => {
        const d = (reg && reg.datos) || { nombre: '', ejercicios: [{ maquina: '', series: 3, repes: 12, peso: '' }] };
        const ejercicios = d.ejercicios.map((e) => ({ ...e }));
        const m = abrirModal(reg ? 'Editar rutina' : 'Nueva rutina', `
            <label class="etiqueta">Nombre</label>
            <input class="entrada" id="gr-nombre" value="${esc(d.nombre)}" placeholder="Ej: Pierna" autocomplete="off">
            <label class="etiqueta" style="margin-top:0.9rem">Máquinas / ejercicios</label>
            <div id="gr-lista"></div>
            <div class="fila-botones">
                <button type="button" class="boton-suave" id="gr-add">Añadir ejercicio</button>
                <button class="boton-primario" id="gr-guardar">Guardar rutina</button>
            </div>`);
        const c = m.caja;
        const pintar = () => {
            c.querySelector('#gr-lista').innerHTML = `
                <div class="gr-fila gr-cab pista"><span>Máquina</span><span>Series</span><span>Repes</span><span>Peso kg</span><span></span></div>
                ${ejercicios.map((e, i) => `
                <div class="gr-fila">
                    <input class="entrada" data-i="${i}" data-c="maquina" value="${esc(e.maquina)}" placeholder="Ej: Prensa">
                    <input class="entrada" data-i="${i}" data-c="series" type="number" min="0" value="${esc(e.series)}">
                    <input class="entrada" data-i="${i}" data-c="repes" type="number" min="0" value="${esc(e.repes)}">
                    <input class="entrada" data-i="${i}" data-c="peso" type="number" min="0" step="0.5" value="${esc(e.peso)}">
                    <button type="button" class="com-x" data-quitar="${i}" aria-label="Quitar">✕</button>
                </div>`).join('')}`;
            c.querySelectorAll('[data-c]').forEach((inp) => inp.addEventListener('input', () => { ejercicios[Number(inp.dataset.i)][inp.dataset.c] = inp.value; }));
            c.querySelectorAll('[data-quitar]').forEach((b) => b.addEventListener('click', () => { ejercicios.splice(Number(b.dataset.quitar), 1); pintar(); }));
        };
        c.querySelector('#gr-add').addEventListener('click', () => { ejercicios.push({ maquina: '', series: 3, repes: 12, peso: '' }); pintar(); });
        c.querySelector('#gr-guardar').addEventListener('click', async () => {
            const nombre = c.querySelector('#gr-nombre').value.trim();
            const limpios = ejercicios.filter((e) => String(e.maquina).trim());
            if (!nombre) return aviso('Ponle nombre a la rutina.', 'error');
            if (!limpios.length) return aviso('Añade al menos una máquina.', 'error');
            const datos = { tipo: 'rutina', nombre, ejercicios: limpios };
            const res = reg ? await rest.actualizarRegistro('gimnasio', reg.id, datos) : await rest.crearRegistro('gimnasio', datos, hoyClave());
            if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
            m.cerrar();
            aviso('Rutina guardada');
            render();
        });
        pintar();
    };

    await render();
}

// ============================================================
// SUEÑO: a qué hora acostarte para no cortar los ciclos (~90 min)
// ============================================================
function aMinutos(hhmm) {
    const [h, m] = String(hhmm || '0:0').split(':').map(Number);
    return h * 60 + m;
}

function aHora(min) {
    const x = ((Math.round(min) % 1440) + 1440) % 1440;
    return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
}

async function fichaSueno(cont) {
    cont.innerHTML = '';
    const env = document.createElement('div');
    env.className = 'ficha-propia';
    cont.appendChild(env);

    const lista = await listarOrdenado('sueno');
    if (!lista) return;
    const reg = lista.find((x) => x.datos && x.datos.tipo === 'ajustes') || null;
    const aj = (reg && reg.datos) || { cena: '21:00', levantar: '07:30', tardo: 15 };

    env.innerHTML = `
        <div class="tarjeta">
            <h3>Tu noche</h3>
            <div class="est-form-dos">
                <div><label class="etiqueta">¿A qué hora cenas?</label><input class="entrada" id="su-cena" type="time" value="${esc(aj.cena)}"></div>
                <div><label class="etiqueta">¿A qué hora te levantas?</label><input class="entrada" id="su-levantar" type="time" value="${esc(aj.levantar)}"></div>
                <div><label class="etiqueta">¿Cuánto tardas en dormirte? (min)</label><input class="entrada" id="su-tardo" type="number" min="0" max="120" value="${esc(aj.tardo)}"></div>
            </div>
            <div class="fila-botones"><button class="boton-primario" id="su-calcular">Calcular</button></div>
        </div>
        <div class="tarjeta" id="su-resultado"></div>`;

    const calcular = () => {
        const cena = aMinutos(env.querySelector('#su-cena').value);
        const levantar = aMinutos(env.querySelector('#su-levantar').value);
        const tardo = Number(env.querySelector('#su-tardo').value) || 0;
        // Tiempo desde la cena hasta cada hora de acostarse (en el mismo "día de noche")
        const desdeCena = (acostar) => ((acostar - cena) % 1440 + 1440) % 1440;
        const opciones = [6, 5, 4].map((ciclos) => {
            const acostar = levantar - ciclos * 90 - tardo;
            const margen = desdeCena(acostar);
            return { ciclos, horas: ciclos * 1.5, hora: aHora(acostar), pronto: margen < 120 };
        });
        env.querySelector('#su-resultado').innerHTML = `
            <h3>A qué hora acostarte</h3>
            <p class="pista" style="margin-top:0">Cada ciclo de sueño (con su fase REM) dura unos 90 minutos. Si te despiertas al final de uno, te levantas más descansada.</p>
            <div class="su-opciones">${opciones.map((o) => `
                <div class="su-opcion ${o.ciclos === 5 ? 'recomendada' : ''}">
                    <strong class="su-hora">${o.hora}</strong>
                    <span>${o.ciclos} ciclos · ${String(o.horas).replace('.', ',')} h de sueño</span>
                    ${o.ciclos === 5 ? '<span class="chip chip-ok">Recomendada</span>' : ''}
                    ${o.pronto ? '<span class="chip chip-med">Menos de 2 h después de cenar</span>' : ''}
                </div>`).join('')}</div>
            <p class="pista">Te levantas a las ${aHora(levantar)} y cuento ${tardo} min hasta que te duermes. Lo ideal es acostarse 2-3 h después de cenar (cenas a las ${aHora(cena)}).</p>`;
        return { cena: aHora(cena), levantar: aHora(levantar), tardo };
    };

    env.querySelector('#su-calcular').addEventListener('click', async () => {
        const datos = { tipo: 'ajustes', ...calcular() };
        const res = reg ? await rest.actualizarRegistro('sueno', reg.id, datos) : await rest.crearRegistro('sueno', datos, hoyClave());
        if (!res.exito) aviso(res.error || 'No se pudo guardar.', 'error');
    });
    calcular();
}

// ============================================================
// VISIONBOARD: sueños y metas del año, con su plan por meses
// y un collage descargable (fondo de ordenador, móvil o imprimir)
// ============================================================
const FORMATOS_COLLAGE = {
    ordenador: { nombre: 'Ordenador', w: 1920, h: 1080 },
    movil: { nombre: 'Móvil', w: 1080, h: 1920 },
    imprimir: { nombre: 'Imprimir (A4)', w: 2480, h: 3508 }
};

// Reparte los pasos en los meses que quedan hasta la fecha meta
function planPorMeses(pasos, fechaMeta) {
    if (!pasos.length) return [];
    const ini = new Date();
    const fin = desdeClaveDia(fechaMeta || `${ini.getFullYear()}-12-31`);
    const meses = [];
    const f = new Date(ini.getFullYear(), ini.getMonth(), 1);
    while (f <= fin && meses.length < 36) { meses.push(new Date(f)); f.setMonth(f.getMonth() + 1); }
    if (!meses.length) meses.push(new Date(ini.getFullYear(), ini.getMonth(), 1));
    return pasos.map((p, i) => {
        const mes = meses[Math.min(meses.length - 1, Math.floor(i * meses.length / pasos.length))];
        return { ...p, mes: `${MESES_LARGOS[mes.getMonth()]} ${mes.getFullYear()}` };
    });
}

async function fichaVisionboard(cont) {
    cont.innerHTML = '';
    const env = document.createElement('div');
    env.className = 'ficha-propia';
    cont.appendChild(env);

    const render = async () => {
        env.innerHTML = '<div class="skeleton"></div>';
        const lista = await listarOrdenado('visionboard');
        if (!lista) return;
        const metas = lista.filter((x) => x.datos && x.datos.titulo)
            .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));

        env.innerHTML = `
            <div class="tarjeta estante-cab">
                <p class="pista" style="margin:0">${metas.length} ${metas.length === 1 ? 'sueño' : 'sueños'} para ${new Date().getFullYear()}</p>
                <div class="fila-botones" style="margin:0">
                    <button class="boton-suave" id="vb-collage" ${metas.length ? '' : 'disabled'}>Crear collage</button>
                    <button class="boton-primario boton-icono" id="vb-nueva">${SVG_MAS} Añadir</button>
                </div>
            </div>
            <div class="rejilla vb-rejilla">${metas.map((x) => {
                const d = x.datos;
                const pasos = planPorMeses(d.pasos || [], claveDia(x.fecha));
                const hechos = pasos.filter((p) => p.hecho).length;
                const pct = pasos.length ? Math.round(hechos * 100 / pasos.length) : 0;
                return `
                    <div class="tarjeta vb-meta">
                        ${d.foto ? `<img class="vb-foto" src="${d.foto}" alt="">` : ''}
                        <h3>${esc(d.titulo)}</h3>
                        <p class="pista" style="margin:0">Para el ${fechaCorta(x.fecha)}${pasos.length ? ` · ${hechos}/${pasos.length} pasos` : ''}</p>
                        ${pasos.length ? `<div class="vb-barra"><span style="width:${pct}%"></span></div>
                        <ul class="vb-pasos">${pasos.map((p, i) => `
                            <li><label><input type="checkbox" data-meta="${x.id}" data-paso="${i}" ${p.hecho ? 'checked' : ''}>
                            <span><small>${p.mes}</small> ${esc(p.texto)}</span></label></li>`).join('')}</ul>` : ''}
                        <div class="fila-botones">
                            <button class="boton-suave" data-editar="${x.id}">Editar</button>
                            <button class="boton-peligro" data-borrar="${x.id}">Borrar</button>
                        </div>
                    </div>`;
            }).join('') || '<div class="tarjeta" style="grid-column:1/-1"><p class="pista" style="margin:0">Añade tu primer sueño u objetivo del año: con una foto, una fecha y los pasos para conseguirlo.</p></div>'}</div>`;

        env.querySelector('#vb-nueva').addEventListener('click', () => formulario(null));
        env.querySelector('#vb-collage').addEventListener('click', () => collage(metas));
        env.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => formulario(metas.find((x) => x.id === b.dataset.editar))));
        env.querySelectorAll('[data-borrar]').forEach((b) => b.addEventListener('click', async () => {
            const res = await rest.borrarRegistro('visionboard', b.dataset.borrar);
            if (!res.exito) return aviso(res.error || 'No se pudo borrar.', 'error');
            aviso('Borrado');
            render();
        }));
        env.querySelectorAll('[data-paso]').forEach((chk) => chk.addEventListener('change', async () => {
            const meta = metas.find((x) => x.id === chk.dataset.meta);
            const pasos = (meta.datos.pasos || []).map((p, i) => (i === Number(chk.dataset.paso) ? { ...p, hecho: chk.checked } : p));
            const res = await rest.actualizarRegistro('visionboard', meta.id, { ...meta.datos, pasos });
            if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
            render();
        }));
    };

    const formulario = (reg) => {
        const d = (reg && reg.datos) || {};
        let foto = d.foto || '';
        const m = abrirModal(reg ? 'Editar' : 'Nuevo sueño u objetivo', `
            <label class="etiqueta">¿Qué quieres conseguir?</label>
            <input class="entrada" id="vb-titulo" value="${esc(d.titulo)}" placeholder="Ej: viajar a Japón" autocomplete="off">
            <label class="etiqueta" style="margin-top:0.9rem">¿Para cuándo?</label>
            <input class="entrada" id="vb-fecha" type="date" value="${reg ? claveDia(reg.fecha) : `${new Date().getFullYear()}-12-31`}" style="max-width:200px">
            <label class="etiqueta" style="margin-top:0.9rem">Pasos para conseguirlo (uno por línea)</label>
            <textarea class="entrada" id="vb-pasos" rows="4" placeholder="Ahorrar 100 € al mes&#10;Mirar vuelos&#10;Reservar alojamiento">${esc((d.pasos || []).map((p) => p.texto).join('\n'))}</textarea>
            <p class="pista">Te los reparto por meses hasta la fecha.</p>
            <label class="etiqueta" style="margin-top:0.6rem">Foto</label>
            <div id="vb-foto-zona"></div>
            <div class="fila-botones"><button class="boton-primario" id="vb-guardar">Guardar</button></div>`);
        const c = m.caja;
        const pintarFoto = () => {
            const zona = c.querySelector('#vb-foto-zona');
            zona.innerHTML = foto
                ? `<div class="foto-caja"><img src="${foto}" alt=""><button type="button" class="boton-peligro" id="vb-foto-quitar">Quitar foto</button></div>`
                : '<label class="foto-slot">Añadir una foto<input type="file" id="vb-foto-input" accept="image/*" hidden></label>';
            const inp = zona.querySelector('#vb-foto-input');
            if (inp) inp.addEventListener('change', async () => {
                if (!inp.files[0]) return;
                try { foto = await fotoADataUrl(inp.files[0]); } catch (e) { return aviso('No se pudo leer esa imagen.', 'error'); }
                pintarFoto();
            });
            const quitar = zona.querySelector('#vb-foto-quitar');
            if (quitar) quitar.addEventListener('click', () => { foto = ''; pintarFoto(); });
        };
        c.querySelector('#vb-guardar').addEventListener('click', async () => {
            const titulo = c.querySelector('#vb-titulo').value.trim();
            if (!titulo) return aviso('Escribe tu sueño u objetivo.', 'error');
            const antes = d.pasos || [];
            const pasos = c.querySelector('#vb-pasos').value.split('\n').map((t) => t.trim()).filter(Boolean)
                .map((texto) => ({ texto, hecho: !!(antes.find((p) => p.texto === texto) || {}).hecho }));
            const fecha = c.querySelector('#vb-fecha').value || `${new Date().getFullYear()}-12-31`;
            const res = await guardarConFecha('visionboard', reg, { titulo, pasos, foto }, fecha);
            if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
            m.cerrar();
            aviso('Guardado');
            render();
        });
        pintarFoto();
    };

    const collage = (metas) => {
        let formato = 'ordenador';
        const elegidas = new Set(metas.map((x) => x.id));
        const m = abrirModal('Tu collage', `
            <label class="etiqueta">Para</label>
            <div class="periodo-toggle" id="cg-formato">
                ${Object.entries(FORMATOS_COLLAGE).map(([k, f]) => `<button type="button" data-f="${k}" class="${k === formato ? 'activo' : ''}">${f.nombre}</button>`).join('')}
            </div>
            <label class="etiqueta" style="margin-top:0.9rem">Título</label>
            <input class="entrada" id="cg-titulo" value="Mis sueños ${new Date().getFullYear()}">
            <label class="etiqueta" style="margin-top:0.9rem">Qué sale</label>
            <div class="cg-elegir">${metas.map((x) => `<label><input type="checkbox" data-id="${x.id}" checked> ${esc(x.datos.titulo)}</label>`).join('')}</div>
            <canvas id="cg-lienzo" class="cg-lienzo"></canvas>
            <div class="fila-botones"><button class="boton-primario" id="cg-descargar">Descargar imagen</button></div>`);
        const c = m.caja;
        const lienzo = c.querySelector('#cg-lienzo');
        const cacheImg = new Map();
        const cargar = (src) => cacheImg.get(src) || cacheImg.set(src, new Promise((ok) => {
            const im = new Image();
            im.onload = () => ok(im);
            im.onerror = () => ok(null);
            im.src = src;
        })).get(src);

        const dibujar = async () => {
            const { w, h } = FORMATOS_COLLAGE[formato];
            lienzo.width = w;
            lienzo.height = h;
            const ctx = lienzo.getContext('2d');
            const fondo = ctx.createLinearGradient(0, 0, w, h);
            ['#ee7752', '#e73c7e', '#23a6d5', '#23d5ab'].forEach((col, i) => fondo.addColorStop(i / 3, col));
            ctx.fillStyle = fondo;
            ctx.fillRect(0, 0, w, h);

            const u = Math.min(w, h) / 100;              // unidad relativa al tamaño
            const titulo = c.querySelector('#cg-titulo').value.trim();
            const cabeza = titulo ? u * 12 : u * 4;
            if (titulo) {
                ctx.fillStyle = '#fff';
                ctx.font = `700 ${u * 6}px system-ui, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(titulo, w / 2, cabeza / 2 + u * 1.5);
            }
            const items = metas.filter((x) => elegidas.has(x.id));
            if (!items.length) return;
            // Columnas que dejan las celdas más grandes
            const hueco = u * 2.5;
            const altoUtil = h - cabeza - hueco;
            let mejor = { cols: 1, lado: 0 };
            for (let cols = 1; cols <= items.length; cols++) {
                const filas = Math.ceil(items.length / cols);
                const cw = (w - hueco * (cols + 1)) / cols;
                const ch = (altoUtil - hueco * filas) / filas;
                const lado = Math.min(cw, ch * 1.1);
                if (lado > mejor.lado) mejor = { cols, lado };
            }
            const cols = mejor.cols;
            const filas = Math.ceil(items.length / cols);
            const cw = (w - hueco * (cols + 1)) / cols;
            const ch = (altoUtil - hueco * filas) / filas;
            for (let i = 0; i < items.length; i++) {
                const d = items[i].datos;
                const x = hueco + (i % cols) * (cw + hueco);
                const y = cabeza + Math.floor(i / cols) * (ch + hueco);
                const pie = Math.min(ch * 0.2, u * 8);
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(x, y, cw, ch, u * 2);
                ctx.fillStyle = 'rgba(11,26,56,0.5)';
                ctx.fill();
                ctx.clip();
                const im = d.foto ? await cargar(d.foto) : null;
                if (im) {
                    // Recorte tipo "cover" en el hueco de la foto
                    const zh = ch - pie;
                    const esc2 = Math.max(cw / im.width, zh / im.height);
                    const iw = im.width * esc2;
                    const ih = im.height * esc2;
                    ctx.drawImage(im, x + (cw - iw) / 2, y + (zh - ih) / 2, iw, ih);
                }
                ctx.restore();
                ctx.fillStyle = '#fff';
                ctx.font = `600 ${Math.max(14, pie * 0.42)}px system-ui, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                let texto = d.titulo;
                while (ctx.measureText(texto).width > cw - u * 2 && texto.length > 3) texto = texto.slice(0, -2) + '…';
                ctx.fillText(texto, x + cw / 2, im ? y + ch - pie / 2 : y + ch / 2);
            }
        };

        c.querySelectorAll('#cg-formato button').forEach((b) => b.addEventListener('click', () => {
            formato = b.dataset.f;
            c.querySelectorAll('#cg-formato button').forEach((x) => x.classList.toggle('activo', x === b));
            dibujar();
        }));
        c.querySelectorAll('.cg-elegir input').forEach((chk) => chk.addEventListener('change', () => {
            if (chk.checked) elegidas.add(chk.dataset.id); else elegidas.delete(chk.dataset.id);
            dibujar();
        }));
        c.querySelector('#cg-titulo').addEventListener('input', dibujar);
        c.querySelector('#cg-descargar').addEventListener('click', async () => {
            await dibujar();
            const a = document.createElement('a');
            a.download = `dasna-visionboard-${formato}.png`;
            a.href = lienzo.toDataURL('image/png');
            a.click();
        });
        dibujar();
    };

    await render();
}
