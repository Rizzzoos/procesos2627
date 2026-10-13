// ============================================================
// CAPA DE ACCESO A DATOS (persistencia)
// Único módulo que habla con MongoDB Atlas (Mongoose).
// No contiene reglas de negocio: solo leer/escribir documentos.
// ============================================================
const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rol: { type: String, default: 'usuario' },
    fechaRegistro: { type: Date, default: Date.now }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

// Crear un documento usuario en la colección "usuarios"
async function crearUsuario(email, password, rol = 'usuario') {
    const nuevoUsuario = new Usuario({ email, password, rol });
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

module.exports = {
    crearUsuario,
    buscarPorEmail,
    listarTodos,
    eliminarPorEmail
};
