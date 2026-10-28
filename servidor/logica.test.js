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

    await t.test('Prueba 2: Registrar de nuevo un email PENDIENTE reenvía el correo (no bloquea)', async () => {
        // La cuenta de la prueba 1 sigue pendiente: no puede entrar, así que en
        // vez de dejarle sin salida, le reenviamos un correo nuevo.
        const resultado = await logica.registrarUsuario(emailTest, passwordTest);
        assert.strictEqual(resultado.exito, true);
        assert.ok(resultado.mensaje.includes('reenviado'), 'avisa de que se ha reenviado el correo');
    });

    // ===== HITO 4: confirmación de la cuenta por correo =====

    await t.test('Hito4a: la cuenta nueva queda PENDIENTE y el login se rechaza con mensaje claro', async () => {
        const resultado = await logica.loginUsuario(emailTest, passwordTest);
        assert.strictEqual(resultado.exito, false);
        assert.ok(resultado.error.includes('no está confirmada'), 'avisa de que falta confirmar');
    });

    await t.test('Hito4b: confirmar con un token inventado devuelve error claro (Caso de error)', async () => {
        const resultado = await logica.confirmarCuenta('token_que_no_existe_123');
        assert.strictEqual(resultado.exito, false);
        assert.ok(resultado.error.length > 0, 'devuelve un mensaje de error entendible');
    });

    await t.test('Hito4c: confirmar sin token devuelve error claro (Caso de error)', async () => {
        const resultado = await logica.confirmarCuenta(undefined);
        assert.strictEqual(resultado.exito, false);
    });

    await t.test('Hito4d: confirmamos la cuenta con el token real guardado en la BD', async () => {
        // El token sale de la BD: la API nunca lo devuelve por seguridad
        const doc = await mongoose.connection.collection('usuarios').findOne({ email: emailTest });
        assert.ok(doc && doc.tokenConfirmacion, 'el registro guardó un token de confirmación');
        assert.strictEqual(doc.confirmada, false, 'la cuenta nace pendiente');

        const resultado = await logica.confirmarCuenta(doc.tokenConfirmacion);
        assert.strictEqual(resultado.exito, true);
    });

    await t.test('Hito4e: el token NO se puede reutilizar tras confirmar (un solo uso)', async () => {
        const doc = await mongoose.connection.collection('usuarios').findOne({ email: emailTest });
        assert.strictEqual(doc.tokenConfirmacion, undefined, 'el token se borró al confirmar');

        const resultado = await logica.confirmarCuenta('el_mismo_token_de_antes');
        assert.strictEqual(resultado.exito, false);
    });

    await t.test('Prueba 3: Inicio de sesión exitoso con clave correcta (ya confirmada)', async () => {
        const resultado = await logica.loginUsuario(emailTest, passwordTest);
        assert.strictEqual(resultado.exito, true);
    });

    await t.test('Prueba 4: Error al iniciar sesión con clave incorrecta (Caso de error)', async () => {
        const resultado = await logica.loginUsuario(emailTest, 'clave_falsa');
        assert.strictEqual(resultado.exito, false);
        assert.strictEqual(resultado.error, 'Contraseña incorrecta. Inténtalo de nuevo.');
    });

    await t.test('Prueba 8: Registrar un email YA CONFIRMADO da error de duplicado (Caso de error)', async () => {
        // emailTest ya está confirmada (Hito4d): aquí sí es un duplicado real.
        const resultado = await logica.registrarUsuario(emailTest, passwordTest);
        assert.strictEqual(resultado.exito, false);
        assert.strictEqual(resultado.error, 'Este correo ya tiene una cuenta. Inicia sesión.');
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

    // ===== HITO 4: inicio de sesión con proveedor externo (Google) =====

    const emailGoogle = `oauth_${Date.now()}@gmail.com`;

    await t.test('Hito4f: Google crea la cuenta SIN contraseña y YA CONFIRMADA', async () => {
        const resultado = await logica.entrarConGoogle(emailGoogle, 'Usuaria Google');
        assert.strictEqual(resultado.exito, true);
        assert.strictEqual(resultado.email, emailGoogle);

        const doc = await mongoose.connection.collection('usuarios').findOne({ email: emailGoogle });
        assert.strictEqual(doc.confirmada, true, 'Google ya verificó el correo: no hace falta confirmar');
        assert.ok(!doc.tokenConfirmacion, 'no genera token de confirmación');
    });

    await t.test('Hito4g: repetir el acceso con Google no crea cuentas duplicadas', async () => {
        const antes = await mongoose.connection.collection('usuarios')
            .countDocuments({ email: emailGoogle });
        const resultado = await logica.entrarConGoogle(emailGoogle, 'Usuaria Google');
        assert.strictEqual(resultado.exito, true);
        const despues = await mongoose.connection.collection('usuarios')
            .countDocuments({ email: emailGoogle });
        assert.strictEqual(despues, antes, 'sigue habiendo una sola cuenta');
    });

    await t.test('Hito4h: una cuenta pendiente de confirmar se ACTIVA al entrar con Google', async () => {
        // emailTest ya fue confirmada en Hito4d; creamos otra pendiente a mano
        const emailPendiente = `pendiente_${Date.now()}@universo.com`;
        const bcrypt = require('bcrypt');
        await mongoose.connection.collection('usuarios').insertOne({
            email: emailPendiente,
            password: await bcrypt.hash('secreta123', 10),
            rol: 'usuario',
            confirmada: false
        });

        const resultado = await logica.entrarConGoogle(emailPendiente, '');
        assert.strictEqual(resultado.exito, true);

        const doc = await mongoose.connection.collection('usuarios').findOne({ email: emailPendiente });
        assert.strictEqual(doc.confirmada, true, 'Google confirma la cuenta en su lugar');

        await mongoose.connection.collection('usuarios').deleteOne({ email: emailPendiente });
    });

    // Limpieza: Borramos los usuarios de prueba y desconectamos
    await mongoose.connection.collection('usuarios').deleteOne({ email: emailTest });
    await mongoose.connection.collection('usuarios').deleteOne({ email: emailGoogle });
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

// ============================================================
// HITO 5 - Pruebas del motor de módulos (barra lateral + registros)
// ============================================================

test('Motor de módulos (Dasna)', async (t) => {
    await mongoose.connect(process.env.MONGO_URI);

    const emailA = `modulos_a_${Date.now()}@universo.com`;
    const emailB = `modulos_b_${Date.now()}@universo.com`;
    const emailBase = `modulos_${Date.now()}@universo.com`;
    // Un email siempre válido para las pruebas que no necesitan usuario real
    const email = emailBase;

    await t.test('1. Un usuario nuevo ve los 6 módulos por defecto', async () => {
        const r = await logica.obtenerModulos(email);
        assert.strictEqual(r.exito, true);
        assert.strictEqual(r.modulos.length, 6);
        assert.ok(r.modulos.every((m) => m.nombre && m.icono && m.descripcion));
        assert.strictEqual(r.modulos[0].clave, 'visionboard', 'respeta el orden por defecto');
    });

    await t.test('2. Se puede reordenar y ocultar módulos (barra lateral configurable)', async () => {
        const r = await logica.actualizarModulos(email, ['ahorros', 'diario', 'gimnasio']);
        assert.strictEqual(r.exito, true);
        assert.deepStrictEqual(
            r.modulos.map((m) => m.clave),
            ['ahorros', 'diario', 'gimnasio'],
            'respeta el orden que eligió la usuaria'
        );
    });

    await t.test('3. Rechaza módulos desconocidos o listas inválidas (Caso de error)', async () => {
        const desconocido = await logica.actualizarModulos(email, ['ahorros', 'inventado']);
        assert.strictEqual(desconocido.exito, false);
        assert.ok(desconocido.error.includes('inventado'));

        const vacio = await logica.actualizarModulos(email, []);
        assert.strictEqual(vacio.exito, false);

        const repetido = await logica.actualizarModulos(email, ['diario', 'diario']);
        assert.strictEqual(repetido.exito, false);

        const noLista = await logica.actualizarModulos(email, 'diario');
        assert.strictEqual(noLista.exito, false);
    });

    await t.test('4. Crear y listar registros en un módulo', async () => {
        const creado = await logica.crearRegistroModulo(email, 'ahorros', { concepto: 'Chucherías', cantidad: 4.5 });
        assert.strictEqual(creado.exito, true);

        const listado = await logica.listarRegistrosModulo(email, 'ahorros', {});
        assert.strictEqual(listado.exito, true);
        assert.strictEqual(listado.datos.length, 1);
        assert.strictEqual(listado.datos[0].datos.concepto, 'Chucherías');
        assert.strictEqual(listado.datos[0].datos.cantidad, 4.5, 'conserva los campos numéricos');
    });

    await t.test('5. Las validaciones comunes funcionan (Caso de error)', async () => {
        const claveMala = await logica.crearRegistroModulo(email, 'no-existe', { a: 1 });
        assert.strictEqual(claveMala.exito, false);
        assert.ok(claveMala.error.includes('no existe'));

        const datosVacios = await logica.crearRegistroModulo(email, 'ahorros', {});
        assert.strictEqual(datosVacios.exito, false);

        const datosArray = await logica.crearRegistroModulo(email, 'ahorros', [1, 2, 3]);
        assert.strictEqual(datosArray.exito, false);

        const fechaMala = await logica.crearRegistroModulo(email, 'ahorros', { a: 1 }, 'ayer_noche');
        assert.strictEqual(fechaMala.exito, false);
        assert.ok(fechaMala.error.includes('fecha'));

        const fechaListaMala = await logica.listarRegistrosModulo(email, 'ahorros', { desde: 'no-es-fecha' });
        assert.strictEqual(fechaListaMala.exito, false);
    });

    await t.test('6. Cada usuaria solo ve SUS registros (aislamiento)', async () => {
        await logica.crearRegistroModulo(emailA, 'diario', { texto: 'diario privado de A' });

        const veB = await logica.listarRegistrosModulo(emailB, 'diario', {});
        assert.strictEqual(veB.exito, true);
        assert.strictEqual(veB.datos.length, 0, 'B no ve nada de A');

        const veA = await logica.listarRegistrosModulo(emailA, 'diario', {});
        assert.strictEqual(veA.datos.length, 1, 'A sí ve lo suyo');
    });

    await t.test('7. Solo se borra lo propio y con id válido (Caso de error)', async () => {
        const creado = await logica.crearRegistroModulo(emailA, 'diario', { texto: 'para borrar' });
        const idPropio = String(creado.id);

        // Otro usuario intenta borrarlo: no debe existir para él
        const intentoAjeno = await logica.borrarRegistroModulo(emailB, 'diario', idPropio);
        assert.strictEqual(intentoAjeno.exito, false);
        assert.ok(intentoAjeno.error.includes('no existe o no es tuyo'));

        // Sigue existiendo para A (la del test 6 + esta)
        const sigueAhi = await logica.listarRegistrosModulo(emailA, 'diario', {});
        assert.strictEqual(sigueAhi.datos.length, 2, 'el intento ajeno no borró nada');

        // A lo borra de verdad
        const propio = await logica.borrarRegistroModulo(emailA, 'diario', idPropio);
        assert.strictEqual(propio.exito, true);

        const idMalo = await logica.borrarRegistroModulo(emailA, 'diario', 'esto-no-es-un-id');
        assert.strictEqual(idMalo.exito, false);
        assert.ok(idMalo.error.includes('no válido'));
    });

    await t.test('8. El módulo inexistente también falla al borrar (Caso de error)', async () => {
        const r = await logica.borrarRegistroModulo(email, 'otra-cosa', new mongoose.Types.ObjectId());
        assert.strictEqual(r.exito, false);
        assert.ok(r.error.includes('no existe'));
    });

    // Limpieza
    await mongoose.connection.collection('modulos').deleteMany({ email: { $in: [email, emailA, emailB] } });
    await mongoose.connection.collection('registros').deleteMany({ email: { $in: [email, emailA, emailB] } });
    await mongoose.disconnect();
});
