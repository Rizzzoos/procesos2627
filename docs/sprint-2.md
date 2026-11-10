---
type: Sprint
title: Sprint 2
description: Cierre de lo que quedó parcial en el Sprint 1, capas del cliente, ideas nuevas y despliegue continuo.
timestamp: 2026-11-10
---

- **Objetivo:** cerrar los requisitos que quedaron parciales en el Sprint 1, dejar el cliente solo como presentación (reglas en el servidor) y desplegar de forma continua.
- **Tablero:** no uso (así lo indicó la persona responsable; las tareas del día a día se organizan fuera de este bundle).
- **Integración:** PR #10 (`feature/panel-sin-lateral` → `main`), fusionado el 10/11 con el CI en verde. Pruebas: `npm test`, 50/50.

## Requisitos que pasaron del Sprint 1

| ID | Estado | Qué se hizo / qué falta |
|---|---|---|
| ARQ-03 — Capas del frontend | hecho | `dashboard.html` usa `rest.js` en vez de `fetch` directos. |
| RF-02 — Confirmación de cuenta por correo | parcial | El código está en `main`. **Falta:** verificar un envío real desde la URL pública y crear la etiqueta `hito-4`. |
| RF-04 — Inicio de sesión con OAuth | parcial | El código está en `main`. **Falta:** probar el login con Google en la URL pública. |
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
