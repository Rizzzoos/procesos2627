// ============================================================
// DASNA — Mi ciclo: apuntar cada día (sangrado, relaciones y
// síntomas) y ver la predicción. Solo presentación: la predicción
// la calcula el servidor (GET /api/ciclo) y se pide por rest.js.
// ============================================================

const SANGRADO_CICLO = [[0, 'Nada'], [1, 'Manchado'], [2, 'Ligero'], [3, 'Medio'], [4, 'Abundante']];
const SINTOMAS_CICLO_UI = [
    ['triste', 'Más triste'], ['antojos', 'Antojos'], ['pecho', 'Me duelen los pechos'],
    ['granos', 'Granos'], ['dolor', 'Dolor de regla'], ['hinchazon', 'Hinchazón']
];
const NOMBRE_SINTOMA = Object.fromEntries(SINTOMAS_CICLO_UI);
const FASES_CICLO = {
    regla: 'Regla',
    folicular: 'Fase folicular',
    fertil: 'Ventana fértil',
    lutea: 'Fase lútea'
};
const DIAS_CORTOS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const fechaCiclo = (k) => desdeClaveDia(k).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

async function fichaCiclo(cont) {
    cont.innerHTML = '';
    const env = document.createElement('div');
    env.className = 'ficha-propia';
    cont.appendChild(env);
    let mes = hoyClave().slice(0, 7);
    let diaSel = hoyClave();

    const render = async () => {
        env.innerHTML = '<div class="skeleton"></div>';
        const [lista, an] = await Promise.all([listarOrdenado('ciclo'), rest.ciclo()]);
        if (!lista) return;
        if (an.error) { env.innerHTML = ''; return aviso(an.error, 'error'); }
        const porDia = {};
        lista.filter((x) => x.datos && x.datos.tipo === 'dia').forEach((x) => { porDia[claveDia(x.fecha)] = x; });
        const on = avisosActivos('dasna-avisos-ciclo');

        // --- Tarjeta de estado ---
        let estado;
        if (!an.proximaRegla) {
            estado = `<p style="margin:0">Apunta el primer día de tu próxima regla y empezaré a predecir. Cuantos más meses apuntes, mejor te conoceré.</p>`;
        } else {
            const faltan = diasHasta(an.proximaRegla);
            estado = `
                <div class="ci-estado">
                    <div><span class="etiqueta">Hoy</span><strong>Día ${an.diaCiclo}</strong><span class="pista">${FASES_CICLO[an.fase] || ''}</span></div>
                    <div><span class="etiqueta">Próxima regla</span><strong>${an.retraso ? `${an.retraso} ${an.retraso === 1 ? 'día' : 'días'} de retraso` : textoFaltan(faltan)}</strong><span class="pista">${fechaCiclo(an.proximaRegla)}</span></div>
                    <div><span class="etiqueta">Ventana fértil</span><strong>${Number(an.fertil.desde.slice(8))}–${Number(an.fertil.hasta.slice(8))} ${MESES_LARGOS[Number(an.fertil.hasta.slice(5, 7)) - 1].toLowerCase()}</strong><span class="pista">ovulación hacia el ${Number(an.ovulacion.slice(8))}</span></div>
                </div>
                <p class="pista" style="margin:0.8rem 0 0">Ciclo de ${an.duracionCiclo} días y regla de ${an.duracionRegla} de media · ${an.ciclosCompletos} ${an.ciclosCompletos === 1 ? 'ciclo completo' : 'ciclos completos'} · confianza ${an.confianza}.</p>`;
        }
        const avisosHtml = (an.avisos || []).length
            ? `<ul class="ci-avisos">${an.avisos.map((a) => `<li>${esc(a.texto)}</li>`).join('')}</ul>` : '';
        const patronesHtml = (an.patrones || []).length
            ? an.patrones.map((p) => {
                const rango = p.desde === p.hasta ? p.desde : `${p.desde}–${p.hasta}`;
                const cuando = p.referencia === 'inicio'
                    ? `${p.desde === p.hasta ? 'día' : 'días'} ${rango} de la regla`
                    : `${rango} ${rango === 1 ? 'día' : 'días'} antes de la regla`;
                return `<span class="chip">${esc(NOMBRE_SINTOMA[p.sintoma] || p.sintoma)}: ${cuando} · ${p.ciclos} de ${p.de} ciclos</span>`;
            }).join(' ')
            : '<span class="pista">Cuando un síntoma se repita en al menos la mitad de tus ciclos, aparecerá aquí.</span>';

        // --- Calendario del mes ---
        const [a, m] = mes.split('-').map(Number);
        const primero = `${mes}-01`;
        const huecos = (desdeClaveDia(primero).getDay() + 6) % 7;
        const enMes = new Date(a, m, 0).getDate();
        const prevista = new Set();
        const fertil = new Set();
        if (an.proximaRegla && !an.retraso) {
            for (let i = 0; i < an.duracionRegla; i++) prevista.add(sumarDias(an.proximaRegla, i));
            for (let k = an.fertil.desde; k <= an.fertil.hasta; k = sumarDias(k, 1)) fertil.add(k);
        }
        let celdas = DIAS_CORTOS.map((d) => `<span class="ci-cab">${d}</span>`).join('') + '<span></span>'.repeat(huecos);
        for (let d = 1; d <= enMes; d++) {
            const k = `${mes}-${String(d).padStart(2, '0')}`;
            const reg = porDia[k];
            const dd = (reg && reg.datos) || {};
            const clases = ['ci-dia'];
            if (Number(dd.sangrado) >= 1) clases.push(`ci-sangra-${dd.sangrado}`);
            else if (prevista.has(k)) clases.push('ci-prevista');
            else if (fertil.has(k)) clases.push('ci-fertil');
            if (k === an.ovulacion) clases.push('ci-ovulacion');
            if (k === hoyClave()) clases.push('ci-hoy');
            if (k === diaSel) clases.push('activo');
            const marcas = `${dd.relaciones ? '<i class="ci-marca ci-rel"></i>' : ''}${(dd.sintomas || []).length ? '<i class="ci-marca ci-sin"></i>' : ''}`;
            celdas += `<button type="button" class="${clases.join(' ')}" data-dia="${k}" ${k > hoyClave() ? 'disabled' : ''}>${d}<span class="ci-marcas">${marcas}</span></button>`;
        }

        // --- Formulario del día elegido ---
        const sel = (porDia[diaSel] && porDia[diaSel].datos) || {};
        let sangrado = Number(sel.sangrado) || 0;
        let relaciones = Boolean(sel.relaciones);
        const sintomas = new Set(sel.sintomas || []);

        env.innerHTML = `
            <div class="tarjeta">
                <h3>Tu ciclo</h3>
                ${estado}
                ${avisosHtml}
                <div class="fila-botones"><button class="boton-suave" id="ci-avisos">${on ? 'Avisos activados' : 'Activar avisos'}</button></div>
            </div>
            <div class="dos-flex">
                <div class="tarjeta">
                    <div class="ci-mes-cab">
                        <button class="boton-suave pick-flecha" id="ci-ant" aria-label="Mes anterior">‹</button>
                        <h3 style="margin:0">${MESES_LARGOS[m - 1]} ${a}</h3>
                        <button class="boton-suave pick-flecha" id="ci-sig" aria-label="Mes siguiente">›</button>
                    </div>
                    <div class="ci-cal">${celdas}</div>
                    <div class="ci-leyenda">
                        <span><i class="ci-punto ci-sangra-3"></i>Regla</span>
                        <span><i class="ci-punto ci-prevista"></i>Prevista</span>
                        <span><i class="ci-punto ci-fertil"></i>Fértil</span>
                        <span><i class="ci-marca ci-rel"></i>Relaciones</span>
                        <span><i class="ci-marca ci-sin"></i>Síntomas</span>
                    </div>
                </div>
                <div class="tarjeta">
                    <h3>${diaSel === hoyClave() ? 'Hoy' : esc(fechaCiclo(diaSel))}</h3>
                    <label class="etiqueta">Sangrado</label>
                    <div class="periodo-toggle ci-opciones" id="ci-sangrado">${SANGRADO_CICLO.map(([v, n]) => `<button type="button" data-v="${v}" class="${v === sangrado ? 'activo' : ''}">${n}</button>`).join('')}</div>
                    <label class="etiqueta" style="margin-top:0.9rem">Relaciones sexuales</label>
                    <div class="periodo-toggle ci-opciones" id="ci-relaciones">
                        <button type="button" data-v="0" class="${relaciones ? '' : 'activo'}">No</button>
                        <button type="button" data-v="1" class="${relaciones ? 'activo' : ''}">Sí</button>
                    </div>
                    <label class="etiqueta" style="margin-top:0.9rem">Cómo te sientes</label>
                    <div class="periodo-toggle ci-opciones" id="ci-sintomas">${SINTOMAS_CICLO_UI.map(([v, n]) => `<button type="button" data-v="${v}" class="${sintomas.has(v) ? 'activo' : ''}">${n}</button>`).join('')}</div>
                    <div class="fila-botones">
                        <button class="boton-primario" id="ci-guardar">Guardar día</button>
                        ${porDia[diaSel] ? '<button class="boton-suave" id="ci-borrar">Borrar día</button>' : ''}
                    </div>
                </div>
            </div>
            <div class="tarjeta">
                <h3>Lo que sueles notar</h3>
                <div class="ci-patrones">${patronesHtml}</div>
                <p class="pista" style="margin:0.9rem 0 0">Es una estimación con tus datos: no sirve como método anticonceptivo ni sustituye a tu médico.</p>
            </div>`;

        const cambiarMes = (n) => {
            const f = desdeClaveDia(`${mes}-01`);
            f.setMonth(f.getMonth() + n);
            mes = claveDia(f).slice(0, 7);
            render();
        };
        env.querySelector('#ci-ant').addEventListener('click', () => cambiarMes(-1));
        env.querySelector('#ci-sig').addEventListener('click', () => cambiarMes(1));
        env.querySelectorAll('.ci-dia').forEach((b) => b.addEventListener('click', () => { diaSel = b.dataset.dia; render(); }));
        env.querySelectorAll('#ci-sangrado button').forEach((b) => b.addEventListener('click', () => {
            sangrado = Number(b.dataset.v);
            env.querySelectorAll('#ci-sangrado button').forEach((x) => x.classList.toggle('activo', x === b));
        }));
        env.querySelectorAll('#ci-relaciones button').forEach((b) => b.addEventListener('click', () => {
            relaciones = b.dataset.v === '1';
            env.querySelectorAll('#ci-relaciones button').forEach((x) => x.classList.toggle('activo', x === b));
        }));
        env.querySelectorAll('#ci-sintomas button').forEach((b) => b.addEventListener('click', () => {
            if (sintomas.has(b.dataset.v)) sintomas.delete(b.dataset.v); else sintomas.add(b.dataset.v);
            b.classList.toggle('activo');
        }));
        env.querySelector('#ci-guardar').addEventListener('click', async () => {
            const datos = { tipo: 'dia', sangrado, relaciones, sintomas: [...sintomas] };
            const reg = porDia[diaSel];
            const res = reg ? await rest.actualizarRegistro('ciclo', reg.id, datos) : await rest.crearRegistro('ciclo', datos, diaSel);
            if (!res.exito) return aviso(res.error || 'No se pudo guardar.', 'error');
            aviso('Día guardado');
            render();
        });
        const borrar = env.querySelector('#ci-borrar');
        if (borrar) borrar.addEventListener('click', async () => {
            const res = await rest.borrarRegistro('ciclo', porDia[diaSel].id);
            if (!res.exito) return aviso(res.error || 'No se pudo borrar.', 'error');
            aviso('Día borrado');
            render();
        });
        env.querySelector('#ci-avisos').addEventListener('click', async () => {
            if (await alternarAvisos('dasna-avisos-ciclo', 'Te avisaré de tu ciclo una vez al día')) {
                try { localStorage.removeItem('dasna-ciclo-avisado'); } catch (e) { /* opcional */ }
                programarAvisosCiclo();
                render();
            }
        });
    };

    await render();
}

// Avisos de Mi ciclo: una vez al día (a partir de las 9:00), con la app abierta
async function programarAvisosCiclo() {
    if (!modulos.some((m) => m.clave === 'ciclo') || !avisosActivos('dasna-avisos-ciclo')) return programarAvisos('ciclo', 'dasna-avisos-ciclo', []);
    const hoy = hoyClave();
    let avisado = '';
    try { avisado = localStorage.getItem('dasna-ciclo-avisado') || ''; } catch (e) { /* opcional */ }
    if (avisado === hoy) return;
    const an = await rest.ciclo();
    if (!an || an.error || !(an.avisos || []).length) return;
    const cuando = Math.max(Date.now() + 2000, aLas(hoy, '09:00'));
    programarAvisos('ciclo', 'dasna-avisos-ciclo', [{ cuando, titulo: 'Mi ciclo', texto: an.avisos.map((a) => a.texto).join(' ') }]);
    try { localStorage.setItem('dasna-ciclo-avisado', hoy); } catch (e) { /* opcional */ }
}
