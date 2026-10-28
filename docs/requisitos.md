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
| ARQ-03 | Capas del frontend: presentación y comunicación | parcial | Presentación en `cliente/index.html` y `cliente/dashboard.html`; comunicación en `cliente/rest.js`. **Falta:** `dashboard.html` hace dos `fetch` directos (líneas 198 y 207: `/api/auth/me` y `/api/logout`) en vez de pasar por la capa de comunicación |
| RF-01 | Registro de usuario local | hecho | `registrarUsuario()` + `POST /api/registro`; la cuenta nace pendiente y no puede entrar hasta confirmar, justo lo que pide la spec (§4.1); test *Prueba 1* |
| RF-02 | Confirmación de cuenta por correo | parcial | En main desde el PR #6: cuenta pendiente con token de un solo uso de 24 h, `GET /api/confirmar`, reenvío si sigue pendiente, adaptador `servidor/correo.js`; tests *Hito4b*–*Hito4e*. **Falta:** configurar el servicio externo (la spec §10 avisa que «ambas tareas requieren configurar un servicio externo con la URL pública») y verificar un envío de extremo a extremo |
| RF-03 | Inicio de sesión local | hecho | `loginUsuario()` + `POST /api/login`; rechaza cuentas pendientes con mensaje claro; tests *Prueba 3*, *Prueba 4*, *Hito4a* |
| RF-04 | Inicio de sesión con OAuth | parcial | En main desde el PR #5: `servidor/oauth.js`, `GET /api/oauth/google` y su `callback`, botón en la portada; tests *Hito4f*–*Hito4h*. **Falta:** credenciales reales del proveedor (ID y secreto) y verificación de extremo a extremo |
| RF-05 | Cierre de sesión | hecho | `POST /api/logout` borra la cookie de sesión (usado desde `cliente/dashboard.html`) |
| RF-06 | Mantenimiento de la sesión entre recargas | hecho | `GET /api/auth/me` con `protegerRuta`; `dashboard.html` lo llama al cargar la página |
| RF-07 | Listar usuarios (administrador) | parcial | `GET /api/admin/usuarios` con `protegerRuta`; tests *Prueba 5* y *Prueba 7*. **Falta:** la proyección devuelve solo `email` y `rol` (`datos.js`: `find({}, 'email rol')`) — la spec §4.2 exige que el listado muestre **también el estado** |
| RF-08 | Comprobar si un usuario está activo (administrador) | parcial | `GET /api/admin/usuarios/:email/estado` con `protegerRuta`. **Falta:** la lógica da `activo: true` a todo usuario que existe en la base de datos; la spec §4.2 define activo = **confirmado (o OAuth) y no eliminado** — una cuenta pendiente sale hoy como activa |
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
| PRO-03 | Despliegue continuo | pendiente | La spec §7.2 exige desplegar cada cambio integrado automáticamente y dice textualmente «No se despliega a mano»; aquí no hay paso de despliegue en el workflow y el deploy se hace a mano con `gcloud` → [procesos.md](procesos.md) |

Notas:

- **RF-01 y RF-02 se evalúan por separado:** el registro funciona (RF-01 hecho) aunque la confirmación por correo aún no esté verificada con un proveedor real (RF-02 parcial).
- Pasan al [Sprint 2](sprint-2.md): ARQ-03, RF-02, RF-04, RF-07, RF-08, PRO-01 y PRO-03.
- Cifras tomadas de comandos: `node --test` (resumen *tests/pass/fail*), API de GitHub (PR y ejecuciones de CI) y `git tag` (sin etiquetas).
