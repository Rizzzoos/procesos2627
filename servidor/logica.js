// ============================================================
// CAPA DE LÓGICA DE NEGOCIO
// Reglas de gestión de usuarios: registro, acceso, roles...
// No conoce Express ni HTTP (solo llamadas a la capa de datos).
// ============================================================
const bcrypt = require('bcrypt');
const crypto = require('node:crypto'); // Hito 4: tokens de confirmación
const mongoose = require('mongoose');  // Hitos 5: validación de ObjectId
const datos = require('./datos.js');
const reglas = require('./reglas.js'); // Sprint 2: reglas de los módulos (PBI-27)
const correo = require('./correo.js'); // Hito 4: envío de correos (servicio externo)

// Función 1: Solo para crear cuentas nuevas
// Hito 4: la cuenta nace PENDIENTE y se envía un correo de confirmación.
async function registrarUsuario(email, password, nombre = '') {
    try {
        // Validaciones del registro (reglas de negocio)
        if (!password || password.length < 8) {
            return { exito: false, error: 'La contraseña debe tener mínimo 8 caracteres.' };
        }
        const usuarioExistente = await datos.buscarPorEmail(email);
        if (usuarioExistente) {
            // Si la cuenta existe pero está PENDIENTE de confirmar, no es un
            // error: le reenviamos el correo con un token nuevo. Así nadie se
            // queda bloqueado si el primer envío falló o no llegó.
            if (usuarioExistente.confirmada === false) {
                const tokenNuevo = crypto.randomBytes(32).toString('hex');
                const caducaNueva = new Date(Date.now() + 24 * 60 * 60 * 1000);
                await datos.guardarToken(email, tokenNuevo, caducaNueva);
                try {
                    await correo.enviarConfirmacion(email, tokenNuevo);
                } catch (error) {
                    console.error('[LOG - CORREO] No se pudo reenviar el correo de confirmación:', error.message);
                    return {
                        exito: false,
                        error: 'No se pudo enviar el correo de confirmación. Inténtalo de nuevo en unos minutos.'
                    };
                }
                console.log(`[LOG - SEGURIDAD] Correo de confirmación reenviado a: ${email}`);
                return {
                    exito: true,
                    mensaje: 'Te hemos reenviado el correo de confirmación: abre el enlace para activar tu cuenta.'
                };
            }
            return { exito: false, error: 'Este correo ya tiene una cuenta. Inicia sesión.' };
        }

        // Encriptar la contraseña con 10 rondas de seguridad
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);

        // Token de un solo uso para confirmar la cuenta (caduca en 24 h)
        const token = crypto.randomBytes(32).toString('hex');
        const caduca = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Guardamos la contraseña encriptada, no la original
        await datos.crearUsuario(email, passwordEncriptada, nombre, 'usuario', { token, caduca });

        // Enviamos el correo (si falla, la cuenta queda pendiente y se puede reintentar)
        try {
            await correo.enviarConfirmacion(email, token);
        } catch (error) {
            console.error('[LOG - CORREO] No se pudo enviar el correo de confirmación:', error.message);
            return {
                exito: false,
                error: 'La cuenta se ha creado pero no se pudo enviar el correo de confirmación. Inténtalo de nuevo en unos minutos.'
            };
        }

        console.log(`[LOG - SEGURIDAD] Nuevo usuario registrado (pendiente de confirmar): ${email}`);
        return {
            exito: true,
            mensaje: 'Cuenta creada. Hemos enviado un correo de confirmación: abre el enlace para activarla.'
        };
    } catch (error) {
        return { exito: false, error: 'Error al conectar con la base de datos.' };
    }
}

// Hito 4: confirmar la cuenta con el token del correo
async function confirmarCuenta(token) {
    if (!token || typeof token !== 'string') {
        return { exito: false, error: 'Enlace de confirmación no válido.' };
    }
    try {
        const usuario = await datos.buscarPorToken(token);
        if (!usuario) {
            return { exito: false, error: 'Este enlace de confirmación no es válido o ya se ha usado.' };
        }
        if (!usuario.confirmacionCaduca || usuario.confirmacionCaduca < new Date()) {
            return { exito: false, error: 'El enlace de confirmación ha caducado. Regístrate de nuevo para recibir otro.' };
        }
        await datos.confirmarCuenta(usuario.email);
        console.log(`[LOG - SEGURIDAD] Cuenta confirmada: ${usuario.email}`);
        return { exito: true, mensaje: 'Cuenta confirmada. Ya puedes iniciar sesión.' };
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

        // Hito 4: la cuenta debe estar confirmada con el correo
        if (usuarioExistente.confirmada === false) {
            return {
                exito: false,
                error: 'Tu cuenta aún no está confirmada. Revisa tu correo y abre el enlace de confirmación.'
            };
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

// ============================================================
// RECUPERAR CONTRASEÑA
// 1. solicitarRecuperacion: genera un token de un solo uso (1 h) y lo
//    manda por correo. En la base de datos se guarda solo su hash SHA-256,
//    así que quien lea la BD no puede usar el enlace.
// 2. restablecerPassword: con el token del enlace, guarda la contraseña
//    nueva (con bcrypt), confirma la cuenta y borra el token.
// La respuesta de 1 es la misma exista o no la cuenta (decisión D-16).
// ============================================================
const HORA_MS = 60 * 60 * 1000;
const MENSAJE_RECUPERAR = 'Si hay una cuenta con ese correo, te hemos enviado un enlace para elegir una contraseña nueva. Caduca en 1 hora.';
const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

async function solicitarRecuperacion(email) {
    if (!esEmailValido(email)) return { exito: false, error: 'Escribe un correo válido.' };
    try {
        const usuario = await datos.buscarPorEmail(email);
        if (usuario) {
            const token = crypto.randomBytes(32).toString('hex');
            await datos.guardarTokenRecuperar(email, hashToken(token), new Date(Date.now() + HORA_MS));
            try {
                await correo.enviarRecuperacion(email, token);
            } catch (error) {
                console.error('[LOG - CORREO] No se pudo enviar el correo de recuperación:', error.message);
                return { exito: false, error: 'No se pudo enviar el correo. Inténtalo de nuevo en unos minutos.' };
            }
            console.log(`[LOG - SEGURIDAD] Recuperación de contraseña pedida para: ${email}`);
        }
        return { exito: true, mensaje: MENSAJE_RECUPERAR };
    } catch (error) {
        return { exito: false, error: 'Error al conectar con la base de datos.' };
    }
}

async function restablecerPassword(token, password) {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
        return { exito: false, error: 'El enlace para cambiar la contraseña no es válido.' };
    }
    if (typeof password !== 'string' || password.length < 8) {
        return { exito: false, error: 'La contraseña debe tener mínimo 8 caracteres.' };
    }
    try {
        const usuario = await datos.buscarPorTokenRecuperar(hashToken(token));
        if (!usuario) {
            return { exito: false, error: 'Este enlace no es válido o ya se ha usado. Pide otro desde «¿Has olvidado tu contraseña?».' };
        }
        if (!usuario.recuperarCaduca || usuario.recuperarCaduca < new Date()) {
            return { exito: false, error: 'El enlace ha caducado. Pide otro desde «¿Has olvidado tu contraseña?».' };
        }
        const hash = await bcrypt.hash(password, 10);
        await datos.restablecerPassword(usuario.email, hash);
        console.log(`[LOG - SEGURIDAD] Contraseña cambiada con enlace de recuperación: ${usuario.email}`);
        return { exito: true, mensaje: 'Contraseña cambiada. Ya puedes iniciar sesión con la nueva.' };
    } catch (error) {
        return { exito: false, error: 'Error al conectar con la base de datos.' };
    }
}

// Regla de estado (spec §4.2): una cuenta está ACTIVA si está confirmada
// (por correo o por Google) y no se ha eliminado; si no, está PENDIENTE.
// Las cuentas antiguas no tienen el campo y cuentan como confirmadas.
function estadoDe(usuario) {
    if (!usuario) return 'eliminado';
    return usuario.confirmada === false ? 'pendiente' : 'activo';
}

// 1. Listar usuarios (solo administrador), con su estado
async function listarUsuarios(rolSolicitante) {
    if (rolSolicitante !== 'admin') {
        console.log(`[LOG - ALERTA] Intento de listar usuarios denegado`);
        return { exito: false, error: 'Acceso denegado. Solo para administradores.' };
    }
    try {
        const usuarios = await datos.listarTodos();
        const lista = usuarios.map((u) => ({
            email: u.email,
            rol: u.rol || 'usuario', // cuentas antiguas sin el campo
            estado: estadoDe(u),
            fechaRegistro: u.fechaRegistro
        }));
        return { exito: true, datos: lista };
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
        const estado = estadoDe(await datos.buscarPorEmail(email));
        return { exito: true, activo: estado === 'activo', estado };
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
        await datos.borrarDatosDe(emailAEliminar); // sus módulos y registros también
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
            // Sincronía con el .env: si la contraseña guardada no coincide con
            // ADMIN_PASSWORD, la actualizamos (una sola fuente de verdad).
            const coincide = await bcrypt.compare(password, existente.password);
            if (!coincide) {
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash(password, salt);
                await datos.actualizarPassword(email, hash);
                console.log('[LOG - ADMIN] Contraseña de administrador sincronizada desde ADMIN_PASSWORD.');
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

// Hito 4: iniciar sesión con un proveedor externo (Google).
// La capa API ya ha validado el token con Google y nos da email y nombre.
// Regla: si la cuenta no existe, se crea YA CONFIRMADA (Google ha verificado el correo).
async function entrarConGoogle(email, nombre = '') {
    try {
        let usuario = await datos.buscarPorEmail(email);
        if (!usuario) {
            // Contraseña aleatoria inutilizable: esta cuenta solo entra por OAuth.
            const aleatoria = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
            usuario = await datos.crearUsuario(email, aleatoria, nombre || '', 'usuario', null);
            console.log(`[LOG - SEGURIDAD] Cuenta creada con Google (confirmada): ${email}`);
        } else if (usuario.confirmada === false) {
            // Existía pendiente (la creó con contraseña): al confirmarla Google, queda activa.
            await datos.confirmarCuenta(email);
            console.log(`[LOG - SEGURIDAD] Cuenta pendiente confirmada vía Google: ${email}`);
        }
        return { exito: true, email: usuario.email, rol: usuario.rol };
    } catch (error) {
        return { exito: false, error: 'No se pudo completar el inicio de sesión con Google.' };
    }
}

// ============================================================
// HITO 5 - MOTOR DE MÓDULOS (vida personal)
// Catálogo de módulos y reglas comunes a todos ellos.
// Añadir un módulo = añadir una línea aquí + una vista en cliente.
// ============================================================
const CATALOGO = {
    visionboard: {
        nombre: 'Vision Board',
        icono: '✨',
        descripcion: 'Tus sueños y metas del año, con su plan y su collage.'
    },
    gimnasio: {
        nombre: 'Gimnasio',
        icono: '💪',
        descripcion: 'Tus rutinas, tus pesos y los días que vas.'
    },
    estudio: {
        nombre: 'Estudio',
        icono: '📚',
        descripcion: 'Exámenes, deberes y prácticas con recordatorios y plan de estudio.'
    },
    sueno: {
        nombre: 'Sueño',
        icono: '🌙',
        descripcion: 'A qué hora acostarte para no cortar los ciclos de sueño.'
    },
    ahorros: {
        nombre: 'Ahorros',
        icono: '💰',
        descripcion: 'Controla tus finanzas, establece objetivos económicos y visualiza tu capital.'
    },
    diario: {
        nombre: 'Diario',
        icono: '📖',
        descripcion: 'Vuelca tus pensamientos, reflexiones y agradecimientos del día a día.'
    },
    comidas: {
        nombre: 'Comidas',
        icono: '🍽️',
        descripcion: 'Tu cocina al día: alimentos, recetas propias, ideas y lista de la compra.'
    },
    pelislibros: {
        nombre: 'Películas Libros',
        icono: '🎬',
        descripcion: 'Tu estantería de libros, películas y series.'
    },
    viajes: {
        nombre: 'Viajes',
        icono: '✈️',
        descripcion: 'Tus viajes, los billetes que comprar y lo que quieres ver.'
    },
    agua: {
        nombre: 'Beber agua',
        icono: '💧',
        descripcion: 'Tus vasos del día con recordatorios según tu horario.'
    },
    outfits: {
        nombre: 'Outfits',
        icono: '👗',
        descripcion: 'Tus conjuntos y qué ponerte según el día.'
    },
    eventos: {
        nombre: 'Eventos',
        icono: '🎉',
        descripcion: 'Comidas, cenas, viajes, conciertos y festivales, escritos o dictados.'
    }
};

// Orden por defecto de la barra lateral (los 6 activos de fábrica)
const ORDEN_POR_DEFECTO = Object.keys(CATALOGO);

// Límites de seguridad comunes a todos los módulos
const MAX_REGISTROS_MODULO = 10000;
const MAX_BYTES_DATOS = 400 * 1024;  // 400 KB por registro (cabe una foto del diario)
const MAX_CLAVES_MODULOS = 50;

function esEmailValido(email) {
    return typeof email === 'string' && email.includes('@') && email.length <= 254;
}

function esObjetoPlano(datos) {
    return datos !== null
        && typeof datos === 'object'
        && !Array.isArray(datos)
        && Object.keys(datos).length > 0;
}

// Devuelve el catálogo como lista para el cliente
function listarModulos() {
    return ORDEN_POR_DEFECTO.map((clave) => ({ clave, ...CATALOGO[clave] }));
}

// Qué módulos tiene activos el usuario (si nunca lo guardó: los 6 por defecto)
async function obtenerModulos(email) {
    if (!esEmailValido(email)) return { exito: false, error: 'No autorizado.' };
    try {
        const guardado = await datos.buscarModulos(email);
        const claves = guardado && guardado.claves && guardado.claves.length
            ? guardado.claves
            : ORDEN_POR_DEFECTO;

        // Se cruza con el catálogo: si algún día borramos un módulo, no rompe
        const modulos = claves
            .filter((clave) => CATALOGO[clave])
            .map((clave) => ({ clave, ...CATALOGO[clave] }));

        // configurado = ya eligió sus módulos (si no, el cliente le guía la primera vez)
        const configurado = Boolean(guardado && guardado.claves && guardado.claves.length);
        return { exito: true, modulos, disponibles: listarModulos(), configurado };
    } catch (error) {
        return { exito: false, error: 'Error al leer tus módulos.' };
    }
}

// Guardar la configuración de la barra lateral (orden + visibles)
async function actualizarModulos(email, claves) {
    if (!esEmailValido(email)) return { exito: false, error: 'No autorizado.' };

    if (!Array.isArray(claves) || claves.length === 0) {
        return { exito: false, error: 'Debe haber al menos un módulo visible.' };
    }
    if (claves.length > MAX_CLAVES_MODULOS) {
        return { exito: false, error: `Demasiados módulos (máximo ${MAX_CLAVES_MODULOS}).` };
    }
    if (claves.some((c) => typeof c !== 'string')) {
        return { exito: false, error: 'Formato de módulos no válido.' };
    }
    const duplicados = new Set(claves).size !== claves.length;
    if (duplicados) return { exito: false, error: 'No puede haber módulos repetidos.' };

    const desconocidos = claves.filter((c) => !CATALOGO[c]);
    if (desconocidos.length) {
        return { exito: false, error: `Módulos no reconocidos: ${desconocidos.join(', ')}.` };
    }

    try {
        await datos.guardarModulos(email, claves);
        return await obtenerModulos(email);
    } catch (error) {
        return { exito: false, error: 'Error al guardar tus módulos.' };
    }
}

// Resolver la clave: existe el módulo y el filtro de fechas es válido
function resolverModulo(clave, filtros = {}) {
    if (!CATALOGO[clave]) {
        return { error: `El módulo "${clave}" no existe. Disponibles: ${ORDEN_POR_DEFECTO.join(', ')}.` };
    }
    const { desde, hasta, limite } = filtros;
    for (const [nombre, valor] of Object.entries({ desde, hasta })) {
        if (valor !== undefined && Number.isNaN(new Date(valor).getTime())) {
            return { error: `El filtro "${nombre}" no es una fecha válida.` };
        }
    }
    if (limite !== undefined) {
        const n = Number(limite);
        if (!Number.isFinite(n) || n < 1 || n > 500) {
            return { error: 'El límite debe estar entre 1 y 500.' };
        }
    }
    return { catalogo: CATALOGO[clave] };
}

// Listar los registros del usuario en un módulo
async function listarRegistrosModulo(email, clave, filtros) {
    if (!esEmailValido(email)) return { exito: false, error: 'No autorizado.' };
    const resuelto = resolverModulo(clave, filtros);
    if (resuelto.error) return { exito: false, error: resuelto.error };

    try {
        const registros = await datos.listarRegistros(email, clave, {
            desde: filtros.desde,
            hasta: filtros.hasta,
            limite: filtros.limite ? Number(filtros.limite) : undefined
        });
        return {
            exito: true,
            modulo: clave,
            datos: registros.map((r) => ({
                id: r._id,
                fecha: r.fecha,
                datos: r.datos
            }))
        };
    } catch (error) {
        return { exito: false, error: 'Error al leer los registros.' };
    }
}

// Crear un registro en un módulo
async function crearRegistroModulo(email, clave, datosNuevo, fecha) {
    if (!esEmailValido(email)) return { exito: false, error: 'No autorizado.' };
    const resuelto = resolverModulo(clave);
    if (resuelto.error) return { exito: false, error: resuelto.error };

    if (!esObjetoPlano(datosNuevo)) {
        return { exito: false, error: 'Los datos deben ser un objeto con al menos un campo.' };
    }
    if (Object.keys(datosNuevo).length > 50) {
        return { exito: false, error: 'Demasiados campos en el registro (máximo 50).' };
    }
    if (JSON.stringify(datosNuevo).length > MAX_BYTES_DATOS) {
        return { exito: false, error: 'El registro es demasiado grande (máximo 400 KB).' };
    }
    if (fecha !== undefined && Number.isNaN(new Date(fecha).getTime())) {
        return { exito: false, error: 'La fecha no es válida.' };
    }

    try {
        const cuenta = await datos.contarRegistros(email, clave);
        if (cuenta >= MAX_REGISTROS_MODULO) {
            return { exito: false, error: `Límite de registros alcanzado en ${CATALOGO[clave].nombre}.` };
        }
        const creado = await datos.crearRegistro(email, clave, datosNuevo, fecha);
        return { exito: true, mensaje: 'Registro guardado.', id: creado._id, fecha: creado.fecha };
    } catch (error) {
        return { exito: false, error: 'Error al guardar el registro.' };
    }
}

// Borrar un registro propio (si es de otro usuario, no se toca)
async function borrarRegistroModulo(email, clave, id) {
    if (!esEmailValido(email)) return { exito: false, error: 'No autorizado.' };
    if (!CATALOGO[clave]) return { exito: false, error: `El módulo "${clave}" no existe.` };
    if (!id || !mongoose.isValidObjectId(id)) {
        return { exito: false, error: 'Identificador de registro no válido.' };
    }

    try {
        const borrado = await datos.borrarRegistro(email, clave, id);
        if (!borrado) {
            return { exito: false, error: 'Este registro no existe o no es tuyo.' };
        }
        return { exito: true, mensaje: 'Registro eliminado.' };
    } catch (error) {
        return { exito: false, error: 'Error al eliminar el registro.' };
    }
}

// Actualizar los datos de un registro propio (p. ej. el diario de un día)
async function actualizarRegistroModulo(email, clave, id, datosNuevos) {
    if (!esEmailValido(email)) return { exito: false, error: 'No autorizado.' };
    if (!CATALOGO[clave]) return { exito: false, error: `El módulo "${clave}" no existe.` };
    if (!id || !mongoose.isValidObjectId(id)) {
        return { exito: false, error: 'Identificador de registro no válido.' };
    }
    if (!esObjetoPlano(datosNuevos)) {
        return { exito: false, error: 'Los datos deben ser un objeto con al menos un campo.' };
    }
    if (Object.keys(datosNuevos).length > 50) {
        return { exito: false, error: 'Demasiados campos en el registro (máximo 50).' };
    }
    if (JSON.stringify(datosNuevos).length > MAX_BYTES_DATOS) {
        return { exito: false, error: 'El registro es demasiado grande (máximo 400 KB).' };
    }

    try {
        const actualizado = await datos.actualizarRegistro(email, clave, id, datosNuevos);
        if (!actualizado) {
            return { exito: false, error: 'Este registro no existe o no es tuyo.' };
        }
        return { exito: true, mensaje: 'Registro actualizado.', id: actualizado._id, fecha: actualizado.fecha };
    } catch (error) {
        return { exito: false, error: 'Error al actualizar el registro.' };
    }
}

// ============================================================
// SPRINT 2 (PBI-27) - REGLAS DE LOS MÓDULOS
// El cliente ya no calcula: pide el resultado a esta capa.
// Aquí se valida la entrada y se delega en reglas.js (funciones puras).
// ============================================================
const MAX_TEXTO_REGLA = 300;
const MAX_LISTA_REGLA = 200;

const esTexto = (t) => typeof t === 'string' && t.trim() && t.length <= MAX_TEXTO_REGLA;
const esLista = (l) => Array.isArray(l) && l.length <= MAX_LISTA_REGLA;
const esHora = (h) => /^\d{1,2}:\d{2}$/.test(String(h || ''));

const REGLAS = {
    // «comida con amigos mañana» -> { fecha, resto }
    fecha: (p) => (esTexto(p.texto) ? reglas.interpretarFecha(p.texto, p.hoy) : 'Escribe una frase (máximo 300 caracteres).'),
    evento: (p) => (esTexto(p.texto) ? reglas.interpretarEvento(p.texto, p.hoy) : 'Escribe una frase (máximo 300 caracteres).'),
    estudio: (p) => (esTexto(p.texto) ? reglas.interpretarEstudio(p.texto, p.hoy) : 'Escribe una frase (máximo 300 caracteres).'),
    'plan-estudio': (p) => {
        if (!esLista(p.temas) || !p.temas.length) return 'Añade al menos un tema.';
        if (!reglas.esClave(p.examen) || p.examen <= p.hoy) return 'Pon una fecha de examen futura.';
        const horasDia = Number(p.horasDia);
        if (!(horasDia > 0 && horasDia <= 16)) return 'Las horas al día deben estar entre 0 y 16.';
        const temas = p.temas.map((t, i) => ({ nombre: String((t && t.nombre) || `Tema ${i + 1}`).slice(0, 80), horas: Math.max(0, Number(t && t.horas) || 0) }));
        return reglas.planificarTemas(temas, p.examen, horasDia, p.hoy);
    },
    agua: (p) => {
        if (!esHora(p.levantar) || !esHora(p.acostar)) return 'Indica a qué hora te levantas y te acuestas.';
        const comidas = esLista(p.comidas) ? p.comidas.filter(esHora) : [];
        return reglas.horarioAgua({ levantar: p.levantar, acostar: p.acostar, cada: p.cada, comidas });
    },
    sueno: (p) => {
        if (!esHora(p.cena) || !esHora(p.levantar)) return 'Indica a qué hora cenas y te levantas.';
        return reglas.horasSueno({ cena: p.cena, levantar: p.levantar, tardo: p.tardo });
    },
    outfits: (p) => (esLista(p.outfits) ? reglas.sugerirOutfits(p.outfits, p.pide || {}) : 'Lista de outfits no válida.'),
    visionboard: (p) => {
        if (!esLista(p.metas)) return 'Lista de metas no válida.';
        return p.metas.map((m) => reglas.planPorMeses(esLista(m && m.pasos) ? m.pasos : [], reglas.esClave(m && m.fecha) ? m.fecha : '', p.hoy));
    }
};

function listarReglas() {
    return Object.keys(REGLAS);
}

// Aplica una regla por su nombre. Devuelve { exito, datos } o { exito: false, error }
function aplicarRegla(nombre, params) {
    const regla = Object.prototype.hasOwnProperty.call(REGLAS, nombre) ? REGLAS[nombre] : null;
    if (!regla) return { exito: false, error: 'Esa regla no existe.' };
    if (!esObjetoPlano(params)) return { exito: false, error: 'Faltan los datos de la regla.' };
    if (!reglas.esClave(params.hoy)) return { exito: false, error: 'Falta la fecha de hoy (AAAA-MM-DD).' };
    try {
        const resultado = regla(params);
        if (typeof resultado === 'string') return { exito: false, error: resultado };
        return { exito: true, datos: resultado };
    } catch (error) {
        return { exito: false, error: 'No se pudo aplicar la regla.' };
    }
}

// ============================================================
// SPRINT 2 - IDEAS: resumen semanal y exportar datos
// ============================================================
const MODULOS_RESUMEN = ['agua', 'diario', 'gimnasio'];
const claveDeFecha = (f) => new Date(f).toISOString().slice(0, 10);

// Resumen de los últimos 7 días, solo de los módulos que tiene activos
async function resumenSemanal(email, hoy) {
    if (!esEmailValido(email)) return { exito: false, error: 'No autorizado.' };
    if (!reglas.esClave(hoy)) return { exito: false, error: 'Falta la fecha de hoy (AAAA-MM-DD).' };
    try {
        const { modulos } = await obtenerModulos(email);
        const activos = MODULOS_RESUMEN.filter((m) => (modulos || []).some((x) => x.clave === m));
        const desde = reglas.sumarDias(hoy, -6);
        const hasta = `${hoy}T23:59:59.999Z`;
        const registros = {};
        for (const m of activos) {
            const lista = await datos.listarRegistros(email, m, { desde, hasta, limite: 500 });
            registros[m] = lista.map((r) => ({ fecha: claveDeFecha(r.fecha), datos: r.datos || {} }));
        }
        return { exito: true, datos: reglas.resumenSemana(registros, hoy) };
    } catch (error) {
        return { exito: false, error: 'No se pudo preparar el resumen.' };
    }
}

// CSV: una fila por registro; los datos van como JSON en su columna
function aCsv(filas) {
    const celda = (v) => `"${String(v).replace(/"/g, '""')}"`;
    return ['modulo,fecha,datos', ...filas.map((r) => [r.modulo, r.fecha, JSON.stringify(r.datos)].map(celda).join(','))].join('\r\n');
}

// Exportar lo de una persona, todo o un módulo (derecho de acceso y portabilidad)
async function exportarDatos(email, formato = 'json', modulo = '') {
    if (!esEmailValido(email)) return { exito: false, error: 'No autorizado.' };
    if (!['json', 'csv'].includes(formato)) return { exito: false, error: 'Formato no válido (json o csv).' };
    if (modulo && !CATALOGO[modulo]) return { exito: false, error: `El módulo "${modulo}" no existe.` };
    try {
        const usuario = await datos.buscarPorEmail(email);
        if (!usuario) return { exito: false, error: 'La cuenta no existe.' };
        const { modulos } = await obtenerModulos(email);
        const registros = (await datos.todosLosRegistros(email, modulo || undefined)).map((r) => ({
            id: String(r._id), modulo: r.modulo, fecha: claveDeFecha(r.fecha), datos: r.datos
        }));
        const dia = new Date().toISOString().slice(0, 10);
        const base = modulo ? `dasna-${modulo}-${dia}` : `dasna-${dia}`;
        if (formato === 'csv') {
            return { exito: true, nombre: `${base}.csv`, tipo: 'text/csv; charset=utf-8', contenido: '\uFEFF' + aCsv(registros) };
        }
        const todo = {
            exportado: new Date().toISOString(),
            cuenta: { email: usuario.email, nombre: usuario.nombre || '', rol: usuario.rol || 'usuario', fechaRegistro: usuario.fechaRegistro },
            modulos: modulo ? [modulo] : (modulos || []).map((m) => m.clave),
            registros
        };
        return { exito: true, nombre: `${base}.json`, tipo: 'application/json; charset=utf-8', contenido: JSON.stringify(todo, null, 2) };
    } catch (error) {
        return { exito: false, error: 'No se pudieron exportar tus datos.' };
    }
}

module.exports = {
    registrarUsuario,
    confirmarCuenta,
    entrarConGoogle,
    loginUsuario,
    solicitarRecuperacion,
    restablecerPassword,
    listarUsuarios,
    comprobarEstado,
    estadoDe,
    eliminarUsuario,
    asegurarAdmin,
    puedeEliminar,
    // Motor de módulos
    listarModulos,
    obtenerModulos,
    actualizarModulos,
    listarRegistrosModulo,
    crearRegistroModulo,
    borrarRegistroModulo,
    actualizarRegistroModulo,
    // Reglas de los módulos (Sprint 2)
    listarReglas,
    aplicarRegla,
    // Ideas: resumen y exportar
    resumenSemanal,
    exportarDatos
};
