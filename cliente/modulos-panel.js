// ============================================================
// DASNA — Panel: resumen de la semana, rachas, primer uso guiado
// y exportar mis datos. Solo presentación: los cálculos los hace
// el servidor (GET /api/resumen) y se piden por rest.js.
// ============================================================

const CARITAS_HUMOR = ['😞', '😕', '😐', '🙂', '😄'];

const SVG_LLAMA = svgLinea('<path d="M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-1.6.7-2.8 1.5-3.6C10 9.5 11 8 12 3Z"/><path d="M12 21a7 7 0 0 0 7-7c0-2-.7-3.6-1.5-4.8"/><path d="M5 14a7 7 0 0 0 7 7"/>');
const SVG_DESCARGA = svgLinea('<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>');

// --- Tarjeta «Tu semana» (arriba del Panel) ---
async function pintarResumen(zona) {
    zona.innerHTML = '<div class="skeleton"></div>';
    const r = await rest.resumen();
    if (!zona.isConnected) return;
    if (!r || r.error) { zona.innerHTML = ''; return; }

    const datos = [];
    if (r.agua) datos.push(['Agua', `${String(r.agua.mediaVasos).replace('.', ',')} vasos/día`, `${r.agua.diasMeta}/7 días con la meta (${r.agua.meta})`, 'agua']);
    if (r.diario) datos.push(['Diario', `${r.diario.dias}/7 días`, r.diario.humorMedio ? `ánimo medio ${CARITAS_HUMOR[Math.round(r.diario.humorMedio) - 1]}` : 'sin ánimo apuntado', 'diario']);
    if (r.gimnasio) datos.push(['Gimnasio', `${r.gimnasio.entrenos} ${r.gimnasio.entrenos === 1 ? 'entreno' : 'entrenos'}`, 'esta semana', 'gimnasio']);

    const proximos = [
        ...((r.estudio && r.estudio.proximos) || []).map((p) => ({ ...p, modulo: 'estudio' })),
        ...((r.eventos && r.eventos.proximos) || []).map((p) => ({ ...p, modulo: 'eventos' }))
    ].sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 5);

    const rachas = (r.rachas || []).filter((x) => x.valor > 0);

    if (!datos.length && !proximos.length) { zona.innerHTML = ''; return; }
    zona.innerHTML = `
        <div class="cristal resumen-semana">
            <div class="resumen-cab">
                <h3>Tu semana</h3>
                ${rachas.length ? `<div class="rachas">${rachas.map((x) => `
                    <a class="racha" href="#/m/${x.modulo}" title="Racha de ${x.nombre}">${SVG_LLAMA}<strong>${x.valor}</strong> ${x.unidad === 'semanas' ? (x.valor === 1 ? 'semana' : 'semanas') : (x.valor === 1 ? 'día' : 'días')} · ${esc(x.nombre)}</a>`).join('')}</div>` : ''}
            </div>
            <div class="resumen-rejilla">
                ${datos.map(([nombre, valor, nota, modulo]) => `
                    <a class="resumen-dato" href="#/m/${modulo}">
                        <span class="etiqueta">${nombre}</span>
                        <strong>${valor}</strong>
                        <span class="pista">${esc(nota)}</span>
                    </a>`).join('')}
                ${proximos.length ? `
                    <div class="resumen-dato resumen-proximos">
                        <span class="etiqueta">Próximos 7 días</span>
                        ${proximos.map((p) => `<a href="#/m/${p.modulo}"><span class="pista">${fechaCorta(p.fecha)}</span> ${esc(p.titulo)}</a>`).join('')}
                    </div>` : ''}
            </div>
        </div>`;
}

// --- Primer uso: elegir qué módulos ver ---
function abrirPrimerUso(disponibles, activos, alTerminar) {
    const elegidos = new Set(activos.map((m) => m.clave));
    const { caja, cerrar } = abrirModal('Bienvenida a Dasna', `
        <p class="pista" style="margin-top:0">Elige qué quieres organizar. Podrás cambiarlo cuando quieras desde el Panel.</p>
        <div class="primer-uso">${disponibles.map((m) => `
            <label class="primer-uso-op">
                <input type="checkbox" value="${esc(m.clave)}" ${elegidos.has(m.clave) ? 'checked' : ''}>
                <span class="primer-uso-icono">${iconoDe(m.clave, m.icono)}</span>
                <span><strong>${esc(m.nombre)}</strong><small class="pista">${esc(m.descripcion || '')}</small></span>
            </label>`).join('')}</div>
        <div class="fila-botones"><button class="boton-primario" id="pu-guardar">Empezar</button></div>`);
    caja.querySelector('#pu-guardar').addEventListener('click', async () => {
        const claves = [...caja.querySelectorAll('input:checked')].map((i) => i.value);
        if (!claves.length) return aviso('Elige al menos un módulo.', 'error');
        const res = await rest.guardarModulos(claves);
        if (!res || !res.exito) return aviso((res && res.error) || 'No se pudo guardar.', 'error');
        modulos = res.modulos;
        cerrar();
        pintarBarraInferior();
        enrutar();
        if (alTerminar) alTerminar();
    });
}

// --- Exportar mis datos (JSON o CSV) ---
async function exportarMisDatos(formato) {
    const r = await rest.descargarDatos(formato);
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

// --- Tarjeta «Tu cuenta» (abajo del Panel) ---
function pintarCuenta(zona) {
    zona.innerHTML = `
        <div class="cristal cuenta-panel">
            <div>
                <h3>Tu cuenta</h3>
                <p class="pista" style="margin:0">Elige tus módulos o descarga todo lo que has guardado.</p>
            </div>
            <div class="fila-botones" style="margin:0">
                <button class="boton-suave" id="cu-modulos">Elegir módulos</button>
                <button class="boton-suave boton-icono" id="cu-json">${SVG_DESCARGA} JSON</button>
                <button class="boton-suave boton-icono" id="cu-csv">${SVG_DESCARGA} CSV</button>
            </div>
        </div>`;
    zona.querySelector('#cu-modulos').addEventListener('click', async () => {
        const r = await rest.obtenerModulos();
        if (!r || !r.exito) return aviso('No se pudieron leer tus módulos.', 'error');
        abrirPrimerUso(r.disponibles, r.modulos);
    });
    zona.querySelector('#cu-json').addEventListener('click', () => exportarMisDatos('json'));
    zona.querySelector('#cu-csv').addEventListener('click', () => exportarMisDatos('csv'));
}
