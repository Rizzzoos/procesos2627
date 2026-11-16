// ============================================================
// DASNA — Panel: resumen de la semana, primer uso guiado y el
// menú de la cuenta (salir, descargar datos, eliminar cuenta). Solo presentación: los cálculos los hace
// el servidor (GET /api/resumen) y se piden por rest.js.
// ============================================================

const CARITAS_HUMOR = ['😞', '😕', '😐', '🙂', '😄'];

const SVG_DESCARGA = svgLinea('<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>');

// --- Tarjeta «Tu semana» (arriba del Panel) ---
// --- Franja «Hoy»: lo del día de un vistazo, cada dato lleva a su módulo ---

function datoHoy(modulo, texto, aviso = false) {
    return `<a class="hoy-dato${aviso ? ' pendiente' : ''}" href="#/m/${modulo}">${iconoDe(modulo)}<span>${esc(texto)}</span></a>`;
}

function cuandoRelativo(clave) {
    const hoy = hoyClave();
    if (clave === hoy) return 'hoy';
    if (clave === sumarDias(hoy, 1)) return 'mañana';
    return fechaCorta(clave);
}

async function pintarHoy(zona, r) {
    const activo = (clave) => modulos.some((m) => m.clave === clave);
    const hoy = (r && r.hoy) || {};
    const datos = [];
    if (hoy.agua) datos.push(datoHoy('agua', `${hoy.agua.vasos}/${hoy.agua.meta} vasos`, hoy.agua.vasos < hoy.agua.meta));
    if ('diario' in hoy) datos.push(datoHoy('diario', hoy.diario ? 'Diario escrito' : 'Diario por escribir', !hoy.diario));
    if (hoy.gimnasio) datos.push(datoHoy('gimnasio', 'Entreno hecho'));

    const pintar = (extra = []) => {
        if (!zona.isConnected) return;
        const todos = datos.concat(extra);
        const f = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        const fecha = f.charAt(0).toUpperCase() + f.slice(1);
        zona.innerHTML = todos.length ? `
            <div class="cristal hoy-franja">
                <span class="hoy-titulo">Hoy<span class="pista">${esc(fecha)}</span></span>
                <div class="hoy-datos">${todos.join('')}</div>
            </div>` : '';
    };
    pintar();

    // Lo que tarda más (próximo examen o evento, y el ciclo) llega después
    const extra = [];
    const [lista, ciclo] = await Promise.all([
        cargarRegistrosCal().catch(() => []),
        activo('ciclo') ? rest.ciclo().catch(() => null) : null
    ]);
    const hoyK = hoyClave();
    const proximo = (lista || [])
        .filter((x) => ['estudio', 'eventos'].includes(x.clave) && claveDia(x.fecha) >= hoyK)
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0];
    if (proximo) extra.push(datoHoy(proximo.clave, `${resumenDe(proximo.datos)} · ${cuandoRelativo(claveDia(proximo.fecha))}`));
    if (ciclo && !ciclo.error && ciclo.diaCiclo) {
        const fase = ciclo.retraso ? `${ciclo.retraso} ${ciclo.retraso === 1 ? 'día' : 'días'} de retraso` : (FASES_CICLO[ciclo.fase] || '').toLowerCase();
        extra.push(datoHoy('ciclo', `Día ${ciclo.diaCiclo}${fase ? ' · ' + fase : ''}`));
    }
    if (extra.length) pintar(extra);
}

async function pintarResumen(zona, zonaHoy) {
    if (zona) zona.innerHTML = '<div class="skeleton"></div>';
    const r = await rest.resumen();
    if (zonaHoy && zonaHoy.isConnected) pintarHoy(zonaHoy, r && !r.error ? r : null);
    if (!zona || !zona.isConnected) return;
    if (!r || r.error) { zona.innerHTML = ''; return; }

    const datos = [];
    if (r.agua) datos.push(['Agua', `${String(r.agua.mediaVasos).replace('.', ',')} vasos/día`, `${r.agua.diasMeta}/7 días con la meta (${r.agua.meta})`, 'agua']);
    if (r.diario) datos.push(['Diario', `${r.diario.dias}/7 días`, r.diario.humorMedio ? `ánimo medio ${CARITAS_HUMOR[Math.round(r.diario.humorMedio) - 1]}` : 'sin ánimo apuntado', 'diario']);
    if (r.gimnasio) datos.push(['Gimnasio', `${r.gimnasio.entrenos} ${r.gimnasio.entrenos === 1 ? 'entreno' : 'entrenos'}`, 'esta semana', 'gimnasio']);

    if (!datos.length) { zona.innerHTML = ''; return; }
    zona.innerHTML = `
        <div class="cristal resumen-semana">
            <h3 style="margin:0 0 0.9rem">Tu semana</h3>
            <div class="resumen-rejilla">
                ${datos.map(([nombre, valor, nota, modulo]) => `
                    <a class="resumen-dato" href="#/m/${modulo}">
                        <span class="etiqueta">${nombre}</span>
                        <strong>${valor}</strong>
                        <span class="pista">${esc(nota)}</span>
                    </a>`).join('')}
            </div>
        </div>`;
}

// --- Primer uso: elegir qué módulos ver ---
function abrirPrimerUso(disponibles, activos, alTerminar, opciones = {}) {
    // Marcados: los módulos que tiene y los recuadros del Panel que ve
    const elegidos = new Set(activos.map((m) => m.clave).concat([...panelVisible]));
    const opcion = (m) => `
            <label class="primer-uso-op">
                <input type="checkbox" value="${esc(m.clave)}" ${elegidos.has(m.clave) ? 'checked' : ''}>
                <span class="primer-uso-icono">${iconoDe(m.clave, m.icono)}</span>
                <span><strong>${esc(m.nombre)}</strong><small class="pista">${esc(m.descripcion || '')}</small></span>
            </label>`;
    const delPanel = disponibles.filter((m) => m.panel);
    const deModulos = disponibles.filter((m) => !m.panel);
    const { caja, cerrar } = abrirModal(opciones.titulo || 'Bienvenida a Dasna', `
        <p class="pista" style="margin-top:0">Elige qué quieres organizar. Podrás cambiarlo cuando quieras desde el menú de tu cuenta (Elegir módulos).</p>
        ${delPanel.length ? `<h4 class="primer-uso-grupo">Arriba del Panel</h4>
        <div class="primer-uso">${delPanel.map(opcion).join('')}</div>
        <h4 class="primer-uso-grupo">Módulos</h4>` : ''}
        <div class="primer-uso">${deModulos.map(opcion).join('')}</div>
        <div class="fila-botones"><button class="boton-primario" id="pu-guardar">${opciones.boton || 'Empezar'}</button></div>`);
    caja.querySelector('#pu-guardar').addEventListener('click', async () => {
        const claves = [...caja.querySelectorAll('input:checked')].map((i) => i.value);
        if (!claves.some((c) => deModulos.some((m) => m.clave === c))) return aviso('Elige al menos un módulo.', 'error');
        const res = await rest.guardarModulos(claves);
        if (!res || !res.exito) return aviso((res && res.error) || 'No se pudo guardar.', 'error');
        fijarModulos(res.modulos);
        cerrar();
        pintarBarraInferior();
        enrutar();
        programarAvisosCiclo();
        if (alTerminar) alTerminar();
    });
}

// --- Exportar mis datos (JSON o CSV) ---
async function exportarMisDatos(formato, modulo = '') {
    const r = await rest.descargarDatos(formato, modulo);
    if (r.error) return aviso(r.error, 'error');
    const url = URL.createObjectURL(r.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = r.nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    aviso('Descargando tus datos');
}

// --- Menú de la cuenta (botón de salir de la cabecera) ---
function alternarMenuCuenta(boton) {
    const abierto = document.getElementById('menu-cuenta');
    if (abierto) { abierto.remove(); boton.setAttribute('aria-expanded', 'false'); return; }
    const menu = document.createElement('div');
    menu.id = 'menu-cuenta';
    menu.className = 'menu-cuenta';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = `
        <button type="button" role="menuitem" data-accion="modulos">Elegir módulos</button>
        <button type="button" role="menuitem" data-accion="push">Avisos con la app cerrada: ${pushActivo() ? 'sí' : 'no'}</button>
        <button type="button" role="menuitem" data-accion="descargar">Descargar mis datos</button>
        <button type="button" role="menuitem" data-accion="salir">Salir</button>
        <button type="button" role="menuitem" data-accion="eliminar" class="peligro">Eliminar cuenta</button>`;
    boton.parentElement.appendChild(menu);
    boton.setAttribute('aria-expanded', 'true');
    const cerrar = () => {
        menu.remove();
        boton.setAttribute('aria-expanded', 'false');
        document.removeEventListener('click', fuera, true);
        window.removeEventListener('hashchange', cerrar);
    };
    const fuera = (e) => { if (!menu.contains(e.target) && !boton.contains(e.target)) cerrar(); };
    setTimeout(() => document.addEventListener('click', fuera, true), 0);
    window.addEventListener('hashchange', cerrar);
    menu.addEventListener('click', (e) => {
        const b = e.target.closest('[data-accion]');
        if (!b) return;
        cerrar();
        if (b.dataset.accion === 'salir') rest.cerrarSesionApp();
        if (b.dataset.accion === 'descargar') abrirDescarga();
        if (b.dataset.accion === 'modulos') abrirPrimerUso(modulosDisponibles, modulos, null, { titulo: 'Elegir módulos', boton: 'Guardar' });
        if (b.dataset.accion === 'eliminar') abrirEliminarCuenta();
        if (b.dataset.accion === 'push') pushActivo() ? desactivarPush() : activarPush();
    });
}

// Descargar: todo o un módulo, en JSON o CSV
function abrirDescarga() {
    const { caja } = abrirModal('Descargar mis datos', `
        <label class="etiqueta">¿Qué quieres descargar?</label>
        <select class="entrada" id="de-modulo">
            <option value="">Todo</option>
            ${modulos.map((m) => `<option value="${esc(m.clave)}">${esc(m.nombre)}</option>`).join('')}
        </select>
        <div class="fila-botones">
            <button class="boton-primario boton-icono" id="de-json">${SVG_DESCARGA} JSON</button>
            <button class="boton-suave boton-icono" id="de-csv">${SVG_DESCARGA} CSV (Excel)</button>
        </div>`);
    const modulo = () => caja.querySelector('#de-modulo').value;
    caja.querySelector('#de-json').addEventListener('click', () => exportarMisDatos('json', modulo()));
    caja.querySelector('#de-csv').addEventListener('click', () => exportarMisDatos('csv', modulo()));
}

// Eliminar la cuenta: hay que escribir el correo para confirmarlo
function abrirEliminarCuenta() {
    const { caja } = abrirModal('Eliminar cuenta', `
        <p style="margin-top:0">Se borrarán tu cuenta y <strong>todo lo que has guardado</strong> en Dasna. No se puede deshacer.</p>
        <p class="pista">Si quieres conservar algo, descarga antes tus datos.</p>
        <label class="etiqueta">Escribe tu correo para confirmarlo</label>
        <input class="entrada" id="el-email" type="email" autocomplete="off" placeholder="${esc(sesion.email)}">
        <div class="fila-botones"><button class="boton-peligro" id="el-borrar" disabled>Eliminar mi cuenta</button></div>`);
    const entrada = caja.querySelector('#el-email');
    const borrar = caja.querySelector('#el-borrar');
    entrada.addEventListener('input', () => { borrar.disabled = entrada.value.trim().toLowerCase() !== sesion.email.toLowerCase(); });
    borrar.addEventListener('click', async () => {
        borrar.disabled = true;
        const res = await rest.eliminarUsuario(sesion.email);
        if (!res || !res.exito) { borrar.disabled = false; return aviso((res && res.error) || 'No se pudo eliminar la cuenta.', 'error'); }
        window.location.href = '/index.html';
    });
}
