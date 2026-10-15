const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
require('dotenv').config(); // Cargamos los secretos para conectar a la BD
const logica = require('./logica.js'); // Probamos la capa de lógica de negocio

test('Batería de pruebas de Gestión de Usuarios (Dasna)', async (t) => {
    // 0. Conectar a la base de datos de pruebas antes de empezar
    await mongoose.connect(process.env.MONGO_URI);

    // Generamos un correo aleatorio para no chocar con datos reales
    const emailTest = `test_${Date.now()}@universo.com`;
    const passwordTest = 'secreta123';

    await t.test('Prueba 1: Registro de usuario exitoso (Camino feliz)', async () => {
        const resultado = await logica.registrarUsuario(emailTest, passwordTest);
        assert.strictEqual(resultado.exito, true);
    });

    await t.test('Prueba 2: Error al registrar un email ya existente (Caso de error)', async () => {
        const resultado = await logica.registrarUsuario(emailTest, passwordTest);
        assert.strictEqual(resultado.exito, false);
        assert.strictEqual(resultado.error, 'Este correo ya tiene una cuenta. Inicia sesión.');
    });

    await t.test('Prueba 3: Inicio de sesión exitoso con clave correcta', async () => {
        const resultado = await logica.loginUsuario(emailTest, passwordTest);
        assert.strictEqual(resultado.exito, true);
    });

    await t.test('Prueba 4: Error al iniciar sesión con clave incorrecta (Caso de error)', async () => {
        const resultado = await logica.loginUsuario(emailTest, 'clave_falsa');
        assert.strictEqual(resultado.exito, false);
        assert.strictEqual(resultado.error, 'Contraseña incorrecta. Inténtalo de nuevo.');
    });

    await t.test('Prueba 5: Un usuario normal es rechazado al listar usuarios (Regla de rol)', async () => {
        const resultado = await logica.listarUsuarios('usuario');
        assert.strictEqual(resultado.exito, false);
        assert.strictEqual(resultado.error, 'Acceso denegado. Solo para administradores.');
    });

    await t.test('Prueba 6: Un usuario normal no puede eliminar a otro usuario (Regla de rol)', async () => {
        const resultado = await logica.eliminarUsuario('victima@universo.com', 'atacante@universo.com', 'usuario');
        assert.strictEqual(resultado.exito, false);
        assert.strictEqual(resultado.error, 'No tienes permiso para eliminar esta cuenta.');
    });

    await t.test('Prueba 7: Un administrador sí puede listar a todos los usuarios (Regla de rol)', async () => {
        const resultado = await logica.listarUsuarios('admin');
        assert.strictEqual(resultado.exito, true);
        assert.ok(Array.isArray(resultado.datos));
    });

    // Limpieza: Borramos el usuario de prueba y desconectamos
    await mongoose.connection.collection('usuarios').deleteOne({ email: emailTest });
    await mongoose.disconnect();
});

// ============================================================
// [VARIANTE 5] Pruebas unitarias de la regla pura puedeEliminar()
// No tocan la base de datos: comprueban la lógica directamente.
// ============================================================

test('variante5: un usuario normal no puede eliminar a otro usuario (NO_AUTORIZADO)', () => {
    const r = logica.puedeEliminar(
        { id: 'u1', rol: 'usuario' },
        { id: 'u2', rol: 'usuario' },
        2
    );
    assert.deepStrictEqual(r, { permitido: false, motivo: 'NO_AUTORIZADO' });
});

test('variante5: no se puede eliminar al último administrador, ni siquiera siendo el mismo (ULTIMO_ADMIN)', () => {
    const aSíMismo = logica.puedeEliminar(
        { id: 'a1', rol: 'admin' },
        { id: 'a1', rol: 'admin' },
        1
    );
    assert.deepStrictEqual(aSíMismo, { permitido: false, motivo: 'ULTIMO_ADMIN' });

    const aOtroAdmin = logica.puedeEliminar(
        { id: 'a1', rol: 'admin' },
        { id: 'a2', rol: 'admin' },
        1
    );
    assert.deepStrictEqual(aOtroAdmin, { permitido: false, motivo: 'ULTIMO_ADMIN' });
});

test('variante5: un administrador sí puede eliminar a otro admin si queda más de uno', () => {
    const r = logica.puedeEliminar(
        { id: 'a1', rol: 'admin' },
        { id: 'a2', rol: 'admin' },
        2
    );
    assert.deepStrictEqual(r, { permitido: true, motivo: null });
});

test('variante5: un usuario puede eliminarse a sí mismo y un admin puede borrar usuarios', () => {
    const aSíMismo = logica.puedeEliminar(
        { id: 'u1', rol: 'usuario' },
        { id: 'u1', rol: 'usuario' },
        1
    );
    assert.deepStrictEqual(aSíMismo, { permitido: true, motivo: null });

    const adminBorraUsuario = logica.puedeEliminar(
        { id: 'a1', rol: 'admin' },
        { id: 'u9', rol: 'usuario' },
        1
    );
    assert.deepStrictEqual(adminBorraUsuario, { permitido: true, motivo: null });
});

test('variante5: un rol desconocido o datos ausentes devuelven error (caso de error)', () => {
    const rolDesconocido = logica.puedeEliminar(
        { id: 'x', rol: 'superadmin' },
        { id: 'y', rol: 'usuario' },
        1
    );
    assert.ok(rolDesconocido.error, 'debe responder con campo error');

    const datosAusentes = logica.puedeEliminar(undefined, undefined, undefined);
    assert.ok(datosAusentes.error, 'debe responder con campo error');

    const administradoresNoEntero = logica.puedeEliminar(
        { id: 'a1', rol: 'admin' },
        { id: 'u1', rol: 'usuario' },
        'varios'
    );
    assert.ok(administradoresNoEntero.error, 'debe responder con campo error');
});
