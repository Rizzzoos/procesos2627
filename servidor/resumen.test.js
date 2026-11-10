// Pruebas del resumen de la semana (Sprint 2, ideas).
// Funciones puras: sin base de datos, con un «hoy» fijo.
const test = require('node:test');
const assert = require('node:assert');
const reglas = require('./reglas.js');
const logica = require('./logica.js');

const HOY = '2026-11-10'; // martes

test('Resumen semanal', async (t) => {
    await t.test('S1: agua cuenta la media y los días con la meta', () => {
        const r = reglas.resumenSemana({
            agua: [
                { fecha: '2026-11-09', datos: { tipo: 'dia', vasos: 8 } },
                { fecha: '2026-11-08', datos: { tipo: 'dia', vasos: 9 } },
                { fecha: '2026-11-06', datos: { tipo: 'dia', vasos: 4 } },
                { fecha: '2026-11-01', datos: { tipo: 'dia', vasos: 9 } }  // fuera de la semana
            ]
        }, HOY);
        assert.deepStrictEqual(r.agua, { meta: 8, mediaVasos: 3, diasMeta: 2 });
    });

    await t.test('S2: diario cuenta los días escritos y el ánimo medio', () => {
        const r = reglas.resumenSemana({
            diario: [{ fecha: HOY, datos: { humor: 5 } }, { fecha: '2026-11-09', datos: { humor: 2 } }, { fecha: '2026-11-07', datos: {} }]
        }, HOY);
        assert.deepStrictEqual(r.diario, { dias: 3, humorMedio: 3.5 });
    });

    await t.test('S3: gimnasio cuenta los entrenos (no las rutinas)', () => {
        const r = reglas.resumenSemana({
            gimnasio: [
                { fecha: '2026-11-04', datos: { tipo: 'sesion' } },
                { fecha: '2026-11-09', datos: { tipo: 'sesion' } },
                { fecha: '2026-11-08', datos: { tipo: 'rutina' } },
                { fecha: '2026-10-27', datos: { tipo: 'sesion' } } // fuera de la semana
            ]
        }, HOY);
        assert.deepStrictEqual(r.gimnasio, { entrenos: 2 });
    });

    await t.test('S4: solo aparecen los módulos activos', () => {
        assert.deepStrictEqual(reglas.resumenSemana({}, HOY), { desde: '2026-11-04', hasta: HOY });
    });

    await t.test('S5: validaciones de resumen y exportar', async () => {
        assert.strictEqual((await logica.resumenSemanal('a@b.com', 'ayer')).exito, false);
        assert.strictEqual((await logica.exportarDatos('a@b.com', 'pdf')).exito, false);
        assert.strictEqual((await logica.exportarDatos('no-es-email', 'json')).exito, false);
        const r = await logica.exportarDatos('a@b.com', 'json', 'inventado');
        assert.strictEqual(r.exito, false);
        assert.ok(r.error.includes('no existe'), 'un módulo que no existe se rechaza');
    });
});
