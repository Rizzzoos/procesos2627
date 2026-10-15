// ============================================================
// CAPA DE LÓGICA DE NEGOCIO
// Reglas de gestión de usuarios: registro, acceso, roles...
// No conoce Express ni HTTP (solo llamadas a la capa de datos).
// ============================================================
const bcrypt = require('bcrypt');
const datos = require('./datos.js');

// Función 1: Solo para crear cuentas nuevas
async function registrarUsuario(email, password, nombre = '') {
    try {
        // Validaciones del registro (reglas de negocio)
        if (!password || password.length < 8) {
            return { exito: false, error: 'La contraseña debe tener mínimo 8 caracteres.' };
        }
        const usuarioExistente = await datos.buscarPorEmail(email);
        if (usuarioExistente) {
            return { exito: false, error: 'Este correo ya tiene una cuenta. Inicia sesión.' };
        }

        // Encriptar la contraseña con 10 rondas de seguridad
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);

        // Guardamos la contraseña encriptada, no la original
        await datos.crearUsuario(email, passwordEncriptada, nombre);

        console.log(`[LOG - SEGURIDAD] Nuevo usuario registrado: ${email}`);
        return { exito: true, mensaje: 'Cuenta creada con éxito.' };
    } catch (error) {
        return { exito: false, error: 'Error al conectar con la base de datos.' };
    }
}

// Función 2: Solo para entrar en cuentas que ya existen
async function loginUsuario(email, password) {
    try {
        const usuarioExistente = await datos.buscarPorEmail(email);
        if (!usuarioExistente) {
            return { exito: false, error: 'No existe ninguna cuenta con este correo.' };
        }

        // Comparar la contraseña introducida con el hash de la base de datos
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
        const usuarios = await datos.listarTodos();
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
        const usuario = await datos.buscarPorEmail(email);
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
        await datos.eliminarPorEmail(emailAEliminar);
        console.log(`[LOG - SEGURIDAD] Usuario eliminado: ${emailAEliminar} por ${emailSolicitante}`);
        return { exito: true, mensaje: 'Usuario eliminado correctamente.' };
    } catch (error) {
        return { exito: false, error: 'Error al eliminar la cuenta.' };
    }
}

// 4. Asegurar que existe el primer administrador (al arrancar el servidor)
// Es el mecanismo de creación del admin inicial: viene de las variables de
// entorno ADMIN_EMAIL y ADMIN_PASSWORD. Si ya existe, no hace nada.
async function asegurarAdmin(email, password) {
    try {
        if (!email || !password) {
            console.log('[LOG - ADMIN] No hay ADMIN_EMAIL/ADMIN_PASSWORD definidos. Omitido.');
            return true; // Nada que hacer: no es un error
        }
        const existente = await datos.buscarPorEmail(email);
        if (existente) {
            // Si existe pero no es admin, lo promovemos (idempotente)
            if (existente.rol !== 'admin') {
                await datos.cambiarRol(email, 'admin');
                console.log(`[LOG - ADMIN] Usuario ${email} promovido a administrador.`);
            } else {
                console.log(`[LOG - ADMIN] Cuenta de administrador verificada: ${email}`);
            }
            return true;
        }
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        await datos.crearUsuario(email, hash, '', 'admin');
        console.log(`[LOG - ADMIN] Creada la cuenta de administrador: ${email}`);
        return true;
    } catch (error) {
        console.error('[LOG - ADMIN] Error al asegurar el administrador:', error.message);
        return false; // Fallo transitorio: el llamante puede reintentar
    }
}

// 5. [VARIANTE 5] Decidir si un actor puede eliminar a un objetivo.
// Regla pura de negocio: NO accede a la base de datos ni conoce HTTP.
// Se aplican las reglas en este orden:
//   1) Un usuario solo puede eliminarse a sí mismo -> NO_AUTORIZADO
//   2) No se puede eliminar a un admin si es el último (administradores <= 1) -> ULTIMO_ADMIN
//   3) En cualquier otro caso, permitido (motivo null)
function puedeEliminar(actor, objetivo, administradores) {
    // Validación de la entrada: rol desconocido o datos ausentes/de tipo incorrecto
    const rolesValidos = ['usuario', 'admin'];
    const entradaValida =
        actor && objetivo &&
        typeof actor.id === 'string' && typeof objetivo.id === 'string' &&
        rolesValidos.includes(actor.rol) && rolesValidos.includes(objetivo.rol) &&
        Number.isInteger(administradores);

    if (!entradaValida) {
        return { error: 'Datos incorrectos: se espera actor y objetivo con id (texto) y rol (usuario|admin), y administradores entero.' };
    }

    // Regla 1: un usuario normal solo puede eliminarse a sí mismo
    if (actor.rol === 'usuario' && actor.id !== objetivo.id) {
        return { permitido: false, motivo: 'NO_AUTORIZADO' };
    }

    // Regla 2: no se puede eliminar al último administrador (ni siquiera a sí mismo)
    if (objetivo.rol === 'admin' && administradores <= 1) {
        return { permitido: false, motivo: 'ULTIMO_ADMIN' };
    }

    // Regla 3: cualquier otro caso está permitido
    return { permitido: true, motivo: null };
}

module.exports = {
    registrarUsuario,
    loginUsuario,
    listarUsuarios,
    comprobarEstado,
    eliminarUsuario,
    asegurarAdmin,
    puedeEliminar
};
