// ============================================================
// CAPA DE LÓGICA — reglas de los módulos (Sprint 2, PBI-27)
// Funciones puras: no tocan la base de datos ni HTTP. Reciben
// «hoy» (AAAA-MM-DD) del cliente para que el resultado no dependa
// de la zona horaria del servidor y se puedan probar con fechas fijas.
// logica.js las expone con aplicarRegla(); api.js con /api/reglas/:nombre.
// ============================================================

// --- Fechas como texto AAAA-MM-DD ---
function claveDia(fecha) {
    const f = new Date(fecha);
    if (Number.isNaN(f.getTime())) return '';
    return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
}

function desdeClave(k) {
    const [a, m, d] = String(k).slice(0, 10).split('-').map(Number);
    return new Date(a, m - 1, d);
}

function sumarDias(k, n) {
    const f = desdeClave(k);
    f.setDate(f.getDate() + n);
    return claveDia(f);
}

function esClave(k) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(k || '')) && claveDia(desdeClave(k)) === k;
}

function aMinutos(hhmm) {
    const [h, m] = String(hhmm || '0:0').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
}

function aHora(min) {
    const x = ((Math.round(min) % 1440) + 1440) % 1440;
    return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
}

// --- Lenguaje natural: «comida familiar mañana», «26 octubre» ---
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

function limpiarConectores(t) {
    return t.replace(/\s+/g, ' ')
        .replace(/^[\s,;:—-]+/, '')
        .replace(/[\s,;:—-]+$/, '')
        .replace(/^(?:de|del|el|la|los|en|para|a)\s+/i, '')
        .replace(/\s+(?:de|del|el|la|los|en|para|a)$/i, '')
        .trim();
}

// Devuelve { fecha: 'AAAA-MM-DD', resto }: la fecha y el texto sin ella
function interpretarFecha(texto, hoyK) {
    texto = String(texto || '');
    const hoy = desdeClave(hoyK);
    const sumar = (dias) => { const f = new Date(hoy); f.setDate(f.getDate() + dias); return f; };
    const validar = (anio, mes, dia) => {
        const f = new Date(anio, mes - 1, dia);
        return f.getMonth() === mes - 1 && f.getDate() === dia ? f : null;
    };
    // Un «1 enero» escrito en diciembre es del año que viene (si queda muy atrás)
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

    let resto = texto;
    if (frag) resto = texto.replace(new RegExp(frag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), ' ');
    resto = limpiarConectores(resto);
    return { fecha: claveDia(fecha || hoy), resto, conFecha: Boolean(fecha) };
}

// Lo que se apunta en Eventos/Estudio es de hoy en adelante: una fecha sin
// año que ya ha pasado («festival en julio», dicho en noviembre) es del año que viene
function alFuturo(fechaK, texto, hoyK) {
    if (fechaK >= hoyK || /ayer|\d{4}|\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}/i.test(texto)) return fechaK;
    const f = desdeClave(fechaK);
    f.setFullYear(f.getFullYear() + 1);
    return claveDia(f);
}

function numeroDe(t) {
    const x = String(t).toLowerCase();
    return /^\d+$/.test(x) ? Number(x) : NUMEROS_TXT[x];
}

const TIPOS_EVENTO = [
    ['comida', /\b(comida|comer|almuerzo|brunch|desayuno)\b/i],
    ['cena', /\b(cena|ceno|cenar)\b/i],
    ['viaje', /\b(viaje|viajo|vuelo|escapada)\b/i],
    ['concierto', /\b(concierto)\b/i],
    ['festival', /\b(festival)\b/i],
    ['cumple', /\b(cumple|cumpleaños|cumpleanos)\b/i],
    ['quedada', /\b(quedada|quedo|quedar|fiesta|cafe|café)\b/i]
];

function tipoDeEvento(texto) {
    const t = TIPOS_EVENTO.find(([, re]) => re.test(texto));
    return t ? t[0] : 'otro';
}

// «los últimos tres días de febrero viaje a Roma», «del 3 al 5 de mayo», «a las 21:30»
function interpretarEvento(texto, hoyK) {
    texto = String(texto || '');
    const hoy = desdeClave(hoyK);
    const anioPara = (mes, dia) => (new Date(hoy.getFullYear(), mes - 1, dia) < hoy ? hoy.getFullYear() + 1 : hoy.getFullYear());
    const N = `(\\d{1,2}|${RE_NUMS})`;
    const M = `(${RE_MESES})`;
    let inicio = null;
    let fin = null;
    let frag = '';

    // últimos / primeros N días de <mes>
    let m = new RegExp(`\\b(?:los\\s+)?(?:(?:[uú]ltimos)|(primeros))\\s+${N}\\s+d[ií]as\\s+(?:de|del)\\s+${M}\\b`, 'i').exec(texto);
    if (m) {
        const n = numeroDe(m[2]);
        const mes = MESES_TXT[m[3].toLowerCase()];
        const diasMes = new Date(hoy.getFullYear(), mes, 0).getDate();
        if (n && n <= diasMes) {
            const a = anioPara(mes, m[1] ? 1 : diasMes);
            const ultimo = new Date(a, mes, 0).getDate();
            inicio = claveDia(new Date(a, mes - 1, m[1] ? 1 : ultimo - n + 1));
            fin = claveDia(new Date(a, mes - 1, m[1] ? n : ultimo));
            frag = m[0];
        }
    }
    // del X (de mes) al Y de mes
    if (!inicio) {
        m = new RegExp(`\\b(?:del|desde\\s+el)\\s+${N}(?:\\s+de\\s+${M})?\\s+(?:al|hasta\\s+el)\\s+${N}\\s+de\\s+${M}\\b`, 'i').exec(texto);
        if (m) {
            const d1 = numeroDe(m[1]);
            const d2 = numeroDe(m[3]);
            const mes2 = MESES_TXT[m[4].toLowerCase()];
            const mes1 = m[2] ? MESES_TXT[m[2].toLowerCase()] : mes2;
            const a1 = anioPara(mes1, d1);
            inicio = claveDia(new Date(a1, mes1 - 1, d1));
            fin = claveDia(new Date(mes2 < mes1 ? a1 + 1 : a1, mes2 - 1, d2));
            frag = m[0];
        }
    }

    let resto;
    if (inicio) {
        resto = texto.replace(frag, ' ');
    } else {
        const it = interpretarFecha(texto, hoyK);
        inicio = alFuturo(it.fecha, texto, hoyK);
        resto = it.resto;
    }
    // Hora: «a las 21:30», «a las 9», «a las nueve y media de la noche»
    let hora = '';
    const h = /\ba\s+las?\s+(\d{1,2})(?:[:.](\d{2}))?(\s+y\s+media)?(?:\s+de\s+la\s+(tarde|noche))?\b/i.exec(resto);
    if (h) {
        let hh = Number(h[1]);
        const mm = h[2] ? Number(h[2]) : (h[3] ? 30 : 0);
        if (h[4] && hh < 12) hh += 12;
        if (hh <= 23 && mm <= 59) {
            hora = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
            resto = resto.replace(h[0], ' ');
        }
    }
    resto = limpiarConectores(resto.replace(/^\s*(?:tengo|hay|voy\s+a|me\s+voy\s+de)\s+/i, '').replace(/^(?:que)\s+/i, ''));
    resto = resto.charAt(0).toUpperCase() + resto.slice(1);
    return {
        inicio,
        fin: fin && fin !== inicio ? fin : '',
        hora,
        titulo: resto,
        tipo: tipoDeEvento(texto)
    };
}

// Estudio: «tengo examen de Procesos el 12 de diciembre»
function interpretarEstudio(texto, hoyK) {
    texto = String(texto || '');
    const it = interpretarFecha(texto, hoyK);
    const tipos = [['examen', /\b(examen|parcial|final|prueba)\b/i], ['practica', /\bpr[aá]ctica/i], ['deberes', /\bdeberes\b/i], ['tarea', /\b(tarea|entrega|trabajo)\b/i]];
    const tipo = (tipos.find(([, re]) => re.test(texto)) || ['tarea'])[0];
    let resto = it.resto.replace(/^\s*(?:tengo|hay)\s+(?:un|una|el|la)?\s*/i, '').trim();
    let asignatura = '';
    const a = /\b(?:de|del)\s+(.+)$/i.exec(resto);
    if (a && /^(examen|parcial|final|pr[aá]ctica|deberes|tarea|entrega|trabajo)\b/i.test(resto)) {
        asignatura = a[1].trim();
        resto = resto.slice(0, a.index).trim();
    }
    resto = resto.charAt(0).toUpperCase() + resto.slice(1);
    asignatura = asignatura.charAt(0).toUpperCase() + asignatura.slice(1);
    return { tipo, titulo: resto, asignatura, fecha: alFuturo(it.fecha, texto, hoyK) };
}

// --- Estudio: reparte las horas de cada tema en los días hasta el examen ---
function planificarTemas(temas, fechaExamen, horasDia, hoyK) {
    horasDia = Number(horasDia) || 2;
    const ultimo = sumarDias(fechaExamen, -1);
    const dias = [];
    for (let k = hoyK; k < ultimo; k = sumarDias(k, 1)) dias.push(k);
    const total = temas.reduce((s, t) => s + (Number(t.horas) || 0), 0);
    if (!dias.length) return { plan: [{ dia: hoyK, texto: 'Repaso general' }], falta: total };
    const plan = [];
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
    plan.push({ dia: ultimo, texto: 'Repaso general' });
    const porDia = new Map();
    for (const p of plan) porDia.set(p.dia, [...(porDia.get(p.dia) || []), p.texto]);
    return {
        plan: [...porDia].map(([dia, textos]) => ({ dia, texto: textos.join(' · ') })),
        falta: Math.max(0, total - dias.length * horasDia)
    };
}

// --- Beber agua: un vaso cada X, adelantado a media hora antes de cada comida ---
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

// --- Sueño: horas de acostarse para despertar al final de un ciclo de 90 min ---
function horasSueno({ cena, levantar, tardo }) {
    const c = aMinutos(cena);
    const l = aMinutos(levantar);
    const t = Math.max(0, Math.min(180, Number(tardo) || 0));
    const desdeCena = (acostar) => ((acostar - c) % 1440 + 1440) % 1440;
    const opciones = [6, 5, 4].map((ciclos) => {
        const acostar = l - ciclos * 90 - t;
        return { ciclos, horas: ciclos * 1.5, hora: aHora(acostar), recomendada: ciclos === 5, pronto: desdeCena(acostar) < 120 };
    });
    return { cena: aHora(c), levantar: aHora(l), tardo: t, opciones };
}

// --- Outfits: puntúa cada conjunto según el tiempo, la comodidad y lo arreglado ---
function puntuarOutfit(d, pide) {
    let p = 0;
    if (pide.tiempo) p += (d.tiempos || []).includes(pide.tiempo) ? 4 : -3;
    if (pide.comodidad) p -= Math.abs((Number(d.comodidad) || 3) - pide.comodidad) * 1.5;
    if (pide.arreglo) p -= Math.abs((Number(d.arreglo) || 3) - pide.arreglo) * 1.5;
    return p;
}

// Devuelve los 4 mejores [{ id, puntos }] (vacío si no se pide nada)
function sugerirOutfits(outfits, pide) {
    if (!pide || !(pide.tiempo || pide.comodidad || pide.arreglo)) return [];
    return outfits.map((o) => ({ id: o.id, puntos: puntuarOutfit(o.datos || {}, pide) }))
        .sort((a, b) => b.puntos - a.puntos)
        .slice(0, 4);
}

// --- Visionboard: reparte los pasos en los meses que quedan hasta la meta ---
function planPorMeses(pasos, fechaMeta, hoyK) {
    if (!pasos.length) return [];
    const ini = desdeClave(hoyK);
    const fin = desdeClave(fechaMeta || `${ini.getFullYear()}-12-31`);
    const meses = [];
    const f = new Date(ini.getFullYear(), ini.getMonth(), 1);
    while (f <= fin && meses.length < 36) { meses.push(new Date(f)); f.setMonth(f.getMonth() + 1); }
    if (!meses.length) meses.push(new Date(ini.getFullYear(), ini.getMonth(), 1));
    return pasos.map((p, i) => {
        const mes = meses[Math.min(meses.length - 1, Math.floor(i * meses.length / pasos.length))];
        return { ...p, mes: `${MESES_LARGOS[mes.getMonth()]} ${mes.getFullYear()}` };
    });
}

// --- Panel: resumen de la semana y rachas (Sprint 2, ideas) ---
const AGUA_POR_DEFECTO = { levantar: '08:00', acostar: '23:30', cada: 120, comidas: ['08:30', '14:00', '21:00'] };

// Lunes de la semana de una fecha (las semanas empiezan en lunes)
function lunesDe(k) {
    const f = desdeClave(k);
    return sumarDias(k, -((f.getDay() + 6) % 7));
}

// Días seguidos (hacia atrás) que cumplen; hoy cuenta si ya se cumple,
// y si aún no, la racha sigue viva desde ayer
function diasSeguidos(cumple, hoyK) {
    let k = cumple.has(hoyK) ? hoyK : sumarDias(hoyK, -1);
    let n = 0;
    while (cumple.has(k)) { n++; k = sumarDias(k, -1); }
    return n;
}

// registros: { modulo: [{ fecha: 'AAAA-MM-DD', datos }] } (solo los módulos activos)
function resumenSemana(registros, hoyK) {
    const desde = sumarDias(hoyK, -6);
    const hasta7 = sumarDias(hoyK, 7);
    const enSemana = (r) => r.fecha >= desde && r.fecha <= hoyK;
    const de = (m) => registros[m] || null;
    const resumen = { desde, hasta: hoyK, rachas: [] };

    if (de('agua')) {
        const ajustes = de('agua').find((r) => r.datos && r.datos.tipo === 'ajustes');
        const meta = horarioAgua({ ...AGUA_POR_DEFECTO, ...((ajustes && ajustes.datos) || {}) }).length || 8;
        const dias = de('agua').filter((r) => r.datos && r.datos.tipo === 'dia');
        const semana = dias.filter(enSemana);
        const vasos = semana.reduce((t, r) => t + (Number(r.datos.vasos) || 0), 0);
        resumen.agua = {
            meta,
            mediaVasos: Math.round((vasos / 7) * 10) / 10,
            diasMeta: semana.filter((r) => Number(r.datos.vasos) >= meta).length
        };
        const cumple = new Set(dias.filter((r) => Number(r.datos.vasos) >= meta).map((r) => r.fecha));
        resumen.rachas.push({ modulo: 'agua', nombre: 'Agua', valor: diasSeguidos(cumple, hoyK), unidad: 'días' });
    }
    if (de('diario')) {
        const semana = de('diario').filter(enSemana);
        const humores = semana.map((r) => Number(r.datos && r.datos.humor)).filter((h) => h > 0);
        resumen.diario = {
            dias: new Set(semana.map((r) => r.fecha)).size,
            humorMedio: humores.length ? Math.round((humores.reduce((a, b) => a + b, 0) / humores.length) * 10) / 10 : null
        };
        const cumple = new Set(de('diario').map((r) => r.fecha));
        resumen.rachas.push({ modulo: 'diario', nombre: 'Diario', valor: diasSeguidos(cumple, hoyK), unidad: 'días' });
    }
    if (de('gimnasio')) {
        const sesiones = de('gimnasio').filter((r) => r.datos && r.datos.tipo === 'sesion');
        resumen.gimnasio = { entrenos: sesiones.filter(enSemana).length };
        // Racha en semanas: la meta no es entrenar a diario, sí cada semana
        const semanas = new Set(sesiones.map((r) => lunesDe(r.fecha)));
        let k = semanas.has(lunesDe(hoyK)) ? lunesDe(hoyK) : sumarDias(lunesDe(hoyK), -7);
        let n = 0;
        while (semanas.has(k)) { n++; k = sumarDias(k, -7); }
        resumen.rachas.push({ modulo: 'gimnasio', nombre: 'Gimnasio', valor: n, unidad: 'semanas' });
    }
    const proximos = (m) => (de(m) || [])
        .filter((r) => r.fecha >= hoyK && r.fecha <= hasta7 && r.datos && r.datos.titulo)
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .slice(0, 5)
        .map((r) => ({ fecha: r.fecha, titulo: String(r.datos.titulo).slice(0, 80), tipo: r.datos.tipo || '' }));
    if (de('estudio')) resumen.estudio = { proximos: proximos('estudio') };
    if (de('eventos')) resumen.eventos = { proximos: proximos('eventos') };
    return resumen;
}

module.exports = {
    esClave,
    interpretarFecha,
    interpretarEvento,
    interpretarEstudio,
    planificarTemas,
    horarioAgua,
    horasSueno,
    sugerirOutfits,
    planPorMeses,
    sumarDias,
    resumenSemana
};
