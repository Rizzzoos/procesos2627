const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const usuarioSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rol: { type: String, default: 'usuario' },
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
        
        // LÍNEAS NUEVAS: Encriptar la contraseña con 10 rondas de seguridad
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);
        
        // Guardamos la contraseña encriptada, no la original
        const nuevoUsuario = new Usuario({ email, password: passwordEncriptada });
        await nuevoUsuario.save();
        
        console.log(`[LOG - SEGURIDAD] Nuevo usuario registrado: ${email}`);
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
        
        // LÍNEA NUEVA: Comparar la contraseña introducida con el hash de la base de datos
        const contraseñaCorrecta = await bcrypt.compare(password, usuarioExistente.password);
        
        if (contraseñaCorrecta) {
            console.log(`[LOG - SEGURIDAD] Inicio de sesión exitoso: ${email}`);
            return { exito: true, mensaje: '¡Bienvenida de nuevo!', rol: usuarioExistente.rol };
        } else {
            console.log(`[LOG - ALERTA] Intento de login fallido para: ${email}`);
            return { exito: false, error: 'Contraseña incorrecta. Inténtalo de nuevo.' };
        }
    } catch (error) {
        return { exito: false, error: 'Error al conectar con la base de datos.' };
    }
}


// 1. Listar usuarios (solo administrador)
async function listarUsuarios(rolSolicitante) {
    if (rolSolicitante !== 'admin') {
        console.log(`[LOG - ALERTA] Intento de listar usuarios denegado`);
        return { exito: false, error: 'Acceso denegado. Solo para administradores.' };
    }
    try {
        // Devuelve solo el email y el rol de todos los usuarios
        const usuarios = await Usuario.find({}, 'email rol');
        return { exito: true, datos: usuarios };
    } catch (error) {
        return { exito: false, error: 'Error al obtener la lista de usuarios.' };
    }
}

// 2. Comprobar estado de un usuario (solo administrador)
async function comprobarEstado(email, rolSolicitante) {
    if (rolSolicitante !== 'admin') {
        return { exito: false, error: 'Acceso denegado.' };
    }
    try {
        const usuario = await Usuario.findOne({ email: email });
        // Si el usuario existe en la BD, está activo. Si no, fue eliminado o no existe.
        if (!usuario) return { exito: true, activo: false };
        return { exito: true, activo: true };
    } catch (error) {
        return { exito: false, error: 'Error al comprobar el estado del usuario.' };
    }
}

// 3. Eliminar usuario (Admin borra a cualquiera; Usuario normal solo a sí mismo)
async function eliminarUsuario(emailAEliminar, emailSolicitante, rolSolicitante) {
    // Si NO es admin, y el email que quiere borrar NO es el suyo propio -> Bloqueo
    if (rolSolicitante !== 'admin' && emailAEliminar !== emailSolicitante) {
        console.log(`[LOG - ALERTA] Intento de borrado no autorizado por: ${emailSolicitante}`);
        return { exito: false, error: 'No tienes permiso para eliminar esta cuenta.' };
    }
    try {
        await Usuario.findOneAndDelete({ email: emailAEliminar });
        console.log(`[LOG - SEGURIDAD] Usuario eliminado: ${emailAEliminar} por ${emailSolicitante}`);
        return { exito: true, mensaje: 'Usuario eliminado correctamente.' };
    } catch (error) {
        return { exito: false, error: 'Error al eliminar la cuenta.' };
    }
}


// ESTA ES LA LÍNEA CLAVE QUE FALTABA O NO ESTABA GUARDADA
module.exports = { 
    registrarUsuario, 
    loginUsuario, 
    listarUsuarios, 
    comprobarEstado, 
    eliminarUsuario 
};