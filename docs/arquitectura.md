---
type: Arquitectura
title: Arquitectura del sistema
description: Capas del backend y del frontend, frontera entre capas y tabla de endpoints.
timestamp: 2026-10-28
---

Resumen operativo. La descripción completa está en el [README §Arquitectura en capas](../README.md#arquitectura-en-capas).

## Capas del backend

| Capa | Archivo | Responsabilidad |
|---|---|---|
| API (HTTP) | `servidor/api.js` | Endpoints, cookies, firma/lectura del JWT, sesión y roles. Único módulo que conoce Express. |
| Lógica de negocio | `servidor/logica.js` | Registro, login, confirmación de cuentas, acceso con Google, roles, permisos de borrado, estado de los usuarios, resumen de la semana y exportar datos. No recibe HTTP. |
| Reglas de los módulos | `servidor/reglas.js` | Funciones puras (sin base de datos ni HTTP) que usa la lógica: interpretar fechas y eventos, planificador de estudio, horario de agua, horas de sueño, sugerencia de outfits, plan por meses y resumen de la semana. Reciben «hoy» del cliente. Sprint 2 (PBI-27). |
| Datos | `servidor/datos.js` | Único módulo que habla con MongoDB (Mongoose); define colecciones y reglas de consulta. |
| Servicios externos | `servidor/oauth.js`, `servidor/correo.js` | Solo estos dos tocan proveedores de fuera: Google (OAuth 2.0) y el proveedor de correo. |
| Composición | `servidor/index.js` | Arranque, conexión a la base de datos, administrador inicial, estáticos del cliente y montaje del router en `/api`. |

## Capas del frontend

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Presentación | `cliente/index.html`, `cliente/app.html`, `cliente/dashboard.html`, `cliente/app.js`, `cliente/modulos*.js` | Pantallas y módulos, diseño *glassmorphism*. Solo pintan: los cálculos los pide al servidor por `rest.js`. |
| Comunicación | `cliente/rest.js` | Todas las llamadas a la API (`fetch`); ningún otro archivo del cliente usa `fetch` (Sprint 2, PBI-28). |

## Frontera exacta entre capas

1. Solo `api.js` conoce Express: recibe `req`/`res`, gestiona cookies y el JWT, y llama a la lógica con datos planos.
2. `logica.js` no conoce HTTP: entrada y salida son objetos y cadenas; los errores salen como `{ error: "mensaje" }`.
3. `logica.js` importa el adaptador `correo.js`: elige proveedor por variable de entorno (Brevo, o Resend como alternativa) y si no hay clave devuelve el enlace por el registro del servidor (modo desarrollo/CI). La lógica no sabe qué proveedor se usa.
4. `oauth.js` se cablea desde `api.js`: solo ese módulo conoce el flujo con Google (`authorization code` + intercambio por perfil).
5. `datos.js` es el único que importa Mongoose.
6. El backend sirve el frontend (`express.static`), así que cliente y servidor comparten origen; la comunicación es exclusivamente vía `/api`.

## Endpoints

Todos quedan montados bajo `/api` (`app.use('/api', crearRouter())` en `servidor/index.js`). Fuente: `servidor/api.js` (11 rutas, recuento con grep).

| Método | Ruta | Quién puede |
|---|---|---|
| POST | `/registro` | cualquiera |
| POST | `/login` | cualquiera |
| GET | `/confirmar?token=...` | cualquiera con un enlace válido (token de un solo uso, caduca en 24 h) |
| GET | `/oauth/google` | cualquiera (redirige a Google) |
| GET | `/oauth/google/callback` | cualquiera (vuelve de Google) |
| GET | `/auth/me` | sesión válida |
| POST | `/logout` | cualquiera (borra la cookie de sesión) |
| GET | `/admin/usuarios` | administrador |
| GET | `/admin/usuarios/:email/estado` | administrador |
| DELETE | `/usuarios/:email` | sesión con permiso: a sí mismo, o administrador sobre una cuenta que no sea administrador (regla `puedeEliminar`) |
| POST | `/prueba/eliminar` | cualquiera (contrato público de la variante 5) |

Detalle de reglas de permisos y mensajes de error: en el [README §Manejo de errores](../README.md#manejo-de-errores).
