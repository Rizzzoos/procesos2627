// ============================================================
// DASNA — fichas de Viajes, Beber agua y Outfits.
// Usa utilidades de app.js y modulos.js.
// ============================================================

// --- Avisos genéricos (notificación a una hora mientras la app
// esté abierta). Cada módulo tiene su interruptor propio. ---
const temporizadoresAvisos = {};
function avisosActivos(flag) {
    try { return localStorage.getItem(flag) === 'si'; } catch (e) { return false; }
}
function programarAvisos(nombre, flag, avisos) {
    (temporizadoresAvisos[nombre] || []).forEach(clearTimeout);
    temporizadoresAvisos[nombre] = [];
    if (!('Notification' in window) || Notification.permission !== 'granted' || !avisosActivos(flag)) return;
    const ahora = Date.now();
    for (const a of avisos) {
        const ms = a.cuando - ahora;
        if (ms > 0 && ms < 2147483647) {
            temporizadoresAvisos[nombre].push(setTimeout(() => enviarNotificacion(a.titulo, a.texto), ms));
        }
    }
}
async function alternarAvisos(flag, textoOn) {
    if (!('Notification' in window)) { aviso('Este navegador no soporta notificaciones.', 'error'); return false; }
    let permiso = Notification.permission;
    if (permiso === 'default') permiso = await Notification.requestPermission();
    if (permiso !== 'granted') { aviso('Sin permiso de notificaciones.', 'error'); return false; }
    const on = avisosActivos(flag);
    try { localStorage.setItem(flag, on ? 'no' : 'si'); } catch (e) { /* opcional */ }
    aviso(on ? 'Avisos apagados' : textoOn);
    return true;
}
function aLas(dia, hhmm) {
    const f = desdeClaveDia(dia);
    const [h, m] = String(hhmm || '09:00').split(':').map(Number);
    f.setHours(h || 0, m || 0, 0, 0);
    return f.getTime();
}

// ============================================================
// VIAJES: viajes que quieres hacer o vas a hacer, billetes que
// comprar (con su recordatorio) y planes (museos, visitas, comidas…)
// ============================================================
const TRANSPORTES = [['avion', 'Avión'], ['tren', 'Tren'], ['bus', 'Bus'], ['coche', 'Coche'], ['barco', 'Barco']];
const TIPOS_PLAN = [['museo', 'Museo'], ['visita', 'Visita'], ['comida', 'Comida'], ['otro', 'Otro']];
const NOMBRE_TRANSPORTE = Object.fromEntries(TRANSPORTES);
const NOMBRE_PLAN = Object.fromEntries(TIPOS_PLAN);

function avisosViaje(lista) {
    const out = [];
    for (const x of lista) {
        const d = x.datos || {};
        if (d.estado === 'quiero') continue;
        out.push({ dia: claveDia(x.fecha), texto: `Sales de viaje a ${d.destino}`, salida: true });
        for (const t of d.transportes || []) {
            if (!t.comprado && t.recordar) out.push({ dia: t.recordar, texto: `Comprar billete de ${NOMBRE_TRANSPORTE[t.tipo] || t.tipo}${t.trayecto ? ' (' + t.trayecto + ')' : ''} · ${d.destino}` });
        }
        for (const p of d.planes || []) {
            if (p.dia) out.push({ dia: p.dia, hora: p.hora, texto: `${NOMBRE_PLAN[p.tipo] || 'Plan'}: ${p.texto}${p.hora ? ' a las ' + p.hora : ''} · ${d.destino}` });
        }
    }
    return out.sort((a, b) => a.dia.localeCompare(b.dia));
}

async function programarAvisosViajes(lista) {
    if (!avisosActivos('dasna-avisos-viajes')) return programarAvisos('viajes', 'dasna-avisos-viajes', []);
    if (!lista) {
        const r = await rest.listarRegistros('viajes').catch(() => null);
        if (!r || !r.exito) return;
        lista = r.datos;
    }
    programarAvisos('viajes', 'dasna-avisos-viajes', avisosViaje(lista).map((a) => ({
        cuando: aLas(a.dia, a.hora || '09:00'), titulo: 'Dasna · Viajes', texto: a.texto
    })));
}

// Filas editables (billetes / planes) con sus campos
function enlazarFilas(zona, arr, repintar) {
    zona.querySelectorAll('[data-c]').forEach((inp) => {
        const ev = inp.tagName === 'SELECT' ? 'change' : 'input';
        inp.addEventListener(ev, () => { arr[Number(inp.dataset.i)][inp.dataset.c] = inp.value; });
    });
    zona.querySelectorAll('[data-quitar]').forEach((b) => b.addEventListener('click', () => { arr.splice(Number(b.dataset.quitar), 1); repintar(); }));
}
const opcionesSelect = (lista, sel) => lista.map(([v, t]) => `<option value="${v}" ${v === sel ? 'selected' : ''}>${t}</option>`).join('');

async function fichaViajes(cont) {
    let pestana = 'proximos';
    cont.innerHTML = '';
    const env = document.createElement('div');
    env.className = 'ficha-propia';
    cont.appendChild(env);

    const render = async () => {
        env.innerHTML = '<div class="skeleton"></div>';
        const lista = await listarOrdenado('viajes');
        if (!lista) return;
        programarAvisosViajes(lista);
        const hoy = hoyClave();
        const fin = (x) => (x.datos && x.datos.fin) || claveDia(x.fecha);
        const orden = lista.slice().sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
        const grupos = {
            proximos: orden.filter((x) => x.datos.estado !== 'quiero' && fin(x) >= hoy),
            quiero: orden.filter((x) => x.datos.estado === 'quiero'),
            pasados: orden.filter((x) => x.datos.estado !== 'quiero' && fin(x) < hoy).reverse()
        };
        const proximos = avisosViaje(lista).filter((a) => a.dia >= hoy && a.dia <= sumarDias(hoy, 14));
        const on = avisosActivos('dasna-avisos-viajes');

        const tarjeta = (x) => {
            const d = x.datos;
            const pendientes = (d.transportes || []).filter((t) => !t.comprado).length;
            return `
                <div class="tarjeta vb-meta">
                    <h3>${esc(d.destino)}</h3>
                    <p class="pista" style="margin:0">${d.estado === 'quiero' ? 'Quiero ir' : `${fechaCorta(x.fecha)}${d.fin ? ' – ' + fechaCorta(d.fin) : ''} · ${textoFaltan(diasHasta(claveDia(x.fecha)))}`}</p>
                    ${(d.transportes || []).length ? `<p class="etiqueta">Billetes</p><ul class="vb-pasos">${d.transportes.map((t, i) => `
                        <li><label><input type="checkbox" data-viaje="${x.id}" data-billete="${i}" ${t.comprado ? 'checked' : ''}>
                        <span>${NOMBRE_TRANSPORTE[t.tipo] || esc(t.tipo)}${t.trayecto ? ' · ' + esc(t.trayecto) : ''}${t.dia ? `<small>${fechaCorta(t.dia)}${!t.comprado && t.recordar ? ' · comprar el ' + fechaCorta(t.recordar) : ''}</small>` : ''}</span></label></li>`).join('')}</ul>` : ''}
                    ${(d.planes || []).length ? `<p class="etiqueta">Planes</p><ul class="est-lista">${d.planes.slice().sort((a, b) => String(a.dia || '').localeCompare(String(b.dia || ''))).map((p) => `
                        <li><span class="chip">${NOMBRE_PLAN[p.tipo] || 'Plan'}</span> ${esc(p.texto)}${p.dia ? ` <small class="pista">${fechaCorta(p.dia)}${p.hora ? ' · ' + esc(p.hora) : ''}</small>` : ''}</li>`).join('')}</ul>` : ''}
                    ${d.notas ? `<p class="recap-dato">${esc(d.notas)}</p>` : ''}
                    ${pendientes ? `<p class="est-cuando cerca" style="margin:0.5rem 0 0">${pendientes} ${pendientes === 1 ? 'billete' : 'billetes'} por comprar</p>` : ''}
                    <div class="fila-botones">
                        <button class="boton-suave" data-editar="${x.id}">Editar</button>
                        <button class="boton-peligro" data-borrar="${x.id}">Borrar</button>
                    </div>
                </div>`;
        };

        env.innerHTML = `
            <div class="tarjeta">
                <div class="recap-cabecera"><h3>Próximas 2 semanas</h3><button class="boton-primario boton-icono" id="vi-nuevo">${SVG_MAS} Añadir viaje</button></div>
                ${proximos.length ? `<ul class="est-lista">${proximos.map((a) => `<li class="${a.salida ? 'entrega' : ''}"><strong>${textoFaltan(diasHasta(a.dia))}</strong> · ${esc(a.texto)}</li>`).join('')}</ul>` : '<p class="pista">Nada a la vista.</p>'}
                <div class="fila-botones"><button class="boton-suave" id="vi-avisos">${on ? 'Avisos activados' : 'Activar avisos'}</button></div>
            </div>
            <div class="tarjeta estante-cab">
                <div class="periodo-toggle">
                    <button type="button" data-pest="proximos" class="${pestana === 'proximos' ? 'activo' : ''}">Próximos (${grupos.proximos.length})</button>
                    <button type="button" data-pest="quiero" class="${pestana === 'quiero' ? 'activo' : ''}">Quiero ir (${grupos.quiero.length})</button>
                    <button type="button" data-pest="pasados" class="${pestana === 'pasados' ? 'activo' : ''}">Pasados (${grupos.pasados.length})</button>
                </div>
            </div>
            <div class="rejilla vb-rejilla">${grupos[pestana].map(tarjeta).join('') || '<div class="tarjeta" style="grid-column:1/-1"><p class="pista" style="margin:0">Aquí todavía no hay viajes.</p></div>'}</div>`;

        env.querySelectorAll('[data-pest]').forEach((b) => b.addEventListener('click', () => { pestana = b.dataset.pest; render(); }));
        env.querySelector('#vi-nuevo').addEventListener('click', () => formulario(null));
        env.querySelector('#vi-avisos').addEventListener('click', async () => {
            if (await alternarAvisos('dasna-avisos-viajes', 'Te avisaré a las 9:00 de billetes y salidas; los planes, a su hora')) render();
        });
        env.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => formulario(lista.find((x) => x.id === b.dataset.editar))));
        env.querySelectorAll('[data-borrar]').forEach((b) => b.addEventListener('click', async () => {
            const res = await rest.borrarRegistro('viajes', b.dataset.borrar);
            if (!res.exito) return aviso(res.error || 'No se pudo borrar.', 'error');
            registrosCal = null;
            aviso('Viaje borrado');
            render();
        }));
        env.querySelectorAll('[data-billete]').forEach((chk) => chk.addEventListener('change', async () => {
            const v = lista.find((x) => x.id === chk.dataset.viaje);
            const transportes = v.datos.transportes.map((t, i) => (i === Number(chk.dataset.billete) ? { ...t, comprado: chk.checked } : t));
            const res = await rest.actualizarRegistro('viajes', v.id, { ...v.datos, transportes });
            if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
            render();
        }));
    };

    const formulario = (reg) => {
        const d = (reg && reg.datos) || { estado: 'planeado' };
        let estado = d.estado;
        const transportes = (d.transportes || []).map((t) => ({ ...t }));
        const planes = (d.planes || []).map((p) => ({ ...p }));
        const inicio0 = reg ? claveDia(reg.fecha) : sumarDias(hoyClave(), 30);
        const m = abrirModal(reg ? 'Editar viaje' : 'Nuevo viaje', `
            <div class="periodo-toggle" id="vi-estado">
                <button type="button" data-v="planeado" class="${estado !== 'quiero' ? 'activo' : ''}">Voy a ir</button>
                <button type="button" data-v="quiero" class="${estado === 'quiero' ? 'activo' : ''}">Quiero ir</button>
            </div>
            <div class="est-form-dos">
                <div><label class="etiqueta">Destino</label><input class="entrada" id="vi-destino" value="${esc(d.destino)}" placeholder="Ej: Lisboa" autocomplete="off"></div>
                <div><label class="etiqueta">Ida</label><input class="entrada" id="vi-inicio" type="date" value="${inicio0}"></div>
                <div><label class="etiqueta">Vuelta</label><input class="entrada" id="vi-fin" type="date" value="${esc(d.fin || '')}"></div>
            </div>
            <label class="etiqueta" style="margin-top:0.9rem">Billetes</label>
            <div id="vi-transportes"></div>
            <button type="button" class="boton-suave" id="vi-add-t" style="margin-top:0.4rem">Añadir billete</button>
            <label class="etiqueta" style="margin-top:0.9rem">Planes: museos, visitas, comidas…</label>
            <div id="vi-planes"></div>
            <button type="button" class="boton-suave" id="vi-add-p" style="margin-top:0.4rem">Añadir plan</button>
            <label class="etiqueta" style="margin-top:0.9rem">Notas</label>
            <textarea class="entrada" id="vi-notas" rows="2">${esc(d.notas)}</textarea>
            <div class="fila-botones"><button class="boton-primario" id="vi-guardar">Guardar</button></div>`);
        const c = m.caja;
        const pintarT = () => {
            const zona = c.querySelector('#vi-transportes');
            zona.innerHTML = transportes.length ? `
                <div class="vi-fila vi-cab pista"><span>Tipo</span><span>Trayecto</span><span>Día del viaje</span><span>Recordar comprar</span><span></span></div>
                ${transportes.map((t, i) => `
                <div class="vi-fila">
                    <select class="entrada" data-i="${i}" data-c="tipo">${opcionesSelect(TRANSPORTES, t.tipo)}</select>
                    <input class="entrada" data-i="${i}" data-c="trayecto" value="${esc(t.trayecto)}" placeholder="Madrid → Lisboa">
                    <input class="entrada" data-i="${i}" data-c="dia" type="date" value="${esc(t.dia)}">
                    <input class="entrada" data-i="${i}" data-c="recordar" type="date" value="${esc(t.recordar)}">
                    <button type="button" class="com-x" data-quitar="${i}" aria-label="Quitar">✕</button>
                </div>`).join('')}` : '';
            enlazarFilas(zona, transportes, pintarT);
        };
        const pintarP = () => {
            const zona = c.querySelector('#vi-planes');
            zona.innerHTML = planes.map((p, i) => `
                <div class="vi-fila">
                    <select class="entrada" data-i="${i}" data-c="tipo">${opcionesSelect(TIPOS_PLAN, p.tipo)}</select>
                    <input class="entrada" data-i="${i}" data-c="texto" value="${esc(p.texto)}" placeholder="Ej: Museo del Azulejo">
                    <input class="entrada" data-i="${i}" data-c="dia" type="date" value="${esc(p.dia)}">
                    <input class="entrada" data-i="${i}" data-c="hora" type="time" value="${esc(p.hora)}">
                    <button type="button" class="com-x" data-quitar="${i}" aria-label="Quitar">✕</button>
                </div>`).join('');
            enlazarFilas(zona, planes, pintarP);
        };
        c.querySelectorAll('#vi-estado button').forEach((b) => b.addEventListener('click', () => {
            estado = b.dataset.v;
            c.querySelectorAll('#vi-estado button').forEach((x) => x.classList.toggle('activo', x === b));
        }));
        c.querySelector('#vi-add-t').addEventListener('click', () => {
            const ida = c.querySelector('#vi-inicio').value || inicio0;
            // Por defecto: recordar comprarlo 3 semanas antes (o hoy si ya no da tiempo)
            const recordar = sumarDias(ida, -21) < hoyClave() ? hoyClave() : sumarDias(ida, -21);
            transportes.push({ tipo: 'tren', trayecto: '', dia: ida, recordar, comprado: false });
            pintarT();
        });
        c.querySelector('#vi-add-p').addEventListener('click', () => {
            planes.push({ tipo: 'museo', texto: '', dia: c.querySelector('#vi-inicio').value || '', hora: '' });
            pintarP();
        });
        c.querySelector('#vi-guardar').addEventListener('click', async () => {
            const destino = c.querySelector('#vi-destino').value.trim();
            if (!destino) return aviso('Escribe el destino.', 'error');
            const inicio = c.querySelector('#vi-inicio').value || hoyClave();
            const fin = c.querySelector('#vi-fin').value;
            if (fin && fin < inicio) return aviso('La vuelta es antes que la ida.', 'error');
            const datos = {
                destino, estado, fin,
                transportes: transportes.map((t) => ({ ...t, comprado: !!t.comprado })),
                planes: planes.filter((p) => String(p.texto).trim()),
                notas: c.querySelector('#vi-notas').value.trim()
            };
            const res = await guardarConFecha('viajes', reg, datos, inicio);
            if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
            m.cerrar();
            registrosCal = null;
            aviso('Viaje guardado');
            render();
        });
        pintarT();
        pintarP();
    };

    await render();
}

// ============================================================
// BEBER AGUA: horario de vasos según cuándo te levantas, te
// acuestas y comes, con aviso en cada vaso
// ============================================================
// Un vaso cada `cada` minutos entre levantarse y acostarse;
// el que caiga cerca de una comida se pone 30 min antes de ella.
function horarioAgua(aj) {
    const ini = aMinutos(aj.levantar);
    let fin = aMinutos(aj.acostar);
    if (fin <= ini) fin += 1440;
    const cada = Math.max(30, Number(aj.cada) || 120);
    const comidas = (aj.comidas || []).filter(Boolean).map((h) => {
        let x = aMinutos(h);
        if (x < ini) x += 1440;
        return x;
    });
    const tomas = [];
    for (let t = ini + 15; t <= fin - 30; t += cada) {
        const cerca = comidas.find((cm) => Math.abs(cm - t) < cada / 2);
        tomas.push({ min: cerca !== undefined ? Math.max(ini, cerca - 30) : t, comida: cerca !== undefined });
    }
    const vistos = new Set();
    return tomas.filter((t) => (vistos.has(t.min) ? false : vistos.add(t.min)))
        .sort((a, b) => a.min - b.min)
        .map((t) => ({ hora: aHora(t.min), comida: t.comida, min: t.min }));
}

const AGUA_POR_DEFECTO = { levantar: '08:00', acostar: '23:30', cada: 120, comidas: ['08:30', '14:00', '21:00'] };

async function programarAvisosAgua(aj) {
    if (!avisosActivos('dasna-avisos-agua')) return programarAvisos('agua', 'dasna-avisos-agua', []);
    if (!aj) {
        const r = await rest.listarRegistros('agua').catch(() => null);
        if (!r || !r.exito) return;
        const reg = r.datos.find((x) => x.datos && x.datos.tipo === 'ajustes');
        aj = { ...AGUA_POR_DEFECTO, ...((reg && reg.datos) || {}) };
    }
    const avisos = [];
    for (const dia of [hoyClave(), sumarDias(hoyClave(), 1)]) {
        for (const t of horarioAgua(aj)) {
            avisos.push({
                cuando: aLas(dia, '00:00') + t.min * 60000,
                titulo: 'Dasna · Agua',
                texto: t.comida ? 'Un vaso de agua antes de comer' : 'Toca un vaso de agua'
            });
        }
    }
    programarAvisos('agua', 'dasna-avisos-agua', avisos);
}

async function fichaAgua(cont) {
    cont.innerHTML = '';
    const env = document.createElement('div');
    env.className = 'ficha-propia';
    cont.appendChild(env);

    const render = async () => {
        env.innerHTML = '<div class="skeleton"></div>';
        const lista = await listarOrdenado('agua');
        if (!lista) return;
        const regAj = lista.find((x) => x.datos && x.datos.tipo === 'ajustes') || null;
        const aj = { ...AGUA_POR_DEFECTO, ...((regAj && regAj.datos) || {}) };
        const hoy = hoyClave();
        const regHoy = lista.find((x) => x.datos && x.datos.tipo === 'dia' && claveDia(x.fecha) === hoy) || null;
        const vasos = (regHoy && Number(regHoy.datos.vasos)) || 0;
        const horario = horarioAgua(aj);
        const objetivo = horario.length;
        const ahora = new Date();
        const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
        const siguiente = horario.find((t) => t.min > ahoraMin);
        const on = avisosActivos('dasna-avisos-agua');
        programarAvisosAgua(aj);
        const textoCada = (v) => (v % 60 ? String(v / 60).replace('.', ',') : v / 60) + ' h';

        env.innerHTML = `
            <div class="dos-flex">
                <div class="tarjeta">
                    <h3>Hoy</h3>
                    <div class="ag-vasos">${Array.from({ length: Math.max(objetivo, vasos) }, (_, i) => `<span class="ag-vaso ${i < vasos ? 'lleno' : ''}"></span>`).join('')}</div>
                    <p style="margin:0.6rem 0 0"><strong>${vasos}</strong> de ${objetivo} vasos${siguiente ? ` · el siguiente a las <strong>${siguiente.hora}</strong>` : ''}</p>
                    <div class="fila-botones">
                        <button class="boton-primario" id="ag-mas">+ Un vaso</button>
                        <button class="boton-suave" id="ag-menos" ${vasos ? '' : 'disabled'}>Quitar uno</button>
                        <button class="boton-suave" id="ag-avisos">${on ? 'Recordatorios activados' : 'Activar recordatorios'}</button>
                    </div>
                </div>
                <div class="tarjeta">
                    <h3>Tu horario</h3>
                    <div class="est-form-dos">
                        <div><label class="etiqueta">Te levantas</label><input class="entrada" id="ag-levantar" type="time" value="${esc(aj.levantar)}"></div>
                        <div><label class="etiqueta">Te acuestas</label><input class="entrada" id="ag-acostar" type="time" value="${esc(aj.acostar)}"></div>
                        <div><label class="etiqueta">Un vaso cada</label>
                            <select class="entrada" id="ag-cada">${[60, 90, 120, 150, 180].map((v) => `<option value="${v}" ${Number(aj.cada) === v ? 'selected' : ''}>${textoCada(v)}</option>`).join('')}</select></div>
                    </div>
                    <label class="etiqueta" style="margin-top:0.9rem">Cuándo comes</label>
                    <div class="est-form-dos" style="margin-top:0.3rem">
                        ${['Desayuno', 'Comida', 'Cena'].map((n, i) => `<div><label class="pista">${n}</label><input class="entrada" data-comida="${i}" type="time" value="${esc((aj.comidas || [])[i] || '')}"></div>`).join('')}
                    </div>
                    <div class="fila-botones"><button class="boton-primario" id="ag-guardar">Guardar horario</button></div>
                    <div class="ag-horario">${horario.map((t) => `<span class="chip ${t.min <= ahoraMin ? 'chip-ok' : ''}">${t.hora}${t.comida ? ' · antes de comer' : ''}</span>`).join('')}</div>
                </div>
            </div>`;

        const cambiarVasos = async (n) => {
            const datos = { tipo: 'dia', vasos: Math.max(0, n) };
            const res = regHoy ? await rest.actualizarRegistro('agua', regHoy.id, datos) : await rest.crearRegistro('agua', datos, hoy);
            if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
            render();
        };
        env.querySelector('#ag-mas').addEventListener('click', () => cambiarVasos(vasos + 1));
        env.querySelector('#ag-menos').addEventListener('click', () => cambiarVasos(vasos - 1));
        env.querySelector('#ag-avisos').addEventListener('click', async () => {
            if (await alternarAvisos('dasna-avisos-agua', 'Te avisaré en cada vaso (con la app abierta)')) render();
        });
        env.querySelector('#ag-guardar').addEventListener('click', async () => {
            const datos = {
                tipo: 'ajustes',
                levantar: env.querySelector('#ag-levantar').value || '08:00',
                acostar: env.querySelector('#ag-acostar').value || '23:30',
                cada: Number(env.querySelector('#ag-cada').value) || 120,
                comidas: [...env.querySelectorAll('[data-comida]')].map((i) => i.value)
            };
            const res = regAj ? await rest.actualizarRegistro('agua', regAj.id, datos) : await rest.crearRegistro('agua', datos, hoy);
            if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
            aviso('Horario guardado');
            render();
        });
    };

    await render();
}

// ============================================================
// OUTFITS: tus conjuntos (foto + prendas + tiempo + comodidad +
// lo arreglado que es) y un «¿Qué me pongo?» que te da opciones
// ============================================================
const PARTES_OUTFIT = [
    ['arriba', 'Arriba', 'camiseta, blusa, jersey…'],
    ['abajo', 'Abajo', 'pantalones, falda…'],
    ['vestido', 'Vestido / mono', ''],
    ['abrigo', 'Chaqueta / abrigo', ''],
    ['calzado', 'Calzado', 'botas, deportivas…'],
    ['complementos', 'Complementos', 'bolso, mochila…']
];
const TIEMPOS_OUTFIT = [['☀️', 'calor'], ['⛅', 'templado'], ['❄️', 'frío'], ['🌧️', 'lluvia']];
const NIVELES_COMODO = ['Nada cómodo', 'Poco', 'Normal', 'Cómodo', 'Muy cómodo'];
const NIVELES_ARREGLO = ['Muy informal', 'Informal', 'Normal', 'Arreglado', 'Muy arreglado'];

function puntuarOutfit(d, pide) {
    let p = 0;
    if (pide.tiempo) p += (d.tiempos || []).includes(pide.tiempo) ? 4 : -3;
    if (pide.comodidad) p -= Math.abs((Number(d.comodidad) || 3) - pide.comodidad) * 1.5;
    if (pide.arreglo) p -= Math.abs((Number(d.arreglo) || 3) - pide.arreglo) * 1.5;
    return p;
}

async function fichaOutfits(cont) {
    let pestana = 'armario';
    const pide = { tiempo: '', comodidad: 0, arreglo: 0 };
    cont.innerHTML = '';
    const env = document.createElement('div');
    env.className = 'ficha-propia';
    cont.appendChild(env);

    const nivelHtml = (id, nombres, valor) => `
        <div class="periodo-toggle" id="${id}">
            ${nombres.map((n, i) => `<button type="button" data-v="${i + 1}" class="${Number(valor) === i + 1 ? 'activo' : ''}">${n}</button>`).join('')}
        </div>`;

    const tarjetaOutfit = (x, extra = '') => {
        const d = x.datos;
        const prendas = PARTES_OUTFIT.filter(([k]) => d[k]).map(([k, n]) => `<li><small>${n}</small> ${esc(d[k])}</li>`).join('');
        return `
            <div class="tarjeta vb-meta ou-tarjeta" data-ver="${x.id}">
                ${d.foto ? `<img class="vb-foto ou-foto" src="${d.foto}" alt="">` : ''}
                ${extra}
                <ul class="vb-pasos ou-prendas">${prendas}</ul>
                <p class="pista" style="margin:0.5rem 0 0">${(d.tiempos || []).join(' ')} · ${NIVELES_COMODO[(Number(d.comodidad) || 3) - 1]} · ${NIVELES_ARREGLO[(Number(d.arreglo) || 3) - 1]}</p>
            </div>`;
    };

    const render = async () => {
        env.innerHTML = '<div class="skeleton"></div>';
        const lista = await listarOrdenado('outfits');
        if (!lista) return;
        const outfits = lista.filter((x) => x.datos && x.datos.tipo === 'outfit')
            .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));

        let cuerpo;
        if (pestana === 'armario') {
            cuerpo = `<div class="rejilla vb-rejilla">${outfits.map((x) => tarjetaOutfit(x)).join('')
                || '<div class="tarjeta" style="grid-column:1/-1"><p class="pista" style="margin:0">Hazte una foto con lo que llevas hoy y apúntalo: así vas haciendo tu registro de conjuntos.</p></div>'}</div>`;
        } else {
            const hayFiltro = pide.tiempo || pide.comodidad || pide.arreglo;
            const opciones = hayFiltro
                ? outfits.map((x) => ({ x, p: puntuarOutfit(x.datos, pide) })).sort((a, b) => b.p - a.p).slice(0, 4)
                : [];
            cuerpo = `
                <div class="tarjeta">
                    <h3>¿Qué me pongo?</h3>
                    <label class="etiqueta">¿Qué tiempo hace?</label>
                    <div class="humor" id="qp-tiempo">${TIEMPOS_OUTFIT.map(([e, n]) => `<button type="button" data-v="${e}" title="${n}" class="${pide.tiempo === e ? 'activo' : ''}">${e}</button>`).join('')}</div>
                    <label class="etiqueta" style="margin-top:0.9rem">¿Cómo de cómoda quieres ir?</label>
                    ${nivelHtml('qp-comodidad', NIVELES_COMODO, pide.comodidad)}
                    <label class="etiqueta" style="margin-top:0.9rem">¿Arreglada o informal?</label>
                    ${nivelHtml('qp-arreglo', NIVELES_ARREGLO, pide.arreglo)}
                </div>
                ${!hayFiltro ? '<div class="tarjeta"><p class="pista" style="margin:0">Contesta y te doy opciones de tu armario.</p></div>'
                    : opciones.length ? `<div class="rejilla vb-rejilla">${opciones.map(({ x, p }, i) =>
                        tarjetaOutfit(x, `<p class="chip ${i === 0 ? 'chip-ok' : ''}" style="margin:0.5rem 0 0">${i === 0 ? 'Mejor opción' : 'Opción ' + (i + 1)}${p < 0 ? ' (parecida)' : ''}</p>`)).join('')}</div>`
                    : '<div class="tarjeta"><p class="pista" style="margin:0">Aún no tienes outfits guardados.</p></div>'}`;
        }

        env.innerHTML = `
            <div class="tarjeta estante-cab">
                <div class="periodo-toggle">
                    <button type="button" data-pest="armario" class="${pestana === 'armario' ? 'activo' : ''}">Mis outfits (${outfits.length})</button>
                    <button type="button" data-pest="elegir" class="${pestana === 'elegir' ? 'activo' : ''}">¿Qué me pongo?</button>
                </div>
                <button class="boton-primario boton-icono" id="ou-nuevo">${SVG_MAS} Añadir outfit</button>
            </div>
            ${cuerpo}`;

        env.querySelectorAll('[data-pest]').forEach((b) => b.addEventListener('click', () => { pestana = b.dataset.pest; render(); }));
        env.querySelector('#ou-nuevo').addEventListener('click', () => formulario(null));
        env.querySelectorAll('[data-ver]').forEach((t) => t.addEventListener('click', () => formulario(outfits.find((x) => x.id === t.dataset.ver))));
        env.querySelectorAll('#qp-tiempo button').forEach((b) => b.addEventListener('click', () => { pide.tiempo = pide.tiempo === b.dataset.v ? '' : b.dataset.v; render(); }));
        env.querySelectorAll('#qp-comodidad button').forEach((b) => b.addEventListener('click', () => { pide.comodidad = Number(b.dataset.v); render(); }));
        env.querySelectorAll('#qp-arreglo button').forEach((b) => b.addEventListener('click', () => { pide.arreglo = Number(b.dataset.v); render(); }));
    };

    const formulario = (reg) => {
        const d = (reg && reg.datos) || { tiempos: [], comodidad: 3, arreglo: 3 };
        let foto = d.foto || '';
        const tiempos = new Set(d.tiempos || []);
        let comodidad = Number(d.comodidad) || 3;
        let arreglo = Number(d.arreglo) || 3;
        const m = abrirModal(reg ? 'Tu outfit' : 'Nuevo outfit', `
            <div id="ou-foto-zona"></div>
            <div class="est-form-dos">
                ${PARTES_OUTFIT.map(([k, n, ej]) => `<div><label class="etiqueta">${n}</label><input class="entrada" data-parte="${k}" value="${esc(d[k])}" placeholder="${ej ? 'Ej: ' + ej : ''}" autocomplete="off"></div>`).join('')}
            </div>
            <label class="etiqueta" style="margin-top:0.9rem">¿Para qué tiempo?</label>
            <div class="humor humor-multi" id="ou-tiempo">${TIEMPOS_OUTFIT.map(([e, n]) => `<button type="button" data-v="${e}" title="${n}" class="${tiempos.has(e) ? 'activo' : ''}">${e}</button>`).join('')}</div>
            <label class="etiqueta" style="margin-top:0.9rem">Comodidad</label>
            ${nivelHtml('ou-comodidad', NIVELES_COMODO, comodidad)}
            <label class="etiqueta" style="margin-top:0.9rem">Arreglado / informal</label>
            ${nivelHtml('ou-arreglo', NIVELES_ARREGLO, arreglo)}
            <div class="fila-botones">
                <button class="boton-primario" id="ou-guardar">Guardar</button>
                ${reg ? '<button class="boton-peligro" id="ou-borrar">Borrar</button>' : ''}
            </div>`);
        const c = m.caja;
        const pintarFoto = () => {
            const zona = c.querySelector('#ou-foto-zona');
            zona.innerHTML = foto
                ? `<div class="foto-caja"><img src="${foto}" alt=""><button type="button" class="boton-peligro" id="ou-foto-quitar">Quitar foto</button></div>`
                : '<label class="foto-slot">Hazte una foto o súbela<input type="file" id="ou-foto-input" accept="image/*" hidden></label>';
            const inp = zona.querySelector('#ou-foto-input');
            if (inp) inp.addEventListener('change', async () => {
                if (!inp.files[0]) return;
                try { foto = await fotoADataUrl(inp.files[0]); } catch (e) { return aviso('No se pudo leer esa imagen.', 'error'); }
                pintarFoto();
            });
            const q = zona.querySelector('#ou-foto-quitar');
            if (q) q.addEventListener('click', () => { foto = ''; pintarFoto(); });
        };
        c.querySelectorAll('#ou-tiempo button').forEach((b) => b.addEventListener('click', () => {
            if (tiempos.has(b.dataset.v)) tiempos.delete(b.dataset.v); else tiempos.add(b.dataset.v);
            b.classList.toggle('activo');
        }));
        const nivel = (id, set) => c.querySelectorAll(`#${id} button`).forEach((b) => b.addEventListener('click', () => {
            set(Number(b.dataset.v));
            c.querySelectorAll(`#${id} button`).forEach((x) => x.classList.toggle('activo', x === b));
        }));
        nivel('ou-comodidad', (v) => { comodidad = v; });
        nivel('ou-arreglo', (v) => { arreglo = v; });
        c.querySelector('#ou-guardar').addEventListener('click', async () => {
            const datos = { tipo: 'outfit', foto, tiempos: [...tiempos], comodidad, arreglo };
            c.querySelectorAll('[data-parte]').forEach((i) => { datos[i.dataset.parte] = i.value.trim(); });
            if (!PARTES_OUTFIT.some(([k]) => datos[k]) && !foto) return aviso('Pon una foto o alguna prenda.', 'error');
            const res = reg ? await rest.actualizarRegistro('outfits', reg.id, datos) : await rest.crearRegistro('outfits', datos, hoyClave());
            if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
            m.cerrar();
            aviso('Outfit guardado');
            render();
        });
        const borrar = c.querySelector('#ou-borrar');
        if (borrar) borrar.addEventListener('click', async () => {
            const res = await rest.borrarRegistro('outfits', reg.id);
            if (!res.exito) return aviso(res.error || 'No se pudo borrar.', 'error');
            m.cerrar();
            aviso('Outfit borrado');
            render();
        });
        pintarFoto();
    };

    await render();
}
