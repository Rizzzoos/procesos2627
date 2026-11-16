---
type: Requisitos
title: Requisitos del Sprint 1
description: Estado de cada requisito con su evidencia en el repositorio.
timestamp: 2026-10-28
---

Los estados se contrastan con la especificación del Sprint 1 (apartados 3 a 7), cuyo texto facilitó la persona responsable. Criterio: **hecho** = se cumple tal como lo pide, con evidencia; **parcial** = se cumple una parte (se indica qué falta); **pendiente** = no se cumple (una solución manual que sustituye al requisito cuenta como pendiente). Los parciales y pendientes pasan al [Sprint 2](sprint-2.md).

| ID | Requisito | Estado | Evidencia |
|---|---|---|---|
| ARQ-01 | Separación cliente-servidor y mismo origen | hecho | `servidor/index.js` sirve `cliente/` con `express.static`; toda la comunicación pasa por `/api`; el cliente no toca la base de datos ni ejecuta reglas de negocio; [README §Arquitectura en capas](../README.md#arquitectura-en-capas) |
| ARQ-02 | Capas del backend: API, lógica y datos | hecho | `api.js` → `logica.js` → `datos.js`, fronteras descritas en [arquitectura.md](arquitectura.md); separadas en el PR #3 |
| ARQ-03 | Capas del frontend: presentación y comunicación | hecho | Sprint 2 (PR #10): `dashboard.html` ya no hace `fetch` directos, usa `rest.obtenerSesion()` y `rest.cerrarSesionApp()`; ningún archivo de presentación llama a `fetch`, solo `cliente/rest.js`. Además las reglas de los módulos (fechas, planificador de estudio, agua, sueño, outfits, plan por meses) pasaron al servidor (`servidor/reglas.js`, `POST /api/reglas/:nombre`): la presentación solo pinta (PBI-27/28); tests *R1*–*R9* |
| RF-01 | Registro de usuario local | hecho | `registrarUsuario()` + `POST /api/registro`; la cuenta nace pendiente y no puede entrar hasta confirmar, justo lo que pide la spec (§4.1); test *Prueba 1* |
| RF-02 | Confirmación de cuenta por correo | hecho | Cuenta pendiente con token de un solo uso de 24 h, `GET /api/confirmar`, reenvío si sigue pendiente, adaptador `servidor/correo.js` con Brevo; tests *Hito4b*–*Hito4e*. Verificado de extremo a extremo en la URL pública (Sprint 2, 10/11): registro desde el móvil, llega el correo, el enlace activa la cuenta y se inicia sesión |
| RF-03 | Inicio de sesión local | hecho | `loginUsuario()` + `POST /api/login`; rechaza cuentas pendientes con mensaje claro; tests *Prueba 3*, *Prueba 4*, *Hito4a* |
| RF-04 | Inicio de sesión con OAuth | hecho | `servidor/oauth.js`, `GET /api/oauth/google` y su `callback`, botón en la portada; tests *Hito4f*–*Hito4h*. Sprint 2 (16/11): URI de redirección pública autorizada en el cliente OAuth, pantalla de consentimiento completada (página principal y [política de privacidad](../cliente/privacidad.html), PR #14) y app de Google publicada en producción; login con Google verificado en la URL pública |
| RF-05 | Cierre de sesión | hecho | `POST /api/logout` borra la cookie de sesión (usado desde `cliente/dashboard.html`) |
| RF-06 | Mantenimiento de la sesión entre recargas | hecho | `GET /api/auth/me` con `protegerRuta`; `dashboard.html` lo llama al cargar la página |
| RF-07 | Listar usuarios (administrador) | hecho | Sprint 2 (PR #10): `GET /api/admin/usuarios` devuelve `email`, `rol`, **`estado`** (activo / pendiente) y `fechaRegistro`; la vista de administración muestra el estado con un chip. Test *RF-07* |
| RF-08 | Comprobar si un usuario está activo (administrador) | hecho | Sprint 2 (PR #10): `estadoDe()` en `logica.js` → `pendiente` si no confirmó, `eliminado` si no existe, `activo` si confirmó o entró con Google. Al eliminar una cuenta se borran también sus módulos y registros. Tests *RF-08* y *Eliminar mi cuenta borra también mis registros* |
| RF-09 | Eliminar usuario | hecho | `DELETE /api/usuarios/:email` con la regla `puedeEliminar()` (admin sobre cualquiera; normal solo de sí mismo, §4.2); el eliminado ya no tiene cuenta y el login lo rechaza; PR #4; tests *Prueba 6* y 5 `variante5` |
| RF-10 | Creación del primer administrador | hecho | `asegurarAdmin()` al arrancar el servidor, con reintento (commit 473db47); vía variables de entorno, una de las opciones que la spec §4.2 deja a elección del alumno (decisión D-12) |
| RNF-01 | Persistencia en una base de datos real | hecho | MongoDB Atlas con Mongoose en `servidor/datos.js` (sustituyó al repositorio en memoria); commits 944f3a8 y 5ef8087 |
| RNF-02 | Secretos fuera del código y `.env.example` | hecho | `.gitignore` excluye `.env`; `.env.example` solo con nombres; commit 8da5eb8 retira el `.env` del historial; secretos del CI en GitHub Actions; [README §Variables de entorno](../README.md#variables-de-entorno-necesarias) |
| RNF-03 | Hash seguro de contraseñas | hecho | `bcrypt` en `servidor/logica.js` (§5) |
| RNF-04 | Rutas protegidas por sesión y rol | hecho | `protegerRuta` en `servidor/api.js` sobre JWT en cookie httpOnly; test *Prueba 5* (usuario normal rechazado) |
| RNF-05 | Despliegue en cloud con URL pública | hecho | Servicio desplegado en Google Cloud Run y accesible por URL pública; [README §Despliegue en la nube](../README.md#despliegue-en-la-nube-google-cloud-run) |
| RNF-06 | Pruebas unitarias de la lógica (5 o más) | hecho | `node --test servidor/logica.test.js` → **tests 22, pass 22, fail 0**; incluye varios casos de error (p. ej. *Prueba 4*, *Hito4b*); el comando único está en el README (§6) |
| RNF-07 | Manejo de errores con feedback al usuario | hecho | Campo `error` con mensajes en castellano y resultados traducidos en la portada con `/?resultado=…`; [README §Manejo de errores](../README.md#manejo-de-errores) |
| RNF-08 | Registro de actividad (log) | hecho | Marcadores `[LOG - …]` por consola en `index.js`, `api.js`, `logica.js` y `correo.js` (la spec §6 pide «registro de la actividad relevante» sin fijar el soporte) |
| PRO-01 | Flujo de trabajo GitHub Flow | parcial | PR #3–#6 desde ramas `feature/*` (bases: `main` en #4–#6 y `feature/hito-1-esqueleto` en #3; los 4 con `merged_at` en la API de GitHub). **Falta:** la spec §7.1 prohíbe trabajar directamente sobre `main` y hubo 10 commits directos (11–13/10) → [sprint-1.md](sprint-1.md) |
| PRO-02 | Integración continua | hecho | `ci.yml` ejecuta `npm test` en cada PR y en cada push a `main` (§7.2); 10 ejecuciones: 9 en verde y 1 en roja → [procesos.md](procesos.md) |
| PRO-03 | Despliegue continuo | hecho | Sprint 2: trabajo `desplegar` en `.github/workflows/ci.yml` (solo en push a `main`, tras pasar las pruebas) → decisión D-14 y [procesos.md](procesos.md). Primera ejecución en verde el 10/11 al integrar el PR #10 (run `42848282430`: *pruebas* 22 s, *desplegar* 1 min 24 s) |

Notas:

- **RF-01 y RF-02 se evalúan por separado:** el registro (RF-01) y la confirmación por correo (RF-02, verificada con Brevo en el Sprint 2).
- Pasaron al [Sprint 2](sprint-2.md): ARQ-03, RF-02, RF-04, RF-07, RF-08, PRO-01 y PRO-03. En el Sprint 2 quedan **hechos** ARQ-03, RF-02, RF-04, RF-07, RF-08 y PRO-03; solo PRO-01 sigue parcial (commits directos de la fase inicial, deuda documentada).
- Cifras tomadas de comandos: `node --test` (resumen *tests/pass/fail*), API de GitHub (PR y ejecuciones de CI) y `git tag` (sin etiquetas).
