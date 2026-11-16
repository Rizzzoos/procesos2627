---
type: Sprint
title: Sprint 2
description: Cierre de lo que quedó parcial en el Sprint 1, capas del cliente, ideas nuevas y despliegue continuo.
timestamp: 2026-11-10
---

- **Objetivo:** cerrar los requisitos que quedaron parciales en el Sprint 1, dejar el cliente solo como presentación (reglas en el servidor) y desplegar de forma continua.
- **Tablero:** no uso (así lo indicó la persona responsable; las tareas del día a día se organizan fuera de este bundle).
- **Integración:** PR #10 (`feature/panel-sin-lateral` → `main`), fusionado el 10/11 con el CI en verde. Cierre: [PR #16](https://github.com/Rizzzoos/procesos2627/pull/16) («app terminada») con Web Push, franja «Hoy», límite de intentos y base de pruebas separada. Pruebas: `npm test`, 69/69.

## Requisitos que pasaron del Sprint 1

| ID | Estado | Qué se hizo / qué falta |
|---|---|---|
| ARQ-03 — Capas del frontend | hecho | `dashboard.html` usa `rest.js` en vez de `fetch` directos. |
| RF-02 — Confirmación de cuenta por correo | hecho | Verificado en la URL pública: llega el correo de Brevo y el enlace activa la cuenta. Queda opcional crear la etiqueta `hito-4`. |
| RF-04 — Inicio de sesión con OAuth | hecho | URI de redirección pública autorizada, página de privacidad y app de Google en producción; login con Google verificado en la URL pública. |
| RF-07 — Listar usuarios | hecho | El listado devuelve también el estado de cada usuario. |
| RF-08 — Comprobar si un usuario está activo | hecho | Activo = confirmado (o Google) y no eliminado; una cuenta pendiente ya no sale activa. |
| PRO-01 — GitHub Flow | parcial | Todo el Sprint 2 entró por PR; los commits directos de la fase inicial quedan como deuda documentada. |
| PRO-03 — Despliegue continuo | hecho | Trabajo `desplegar` en el workflow (D-14); primera ejecución en verde el 10/11. |

## Trabajo nuevo del sprint

| PBI | Qué | Dónde |
|---|---|---|
| PBI-27 | Reglas de los módulos al servidor: interpretar fechas y eventos, planificador de estudio, horario de agua, horas de sueño, sugerencia de outfits y plan por meses. Funciones puras que reciben «hoy» del cliente. | `servidor/reglas.js`, `POST /api/reglas/:nombre`; tests *R1*–*R9* |
| PBI-28 | El cliente solo presenta: todas las llamadas pasan por `cliente/rest.js` (incluido `dashboard.html`). | `cliente/rest.js` |
| — | **Tu semana:** resumen de los últimos 7 días (agua, diario, gimnasio) arriba del Panel. | `GET /api/resumen`; tests *S1*–*S5* |
| — | **Primer uso guiado:** al entrar por primera vez se eligen los módulos. | `cliente/modulos-panel.js` |
| — | **Menú de la cuenta** (botón de salir): descargar mis datos (todo o por módulo, JSON o CSV), salir y eliminar la cuenta (pide escribir el correo). | `GET /api/exportar`, `DELETE /api/usuarios/:email` |
| — | Adaptación a móvil: botones a tamaño de dedo, tablas con scroll, ventanas casi a pantalla completa. | `cliente/estilos/dasna.css` |
| — | Despliegue continuo a Cloud Run (D-14). | `.github/workflows/ci.yml` |
| PBI-29 | Recuperar la contraseña por correo (D-16). | `POST /api/recuperar`, `POST /api/restablecer`; tests *Recuperar 1–3* |
| — | Ojo para ver la contraseña; el login dice si falla el correo o la contraseña (D-15). | `cliente/index.html` |
| — | Página de privacidad (`/privacidad.html`), necesaria para publicar el acceso con Google. | PR #14 |
| PBI-30 | Módulo opcional Mi ciclo con predicción (D-17) y «Elegir módulos» en el menú de la cuenta. | `GET /api/ciclo`, `cliente/modulos-ciclo.js`; tests *C1–C7* |
| PBI-24 | Avisos con la app cerrada (Web Push) con un trabajo de Cloud Scheduler cada 5 min (D-18). | `servidor/push.js`, `POST /api/push/enviar`; tests *Push 1–2* |
| — | Franja «Hoy» en el Panel; «Hoy» y «Tu semana» se activan o quitan en «Elegir módulos». | `cliente/modulos-panel.js`; tests *S6* y *1b* |
| — | Límite de intentos de login y de recuperar contraseña por IP. | `servidor/limite.js`; tests *L1–L3* |
| — | Pruebas en una base de datos aparte (`dasna_pruebas`) y acciones de GitHub en Node 24. | `servidor/logica.test.js`, `.github/workflows/ci.yml` |

Backlog completo (PBI, mejoras y decisiones): [backlog.md](backlog.md).
