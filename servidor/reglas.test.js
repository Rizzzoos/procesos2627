// Pruebas de las reglas de los módulos (Sprint 2, PBI-27).
// No necesitan base de datos: se prueba logica.aplicarRegla con un «hoy» fijo.
const test = require('node:test');
const assert = require('node:assert');
const logica = require('./logica.js');

const HOY = '2026-11-10'; // martes
const regla = (nombre, params) => logica.aplicarRegla(nombre, { hoy: HOY, ...params });

test('Reglas de los módulos (PBI-27)', async (t) => {
    await t.test('R1: una regla que no existe o sin «hoy» se rechaza', () => {
        assert.strictEqual(regla('inventada', {}).exito, false);
        assert.strictEqual(logica.aplicarRegla('fecha', { texto: 'mañana' }).exito, false);
        assert.strictEqual(regla('fecha', { texto: '' }).exito, false);
        assert.strictEqual(regla('fecha', { texto: 'x'.repeat(301) }).exito, false);
        assert.strictEqual(regla('__proto__', {}).exito, false);
    });

    await t.test('R2: fecha en lenguaje natural', () => {
        assert.deepStrictEqual(regla('fecha', { texto: 'comida familiar mañana' }).datos,
            { fecha: '2026-11-11', resto: 'comida familiar', conFecha: true });
        assert.strictEqual(regla('fecha', { texto: 'quedada el viernes' }).datos.fecha, '2026-11-13');
        assert.strictEqual(regla('fecha', { texto: '2 de enero comida' }).datos.fecha, '2027-01-02', 'enero dicho en noviembre es del año que viene');
        assert.strictEqual(regla('fecha', { texto: 'sin fecha' }).datos.fecha, HOY);
    });

    await t.test('R3: eventos con rangos, hora y tipo', () => {
        const roma = regla('evento', { texto: 'los últimos tres días de febrero viaje a Roma' }).datos;
        assert.deepStrictEqual(roma, { inicio: '2027-02-26', fin: '2027-02-28', hora: '', titulo: 'Viaje a Roma', tipo: 'viaje' });
        const cena = regla('evento', { texto: '24 diciembre ceno en casa de la abuela a las 21:30' }).datos;
        assert.strictEqual(cena.inicio, '2026-12-24');
        assert.strictEqual(cena.hora, '21:30');
        assert.strictEqual(cena.tipo, 'cena');
        const rango = regla('evento', { texto: 'festival del 3 al 5 de julio' }).datos;
        assert.deepStrictEqual([rango.inicio, rango.fin, rango.tipo], ['2027-07-03', '2027-07-05', 'festival']);
        assert.strictEqual(regla('evento', { texto: 'concierto el 1 de marzo' }).datos.inicio, '2027-03-01', 'fecha pasada sin año va al año que viene');
    });

    await t.test('R4: estudio lee tipo, asignatura y fecha', () => {
        assert.deepStrictEqual(regla('estudio', { texto: 'tengo examen de Procesos el 12 de diciembre' }).datos,
            { tipo: 'examen', titulo: 'Examen', asignatura: 'Procesos', fecha: '2026-12-12' });
        assert.strictEqual(regla('estudio', { texto: 'entrega de la práctica mañana' }).datos.tipo, 'practica');
    });

    await t.test('R5: plan de estudio reparte horas y avisa si no da tiempo', () => {
        const ok = regla('plan-estudio', { temas: [{ nombre: 'Tema 1', horas: 2 }, { nombre: 'Tema 2', horas: 3 }], examen: '2026-11-15', horasDia: 2 }).datos;
        assert.strictEqual(ok.falta, 0);
        assert.strictEqual(ok.plan[0].dia, HOY);
        assert.strictEqual(ok.plan.at(-1).texto, 'Repaso general');
        assert.strictEqual(ok.plan.at(-1).dia, '2026-11-14');
        const corto = regla('plan-estudio', { temas: [{ nombre: 'Todo', horas: 20 }], examen: '2026-11-12', horasDia: 2 }).datos;
        assert.strictEqual(corto.falta, 18, 'solo hay un día de estudio antes del día de repaso');
        assert.strictEqual(regla('plan-estudio', { temas: [{ horas: 1 }], examen: '2026-11-01', horasDia: 2 }).exito, false, 'examen pasado');
        assert.strictEqual(regla('plan-estudio', { temas: [{ horas: 1 }], examen: '2026-12-01', horasDia: 30 }).exito, false, 'más de 16 h al día');
    });

    await t.test('R6: agua, un vaso cada 2 h adelantado antes de comer', () => {
        const h = regla('agua', { levantar: '08:00', acostar: '23:30', cada: 120, comidas: ['14:00'] }).datos;
        assert.strictEqual(h[0].hora, '08:15');
        assert.ok(h.some((t) => t.hora === '13:30' && t.comida), 'media hora antes de comer');
        assert.ok(h.every((t, i) => i === 0 || t.min > h[i - 1].min), 'ordenado y sin repetidos');
        assert.strictEqual(regla('agua', { levantar: 'pronto', acostar: '23:00' }).exito, false);
    });

    await t.test('R7: sueño en ciclos de 90 minutos', () => {
        const s = regla('sueno', { cena: '21:30', levantar: '09:00', tardo: 20 }).datos;
        assert.deepStrictEqual(s.opciones.map((o) => o.hora), ['23:40', '01:10', '02:40']);
        assert.strictEqual(s.opciones.find((o) => o.recomendada).ciclos, 5);
        const temprano = regla('sueno', { cena: '21:00', levantar: '07:00', tardo: 0 }).datos;
        assert.strictEqual(temprano.opciones[0].pronto, true, 'acostarse a las 22:00 es solo 1 h después de cenar');
    });

    await t.test('R8: outfits ordenados por parecido a lo que se pide', () => {
        const outfits = [
            { id: 'a', datos: { tiempos: ['❄️'], comodidad: 5, arreglo: 1 } },
            { id: 'b', datos: { tiempos: ['☀️'], comodidad: 3, arreglo: 4 } },
            { id: 'c', datos: { tiempos: ['☀️'], comodidad: 5, arreglo: 1 } }
        ];
        const r = regla('outfits', { outfits, pide: { tiempo: '☀️', comodidad: 5, arreglo: 1 } }).datos;
        assert.deepStrictEqual(r.map((x) => x.id), ['c', 'a', 'b'], 'b acierta el tiempo pero falla mucho en lo arreglado');
        assert.deepStrictEqual(regla('outfits', { outfits, pide: {} }).datos, [], 'sin preguntas no hay sugerencias');
    });

    await t.test('R9: visionboard reparte los pasos por meses', () => {
        const [plan] = regla('visionboard', { metas: [{ pasos: [{ texto: 'a' }, { texto: 'b' }], fecha: '2026-12-31' }] }).datos;
        assert.deepStrictEqual(plan.map((p) => p.mes), ['Noviembre 2026', 'Diciembre 2026']);
    });
});
