---
type: Sprint
title: Sprint 2
description: Objetivo por definir y requisitos que pasan del Sprint 1.
timestamp: 2026-10-28
---

- **Objetivo:** Por definir.
- **Tablero:** no uso (así lo indicó la persona responsable; las tareas del día a día se organizan fuera de este bundle).

## Requisitos que pasan del Sprint 1

| ID | Estado | Qué falta |
|---|---|---|
| ARQ-03 — Capas del frontend | parcial | Mover los dos `fetch` de `cliente/dashboard.html` (líneas 198 y 207) a `cliente/rest.js`. |
| RF-02 — Confirmación de cuenta por correo | parcial | Configurar el proveedor de correo, verificar un envío real de extremo a extremo y, al cerrar el despliegue, crear la etiqueta `hito-4`. Evidencia actual en [requisitos.md](requisitos.md). |
| RF-04 — Inicio de sesión con OAuth | parcial | Configurar el cliente OAuth de Google (ID y secreto) y probar el login con Google en local y en la URL pública. |
| RF-07 — Listar usuarios | parcial | Devolver también el estado de cada usuario: ampliar la proyección de `datos.listarTodos()`. |
| RF-08 — Comprobar si un usuario está activo | parcial | Considerar activo solo a quien confirmó su cuenta (o vino de OAuth) y no fue eliminado: comprobar el campo de confirmación en `comprobarEstado()`. |
| PRO-01 — GitHub Flow | parcial | Consolidar el flujo: desde el 13/10 todo cambio pasa por PR; los commits directos de la fase inicial quedan como deuda documentada. |
| PRO-03 — Despliegue continuo | pendiente | Añadir el paso de despliegue al workflow de CI, como exige la spec §7.2 (hoy el deploy es manual). |

## Trabajo en curso (contexto, no es un requisito que pase)

- Rama local `feature/pwa-y-modulos`, todavía sin PR: PWA instalable (`manifest.json`, service worker e iconos) y un motor de módulos (colecciones `modulos` y `registros` con endpoints genéricos). Es trabajo nuevo de esta etapa; ver [arquitectura.md](arquitectura.md) para las fronteras que respeta.
