// ============================================================
// CAPA DE ACCESO A DATOS (persistencia)
// Único módulo que habla con MongoDB Atlas (Mongoose).
// No contiene reglas de negocio: solo leer/escribir documentos.
// ============================================================
const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    nombre: { type: String, default: '' },
    rol: { type: String, default: 'usuario' },
    // Hito 4: confirmación de la cuenta por correo.
    // Default true para no bloquear a las cuentas que ya existen en la BD;
    // los registros nuevos se crean con confirmada: false de forma explícita.
    confirmada: { type: Boolean, default: true },
    tokenConfirmacion: { type: String, default: undefined },
    confirmacionCaduca: { type: Date, default: undefined },
    fechaRegistro: { type: Date, default: Date.now }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

// Crear un documento usuario en la colección "usuarios"
// confirmacion: si se pasa { token, caduca }, la cuenta nace pendiente de confirmar.
async function crearUsuario(email, password, nombre = '', rol = 'usuario', confirmacion = null) {
    const nuevoUsuario = new Usuario({
        email,
        password,
        nombre,
        rol,
        ...(confirmacion
            ? { confirmada: false, tokenConfirmacion: confirmacion.token, confirmacionCaduca: confirmacion.caduca }
            : {})
    });
    await nuevoUsuario.save();
    return nuevoUsuario;
}

// Buscar un usuario por su email
async function buscarPorEmail(email) {
    return Usuario.findOne({ email });
}

// Devolver el listado de todos los usuarios (solo email y rol)
async function listarTodos() {
    return Usuario.find({}, 'email rol');
}

// Eliminar un usuario por su email (devuelve null si no existía)
async function eliminarPorEmail(email) {
    return Usuario.findOneAndDelete({ email });
}

// Cambiar el rol de un usuario (por ejemplo, promoverlo a admin)
async function cambiarRol(email, nuevoRol) {
    return Usuario.findOneAndUpdate({ email }, { rol: nuevoRol }, { new: true });
}

// Hito 4: buscar la cuenta por el token de confirmación (ojo: por el token, no por email)
async function buscarPorToken(token) {
    return Usuario.findOne({ tokenConfirmacion: token });
}

// Hito 4: marcar la cuenta como confirmada y limpiar el token (ya no se reutiliza)
async function confirmarCuenta(email) {
    return Usuario.findOneAndUpdate(
        { email },
        { $set: { confirmada: true }, $unset: { tokenConfirmacion: '', confirmacionCaduca: '' } },
        { new: true }
    );
}

// Hito 4: guardar (o renovar) el token de confirmación de una cuenta pendiente
async function guardarToken(email, token, caduca) {
    return Usuario.findOneAndUpdate(
        { email },
        { $set: { tokenConfirmacion: token, confirmacionCaduca: caduca } },
        { new: true }
    );
}

module.exports = {
    crearUsuario,
    buscarPorEmail,
    listarTodos,
    eliminarPorEmail,
    cambiarRol,
    buscarPorToken,
    confirmarCuenta,
    guardarToken
};
