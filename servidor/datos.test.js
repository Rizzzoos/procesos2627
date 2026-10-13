const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
require('dotenv').config(); // Cargamos los secretos para conectar a la BD
const datos = require('./datos.js');

test('Batería de pruebas de Gestión de Usuarios (Dasna)', async (t) => {
    // 0. Conectar a la base de datos de pruebas antes de empezar
    await mongoose.connect(process.env.MONGO_URI);
    
    // Generamos un correo aleatorio para no chocar con datos reales
    const emailTest = `test_${Date.now()}@universo.com`;
    const passwordTest = 'secreta123';

    await t.test('Prueba 1: Registro de usuario exitoso (Camino feliz)', async () => {
        const resultado = await datos.registrarUsuario(emailTest, passwordTest);
        assert.strictEqual(resultado.exito, true);
    });

    await t.test('Prueba 2: Error al registrar un email ya existente (Caso de error)', async () => {
        const resultado = await datos.registrarUsuario(emailTest, passwordTest);
        assert.strictEqual(resultado.exito, false);
        assert.strictEqual(resultado.error, 'Este correo ya tiene una cuenta. Inicia sesión.');
    });

    await t.test('Prueba 3: Inicio de sesión exitoso con clave correcta', async () => {
        const resultado = await datos.loginUsuario(emailTest, passwordTest);
        assert.strictEqual(resultado.exito, true);
    });

    await t.test('Prueba 4: Error al iniciar sesión con clave incorrecta (Caso de error)', async () => {
        const resultado = await datos.loginUsuario(emailTest, 'clave_falsa');
        assert.strictEqual(resultado.exito, false);
        assert.strictEqual(resultado.error, 'Contraseña incorrecta. Inténtalo de nuevo.');
    });

    await t.test('Prueba 5: Un usuario normal es rechazado al listar usuarios (Regla de rol)', async () => {
        const resultado = await datos.listarUsuarios('usuario');
        assert.strictEqual(resultado.exito, false);
        assert.strictEqual(resultado.error, 'Acceso denegado. Solo para administradores.');
    });

    // Limpieza: Borramos el usuario de prueba y desconectamos
    await mongoose.connection.collection('usuarios').deleteOne({ email: emailTest });
    await mongoose.disconnect();
});