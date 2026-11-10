// ============================================================
// DASNA — Eventos (comidas, cenas, viajes, conciertos…) escritos
// o dictados con tus palabras, y el botón de voz que también usa
// Estudio. Usa utilidades de app.js, modulos.js y modulos-vida.js.
// ============================================================

// --- Dictado por voz (Web Speech API del navegador) ---
const SVG_MICRO = svgLinea('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v5"/><path d="M8 22h8"/>');

function botonVoz(boton, entrada, alTerminar) {
    const Reconocer = window.SpeechRecognition || window.webkitSpeechRecognition;
    boton.addEventListener('click', () => {
        if (!Reconocer) return aviso('Este navegador no permite dictar. Prueba con Chrome.', 'error');
        if (boton.classList.contains('escuchando')) return;
        const rec = new Reconocer();
        rec.lang = 'es-ES';
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        boton.classList.add('escuchando');
        let texto = '';
        rec.onresult = (e) => {
            texto = [...e.results].map((r) => r[0].transcript).join(' ');
            entrada.value = texto;
            entrada.dispatchEvent(new Event('input'));
        };
        rec.onerror = (e) => {
            if (e.error === 'not-allowed') aviso('Sin permiso para usar el micrófono.', 'error');
            else if (e.error !== 'no-speech' && e.error !== 'aborted') aviso('No te he entendido, prueba otra vez.', 'error');
        };
        rec.onend = () => {
            boton.classList.remove('escuchando');
            if (texto.trim() && alTerminar) alTerminar(texto.trim());
        };
        rec.start();
    });
}

// --- Fechas con rango: «los últimos tres días de febrero»,
// «del 3 al 5 de marzo», «del 28 de febrero al 2 de marzo» ---
// La lectura de frases («los últimos tres días de febrero viaje a Roma»)
// la hace el servidor: rest.regla('evento' | 'estudio', { texto }).

const TIPOS_EVENTO = [
    ['comida', 'Comida', /\b(comida|comer|almuerzo|brunch|desayuno)\b/i],
    ['cena', 'Cena', /\b(cena|ceno|cenar)\b/i],
    ['viaje', 'Viaje', /\b(viaje|viajo|vuelo|escapada)\b/i],
    ['concierto', 'Concierto', /\b(concierto)\b/i],
    ['festival', 'Festival', /\b(festival)\b/i],
    ['cumple', 'Cumpleaños', /\b(cumple|cumpleaños|cumpleanos)\b/i],
    ['quedada', 'Quedada', /\b(quedada|quedo|quedar|fiesta|cafe|café)\b/i],
    ['otro', 'Otro', null]
];
const NOMBRE_EVENTO = Object.fromEntries(TIPOS_EVENTO.map(([k, n]) => [k, n]));


function textoFechasEvento(d, fecha) {
    const ini = fechaCorta(fecha);
    return `${d.fin ? `${ini} – ${fechaCorta(d.fin)}` : ini}${d.hora ? ' · ' + d.hora : ''}`;
}

async function fichaEventos(cont) {
    cont.innerHTML = '';
    const env = document.createElement('div');
    env.className = 'ficha-propia';
    cont.appendChild(env);
    let verPasados = false;

    const render = async () => {
        env.innerHTML = '<div class="skeleton"></div>';
        const lista = await listarOrdenado('eventos');
        if (!lista) return;
        const hoy = hoyClave();
        const finDe = (x) => (x.datos && x.datos.fin) || claveDia(x.fecha);
        const orden = lista.slice().sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
        const futuros = orden.filter((x) => finDe(x) >= hoy);
        const pasados = orden.filter((x) => finDe(x) < hoy).reverse();

        // Agrupar por mes
        const porMes = new Map();
        for (const x of futuros) {
            const f = desdeClaveDia(claveDia(x.fecha));
            const k = `${MESES_LARGOS[f.getMonth()]} ${f.getFullYear()}`;
            porMes.set(k, [...(porMes.get(k) || []), x]);
        }
        const fila = (x) => {
            const d = x.datos;
            const n = diasHasta(claveDia(x.fecha));
            const enCurso = n < 0 && finDe(x) >= hoy;
            return `
                <div class="ahorro-fila ev-fila">
                    <span class="chip">${NOMBRE_EVENTO[d.tipo] || 'Otro'}</span>
                    <span class="ahorro-concepto"><strong>${esc(d.titulo)}</strong></span>
                    <span class="est-cuando ${n >= 0 && n <= 3 ? 'cerca' : ''}">${textoFechasEvento(d, x.fecha)} · ${enCurso ? 'ahora' : textoFaltan(n)}</span>
                    <button class="boton-suave" data-editar="${x.id}">Editar</button>
                    <button class="boton-peligro" data-borrar="${x.id}">Borrar</button>
                </div>`;
        };

        env.innerHTML = `
            <div class="tarjeta">
                <h3>Añadir</h3>
                <p class="pista" style="margin-top:0">Escríbelo con tus palabras (en el móvil, también por voz): «mañana comida con los amigos», «el 24 de diciembre ceno en casa de la abuela», «los últimos tres días de febrero viaje a Roma».</p>
                <div class="ev-alta">
                    <input class="entrada" id="ev-texto" placeholder="¿Qué tienes y cuándo?" autocomplete="off">
                    <button class="boton-suave boton-voz" id="ev-voz" title="Dictar" aria-label="Dictar">${SVG_MICRO}</button>
                    <button class="boton-primario" id="ev-guardar">Añadir</button>
                </div>
                <div class="preview-fecha" id="ev-preview"></div>
            </div>
            <div class="tarjeta">
                <h3>Próximos</h3>
                ${porMes.size ? [...porMes].map(([mes, xs]) => `<p class="etiqueta ev-mes">${mes}</p><div class="ahorro-lista">${xs.map(fila).join('')}</div>`).join('')
                    : '<p class="pista">No tienes nada apuntado.</p>'}
            </div>
            ${pasados.length ? `<div class="tarjeta">
                <button class="boton-suave" id="ev-pasados">${verPasados ? 'Ocultar' : 'Ver'} pasados (${pasados.length})</button>
                ${verPasados ? `<div class="ahorro-lista" style="margin-top:0.8rem">${pasados.map(fila).join('')}</div>` : ''}
            </div>` : ''}`;

        const inp = env.querySelector('#ev-texto');
        const prev = env.querySelector('#ev-preview');
        let esperaPrev = null;
        const pintarPrev = () => {
            const t = inp.value.trim();
            clearTimeout(esperaPrev);
            if (!t) { prev.textContent = ''; return; }
            esperaPrev = setTimeout(() => pintarPrevDe(t), 250);
        };
        const pintarPrevDe = async (t) => {
            const e = await rest.regla('evento', { texto: t });
            if (e.error || inp.value.trim() !== t) return;
            prev.textContent = `${NOMBRE_EVENTO[e.tipo]} · ${e.fin ? fechaCorta(e.inicio) + ' – ' + fechaCorta(e.fin) : fechaBonita(desdeClaveDia(e.inicio))}${e.hora ? ' · ' + e.hora : ''}${e.titulo ? ' · «' + e.titulo + '»' : ''}`;
        };
        const guardar = async () => {
            const t = inp.value.trim();
            if (!t) return aviso('Escribe o dicta qué tienes.', 'error');
            const e = await rest.regla('evento', { texto: t });
            if (e.error) return aviso(e.error, 'error');
            const res = await rest.crearRegistro('eventos', { titulo: e.titulo || t, tipo: e.tipo, fin: e.fin, hora: e.hora }, e.inicio);
            if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
            registrosCal = null;
            aviso('Apuntado');
            render();
        };
        inp.addEventListener('input', pintarPrev);
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') guardar(); });
        env.querySelector('#ev-guardar').addEventListener('click', guardar);
        botonVoz(env.querySelector('#ev-voz'), inp);
        const btnPas = env.querySelector('#ev-pasados');
        if (btnPas) btnPas.addEventListener('click', () => { verPasados = !verPasados; render(); });
        env.querySelectorAll('[data-borrar]').forEach((b) => b.addEventListener('click', async () => {
            const res = await rest.borrarRegistro('eventos', b.dataset.borrar);
            if (!res.exito) return aviso(res.error || 'No se pudo borrar.', 'error');
            registrosCal = null;
            aviso('Borrado');
            render();
        }));
        env.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => editar(lista.find((x) => x.id === b.dataset.editar))));
    };

    const editar = (reg) => {
        const d = reg.datos;
        const m = abrirModal('Editar', `
            <label class="etiqueta">Qué</label>
            <input class="entrada" id="ee-titulo" value="${esc(d.titulo)}" autocomplete="off">
            <label class="etiqueta" style="margin-top:0.8rem">Tipo</label>
            <select class="entrada" id="ee-tipo" style="max-width:220px">${opcionesSelect(TIPOS_EVENTO.map(([k, n]) => [k, n]), d.tipo)}</select>
            <div class="est-form-dos">
                <div><label class="etiqueta">Día</label><input class="entrada" id="ee-inicio" type="date" value="${claveDia(reg.fecha)}"></div>
                <div><label class="etiqueta">Hasta (opcional)</label><input class="entrada" id="ee-fin" type="date" value="${esc(d.fin || '')}"></div>
                <div><label class="etiqueta">Hora (opcional)</label><input class="entrada" id="ee-hora" type="time" value="${esc(d.hora || '')}"></div>
            </div>
            <div class="fila-botones"><button class="boton-primario" id="ee-guardar">Guardar</button></div>`);
        const c = m.caja;
        c.querySelector('#ee-guardar').addEventListener('click', async () => {
            const titulo = c.querySelector('#ee-titulo').value.trim();
            if (!titulo) return aviso('Escribe qué es.', 'error');
            const inicio = c.querySelector('#ee-inicio').value || hoyClave();
            const fin = c.querySelector('#ee-fin').value;
            if (fin && fin < inicio) return aviso('El final es antes que el principio.', 'error');
            const res = await guardarConFecha('eventos', reg, {
                titulo, tipo: c.querySelector('#ee-tipo').value, fin: fin && fin !== inicio ? fin : '', hora: c.querySelector('#ee-hora').value
            }, inicio);
            if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
            m.cerrar();
            registrosCal = null;
            aviso('Guardado');
            render();
        });
    };

    await render();
}

