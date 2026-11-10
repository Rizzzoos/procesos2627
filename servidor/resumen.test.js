// Pruebas del resumen de la semana y las rachas (Sprint 2, ideas).
// Funciones puras: sin base de datos, con un «hoy» fijo.
const test = require('node:test');
const assert = require('node:assert');
const reglas = require('./reglas.js');
const logica = require('./logica.js');

const HOY = '2026-11-10'; // martes

test('Resumen semanal y rachas', async (t) => {
    await t.test('S1: agua cuenta la media, los días con meta y la racha', () => {
        const r = reglas.resumenSemana({
            agua: [
                { fecha: '2026-11-09', datos: { tipo: 'dia', vasos: 8 } },
                { fecha: '2026-11-08', datos: { tipo: 'dia', vasos: 9 } },
                { fecha: '2026-11-06', datos: { tipo: 'dia', vasos: 9 } }, // hueco el 7: corta la racha
                { fecha: '2026-11-01', datos: { tipo: 'dia', vasos: 9 } }  // fuera de la semana
            ]
        }, HOY);
        assert.strictEqual(r.agua.meta, 8, 'meta del horario por defecto');
        assert.strictEqual(r.agua.diasMeta, 3);
        assert.strictEqual(r.agua.mediaVasos, 3.7);
        assert.deepStrictEqual(r.rachas, [{ modulo: 'agua', nombre: 'Agua', valor: 2, unidad: 'días' }],
            'hoy aún no ha cumplido, pero la racha sigue viva desde ayer');
    });

    await t.test('S2: diario cuenta los días escritos y el ánimo medio', () => {
        const r = reglas.resumenSemana({
            diario: [{ fecha: HOY, datos: { humor: 5 } }, { fecha: '2026-11-09', datos: { humor: 2 } }, { fecha: '2026-11-07', datos: {} }]
        }, HOY);
        assert.deepStrictEqual(r.diario, { dias: 3, humorMedio: 3.5 });
        assert.strictEqual(r.rachas[0].valor, 2, 'hoy y ayer');
    });

    await t.test('S3: gimnasio cuenta la racha en semanas', () => {
        const r = reglas.resumenSemana({
            gimnasio: [
                { fecha: '2026-11-04', datos: { tipo: 'sesion' } }, // semana pasada
                { fecha: '2026-10-27', datos: { tipo: 'sesion' } }, // la anterior
                { fecha: '2026-10-28', datos: { tipo: 'rutina' } }  // una rutina no es un entreno
            ]
        }, HOY);
        assert.strictEqual(r.gimnasio.entrenos, 1);
        assert.deepStrictEqual(r.rachas[0], { modulo: 'gimnasio', nombre: 'Gimnasio', valor: 2, unidad: 'semanas' });
    });

    await t.test('S4: próximos 7 días de estudio y eventos, ordenados', () => {
        const r = reglas.resumenSemana({
            estudio: [{ fecha: '2026-11-15', datos: { titulo: 'Examen', tipo: 'examen' } }, { fecha: '2026-12-01', datos: { titulo: 'Lejos' } }],
            eventos: [{ fecha: '2026-11-12', datos: { titulo: 'Cena' } }, { fecha: '2026-11-11', datos: { titulo: 'Comida' } }, { fecha: '2026-11-09', datos: { titulo: 'Pasado' } }]
        }, HOY);
        assert.deepStrictEqual(r.estudio.proximos.map((p) => p.titulo), ['Examen']);
        assert.deepStrictEqual(r.eventos.proximos.map((p) => p.fecha), ['2026-11-11', '2026-11-12']);
    });

    await t.test('S5: solo aparecen los módulos activos', () => {
        const r = reglas.resumenSemana({}, HOY);
        assert.deepStrictEqual(r, { desde: '2026-11-04', hasta: HOY, rachas: [] });
    });

    await t.test('S6: validaciones de resumen y exportar', async () => {
        assert.strictEqual((await logica.resumenSemanal('a@b.com', 'ayer')).exito, false);
        assert.strictEqual((await logica.exportarDatos('a@b.com', 'pdf')).exito, false);
        assert.strictEqual((await logica.exportarDatos('no-es-email', 'json')).exito, false);
    });
});
