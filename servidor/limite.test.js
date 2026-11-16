const test = require('node:test');
const assert = require('node:assert');
const { crearLimitador } = require('./limite.js');

test('Límite de intentos de login por IP', async (t) => {
    await t.test('L1: deja pasar hasta el máximo de fallos y luego bloquea', () => {
        const l = crearLimitador({ max: 3, ventanaMs: 60000 });
        for (let i = 0; i < 3; i++) { assert.ok(l.comprobar('ip', 1000).permitido); l.fallo('ip', 1000); }
        const r = l.comprobar('ip', 1000);
        assert.strictEqual(r.permitido, false);
        assert.strictEqual(r.minutos, 1);
    });
    await t.test('L2: el bloqueo caduca con la ventana', () => {
        const l = crearLimitador({ max: 1, ventanaMs: 60000 });
        l.fallo('ip', 0);
        assert.strictEqual(l.comprobar('ip', 30000).permitido, false);
        assert.ok(l.comprobar('ip', 60000).permitido);
    });
    await t.test('L3: un login correcto borra los fallos y cada IP va aparte', () => {
        const l = crearLimitador({ max: 1, ventanaMs: 60000 });
        l.fallo('a', 0);
        assert.strictEqual(l.comprobar('a', 1).permitido, false);
        assert.ok(l.comprobar('b', 1).permitido);
        l.exito('a');
        assert.ok(l.comprobar('a', 2).permitido);
    });
});
