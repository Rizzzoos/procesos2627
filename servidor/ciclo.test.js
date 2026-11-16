// Pruebas de Mi ciclo (predicción). Funciones puras, «hoy» fijo.
const test = require('node:test');
const assert = require('node:assert');
const reglas = require('./reglas.js');

const mas = (k, n) => reglas.sumarDias(k, n);

// Reglas cada 28 días desde el 1 de julio, de 5 días; antojos 2-3 días antes de cada regla
function historial(inicio, ciclos, duracion = 28, conAntojos = true) {
    const dias = [];
    for (let c = 0; c < ciclos; c++) {
        const ini = mas(inicio, c * duracion);
        for (let d = 0; d < 5; d++) dias.push({ fecha: mas(ini, d), sangrado: d < 2 ? 3 : 2, sintomas: [] });
        if (conAntojos && c > 0) {
            dias.push({ fecha: mas(ini, -3), sangrado: 0, sintomas: ['antojos'] });
            dias.push({ fecha: mas(ini, -2), sangrado: 0, sintomas: ['antojos', 'pecho'] });
        }
    }
    return dias;
}

test('Mi ciclo', async (t) => {
    await t.test('C1: sin datos usa 28 días y no predice fechas', () => {
        const r = reglas.analizarCiclo([], '2026-11-16');
        assert.strictEqual(r.hayDatos, false);
        assert.strictEqual(r.duracionCiclo, 28);
        assert.strictEqual(r.proximaRegla, undefined);
    });

    await t.test('C2: con una sola regla predice con 28 días y confianza baja', () => {
        const r = reglas.analizarCiclo([{ fecha: '2026-11-01', sangrado: 3 }, { fecha: '2026-11-02', sangrado: 2 }], '2026-11-10');
        assert.strictEqual(r.diaCiclo, 10);
        assert.strictEqual(r.proximaRegla, '2026-11-29');
        assert.strictEqual(r.ovulacion, '2026-11-15');
        assert.deepStrictEqual(r.fertil, { desde: '2026-11-10', hasta: '2026-11-16' });
        assert.strictEqual(r.fase, 'fertil');
        assert.strictEqual(r.confianza, 'baja');
    });

    await t.test('C3: aprende la duración media y gana confianza con más ciclos', () => {
        const dias = historial('2026-06-01', 6, 30, false);   // 5 ciclos completos de 30 días
        const r = reglas.analizarCiclo(dias, mas('2026-06-01', 5 * 30 + 10));
        assert.strictEqual(r.duracionCiclo, 30);
        assert.strictEqual(r.duracionRegla, 5);
        assert.strictEqual(r.ciclosCompletos, 5);
        assert.strictEqual(r.confianza, 'alta');
        assert.strictEqual(r.proximaRegla, mas('2026-06-01', 6 * 30));
    });

    await t.test('C4: detecta síntomas que se repiten y avisa en esos días', () => {
        const dias = historial('2026-07-01', 5);              // 4 ciclos completos de 28
        const ultima = mas('2026-07-01', 4 * 28);
        const proxima = mas(ultima, 28);
        const r = reglas.analizarCiclo(dias, mas(proxima, -3));
        const antojos = r.patrones.find((p) => p.sintoma === 'antojos');
        assert.ok(antojos, 'encuentra el patrón de antojos');
        assert.deepStrictEqual([antojos.referencia, antojos.desde, antojos.hasta, antojos.ciclos, antojos.de], ['antes', 3, 2, 4, 4]);
        assert.ok(r.avisos.some((a) => a.sintoma === 'antojos' && a.texto.startsWith('Estos días')));
        assert.ok(r.avisos.some((a) => a.tipo === 'regla' && a.texto.includes('en 3 días')));
    });

    await t.test('C5: un síntoma suelto no es patrón; el manchado no empieza una regla', () => {
        const dias = historial('2026-07-01', 4, 28, false);
        dias.push({ fecha: '2026-07-20', sangrado: 0, sintomas: ['granos'] });
        dias.push({ fecha: '2026-08-10', sangrado: 1 });     // manchado suelto a mitad de ciclo
        const r = reglas.analizarCiclo(dias, '2026-10-01');
        assert.strictEqual(r.patrones.length, 0);
        assert.strictEqual(r.ciclosCompletos, 3);
        assert.strictEqual(r.duracionCiclo, 28);
    });

    await t.test('C7: lo que pasa al empezar la regla se cuenta como «día 1» y se avisa en la siguiente', () => {
        const dias = historial('2026-07-01', 5, 28, false);
        for (let c = 0; c < 5; c++) dias.push({ fecha: mas('2026-07-01', c * 28), sangrado: 3, sintomas: ['dolor'] });
        const proxima = mas('2026-07-01', 5 * 28);
        const r = reglas.analizarCiclo(dias, mas(proxima, -1));
        const dolor = r.patrones.find((p) => p.sintoma === 'dolor');
        assert.deepStrictEqual([dolor.referencia, dolor.desde, dolor.hasta], ['inicio', 1, 1]);
        assert.ok(r.avisos.some((a) => a.sintoma === 'dolor' && a.texto.includes('En 1 día')));
    });

    await t.test('C6: si se pasa la fecha avisa del retraso', () => {
        const r = reglas.analizarCiclo([{ fecha: '2026-10-01', sangrado: 3 }], '2026-11-02');
        assert.strictEqual(r.retraso, 4);
        assert.ok(r.avisos[0].texto.includes('4 días de retraso'));
    });
});
