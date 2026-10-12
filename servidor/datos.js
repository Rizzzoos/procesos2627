const mongoose = require('mongoose');

// 1. Definimos el "Molde" (Schema) de nuestros usuarios
const usuarioSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fechaRegistro: { type: Date, default: Date.now }
});

// 2. Creamos el modelo basado en el esquema
const Usuario = mongoose.model('Usuario', usuarioSchema);

// 3. Función para registrar o identificar al usuario
async function procesarUsuario(email, password) {
    try {
        // Buscamos si el usuario ya existe en la base de datos
        const usuarioExistente = await Usuario.findOne({ email: email });
        
        if (usuarioExistente) {
            // Podríamos validar la contraseña aquí, pero por ahora lo damos por logueado
            return { exito: true, mensaje: '¡Bienvenida de nuevo a tu espacio Dasna!' };
        }
        
        // Si no existe, creamos un nuevo usuario y lo guardamos
        const nuevoUsuario = new Usuario({ email, password });
        await nuevoUsuario.save();
        
        return { exito: true, mensaje: 'Tu aura se ha registrado con éxito en Dasna.' };
    } catch (error) {
        console.error("Error en la base de datos:", error);
        return { exito: false, error: 'Hubo una interferencia al conectar con el universo.' };
    }
}

module.exports = { procesarUsuario };