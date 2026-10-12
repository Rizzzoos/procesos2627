const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fechaRegistro: { type: Date, default: Date.now }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

// Función 1: Solo para crear cuentas nuevas
async function registrarUsuario(email, password) {
    try {
        const usuarioExistente = await Usuario.findOne({ email: email });
        if (usuarioExistente) {
            return { exito: false, error: 'Este correo ya tiene una cuenta. Inicia sesión.' };
        }
        
        const nuevoUsuario = new Usuario({ email, password });
        await nuevoUsuario.save();
        return { exito: true, mensaje: 'Cuenta creada con éxito.' };
    } catch (error) {
        return { exito: false, error: 'Error al conectar con la base de datos.' };
    }
}

// Función 2: Solo para entrar en cuentas que ya existen
async function loginUsuario(email, password) {
    try {
        const usuarioExistente = await Usuario.findOne({ email: email });
        if (!usuarioExistente) {
            return { exito: false, error: 'No existe ninguna cuenta con este correo.' };
        }
        
        if (usuarioExistente.password === password) {
            return { exito: true, mensaje: '¡Bienvenida de nuevo!' };
        } else {
            return { exito: false, error: 'Contraseña incorrecta. Inténtalo de nuevo.' };
        }
    } catch (error) {
        return { exito: false, error: 'Error al conectar con la base de datos.' };
    }
}

// ESTA ES LA LÍNEA CLAVE QUE FALTABA O NO ESTABA GUARDADA
module.exports = { registrarUsuario, loginUsuario };