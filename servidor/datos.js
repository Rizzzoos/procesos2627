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
    // Recuperar contraseña: se guarda el HASH del token (no el token) y cuándo caduca
    tokenRecuperar: { type: String, default: undefined },
    recuperarCaduca: { type: Date, default: undefined },
    fechaRegistro: { type: Date, default: Date.now }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

// ============================================================
// HITO 5 - MOTOR DE MÓDULOS (vida personal)
// Dos colecciones nuevas y genéricas:
//   modulos  -> QUÉ módulos ve cada usuario y en qué orden
//   registros-> LOS DATOS de cada módulo (JSON flexible)
// Así, añadir un módulo nuevo no exige tocar la base de datos.
// ============================================================
const modulosSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    // Orden exacto de las claves visibles, p. ej. ['ahorros','diario','gimnasio']
    claves: { type: [String], default: [] },
    actualizadoEn: { type: Date, default: Date.now }
});

const registrosSchema = new mongoose.Schema({
    email: { type: String, required: true, index: true },   // dueño
    modulo: { type: String, required: true, index: true },  // clave del módulo
    fecha: { type: Date, default: Date.now },               // fecha que reporta el usuario
    datos: { type: mongoose.Schema.Types.Mixed, required: true }, // JSON flexible por módulo
    creadoEn: { type: Date, default: Date.now }
});

const Modulo = mongoose.model('Modulo', modulosSchema);
const Registro = mongoose.model('Registro', registrosSchema);

// --- Módulos: qué ve y en qué orden cada usuario ---

async function buscarModulos(email) {
    return Modulo.findOne({ email });
}

async function guardarModulos(email, claves) {
    return Modulo.findOneAndUpdate(
        { email },
        { $set: { claves, actualizadoEn: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
}

// --- Registros: datos de cada módulo ---

async function listarRegistros(email, modulo, { desde, hasta, limite = 200 } = {}) {
    const filtro = { email, modulo };
    if (desde || hasta) {
        filtro.fecha = {};
        if (desde) filtro.fecha.$gte = new Date(desde);
        if (hasta) filtro.fecha.$lte = new Date(hasta);
    }
    return Registro.find(filtro)
        .sort({ fecha: -1, _id: -1 })
        .limit(Math.min(limite, 500));
}

async function crearRegistro(email, modulo, datos, fecha) {
    const nuevo = new Registro({ email, modulo, datos, ...(fecha ? { fecha: new Date(fecha) } : {}) });
    await nuevo.save();
    return nuevo;
}

// Solo borra si el documento es DEL USUARIO y DEL MÓDULO (nunca ajeno)
async function borrarRegistro(email, modulo, id) {
    return Registro.findOneAndDelete({ _id: id, email, modulo });
}

// Todos los registros de una persona, o de uno de sus módulos (para exportar)
async function todosLosRegistros(email, modulo) {
    return Registro.find(modulo ? { email, modulo } : { email }, '-email -__v').sort({ modulo: 1, fecha: 1 }).limit(130000).lean();
}

// Al eliminar una cuenta se borra también todo lo que guardó
async function borrarDatosDe(email) {
    await Registro.deleteMany({ email });
    await Modulo.deleteMany({ email });
}

async function contarRegistros(email, modulo) {
    return Registro.countDocuments({ email, modulo });
}

// Solo actualiza si el documento es DEL USUARIO y DEL MÓDULO (nunca ajeno)
async function actualizarRegistro(email, modulo, id, datos) {
    return Registro.findOneAndUpdate(
        { _id: id, email, modulo },
        { $set: { datos } },
        { new: true }
    );
}

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

// Devolver el listado de todos los usuarios (email, rol y lo necesario para su estado)
async function listarTodos() {
    return Usuario.find({}, 'email rol confirmada fechaRegistro').lean();
}

// Eliminar un usuario por su email (devuelve null si no existía)
async function eliminarPorEmail(email) {
    return Usuario.findOneAndDelete({ email });
}

// Cambiar el rol de un usuario (por ejemplo, promoverlo a admin)
async function cambiarRol(email, nuevoRol) {
    return Usuario.findOneAndUpdate({ email }, { rol: nuevoRol }, { new: true });
}

// Sincronizar la contraseña de un usuario con la del .env (solo la usa
// asegurarAdmin para que ADMIN_PASSWORD sea la única fuente de verdad)
async function actualizarPassword(email, password) {
    return Usuario.findOneAndUpdate({ email }, { $set: { password } }, { new: true });
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

// Recuperar contraseña: guardar el hash del token y su caducidad
async function guardarTokenRecuperar(email, hashToken, caduca) {
    return Usuario.findOneAndUpdate(
        { email },
        { $set: { tokenRecuperar: hashToken, recuperarCaduca: caduca } },
        { new: true }
    );
}

async function buscarPorTokenRecuperar(hashToken) {
    return Usuario.findOne({ tokenRecuperar: hashToken });
}

// Nueva contraseña: la cuenta queda confirmada (abrir el correo lo demuestra)
// y el token se borra para que el enlace no sirva dos veces.
async function restablecerPassword(email, password) {
    return Usuario.findOneAndUpdate(
        { email },
        {
            $set: { password, confirmada: true },
            $unset: { tokenRecuperar: '', recuperarCaduca: '', tokenConfirmacion: '', confirmacionCaduca: '' }
        },
        { new: true }
    );
}

module.exports = {
    crearUsuario,
    buscarPorEmail,
    listarTodos,
    eliminarPorEmail,
    cambiarRol,
    actualizarPassword,
    buscarPorToken,
    confirmarCuenta,
    guardarToken,
    guardarTokenRecuperar,
    buscarPorTokenRecuperar,
    restablecerPassword,
    // Motor de módulos
    buscarModulos,
    guardarModulos,
    listarRegistros,
    crearRegistro,
    borrarRegistro,
    contarRegistros,
    todosLosRegistros,
    borrarDatosDe,
    actualizarRegistro
};
