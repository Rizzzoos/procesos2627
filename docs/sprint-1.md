---
type: Sprint
title: Sprint 1
description: Hitos del Sprint 1 con su evidencia, sus desviaciones y la retrospectiva.
timestamp: 2026-10-28
---

Trabajo del Sprint 1 tal como está en el repositorio. Los objetivos de cada hito proceden del apartado 10 de la especificación, cuyo texto facilitó la persona responsable. Tablero de Donetonic: no uso.

Los tres primeros hitos se comprimieron en los tres primeros días de historial (11–13/10); el cierre con servicios externos llegó el 21/10.

### Hito 1 (semana 1) — Esqueleto y backend

- **Objetivo (apartado 10):** repositorio creado y flujo de trabajo con ramas y pull requests (§7.1); integración continua ejecutando las pruebas y despliegue continuo en la URL pública desde el primer día (al principio con una página mínima); capa lógica de gestión de usuarios con los datos en memoria (alta, listado, comprobar si está activo, eliminar) y sus pruebas unitarias automatizadas; API que expone esa lógica.
- **Qué se hizo (historial):** 2026-10-11, commit [3143dec](https://github.com/Rizzzoos/procesos2627/commit/3143dec) — "Estructura inicial en capas, cliente-servidor y servidor Express": nacen `cliente/rest.js` y `servidor/datos.js` como `RepositorioMemoria (para Hito 1 y 2)` (texto del propio código). El 13/10 aparecen las pruebas automatizadas y el script `npm test` en [5ef8087](https://github.com/Rizzzoos/procesos2627/commit/5ef8087) (entonces `servidor/datos.test.js`; hoy `logica.test.js`, creado por el PR #3). Existe además la rama `feature/hito-1-esqueleto` (local y remota).
- **Respecto al objetivo:** el CI no llegó "desde el primer día": aparece con el [PR #3](https://github.com/Rizzzoos/procesos2627/pull/3) (13/10); el despliegue continuo nunca llegó (PRO-03).
- **PR:** ninguno propio (commit directo en `main`); esa rama recibió el [PR #3](https://github.com/Rizzzoos/procesos2627/pull/3) (ver desviaciones).
- **Etiqueta:** no creada (`git tag` → vacío).

### Hito 2 (semana 2) — Frontend y sesión

- **Objetivo (apartado 10):** interfaz y capa de comunicación del cliente separadas entre sí (§3.2); registro e inicio de sesión locales con la contraseña almacenada con hash; cierre de sesión y mantenimiento de la sesión entre recargas; rutas protegidas que rechazan peticiones sin sesión válida; los datos siguen en memoria.
- **Qué se hizo (historial):** la capa de comunicación (`cliente/rest.js`) existe desde el primer commit (3143dec, 11/10). El 12/10, [231414b](https://github.com/Rizzzoos/procesos2627/commit/231414b) — "Completando Hito 3: Dashboard, login/registro separados y diseño final" — crea `cliente/dashboard.html` y separa login/registro de la portada (el contenido corresponde al Hito 2 de la especificación aunque el mensaje diga Hito 3); [4c9f63e](https://github.com/Rizzzoos/procesos2627/commit/4c9f63e) refina el login con pestañas y entró en `main` por el merge local `f585bc4`, sin PR. El hash con bcrypt (D-03), `POST /api/logout` y `GET /api/auth/me` cubren cierre y recarga. Los datos siguieron en memoria hasta [944f3a8](https://github.com/Rizzzoos/procesos2627/commit/944f3a8) (12/10), como pide el hito.
- **Respecto al objetivo:** `dashboard.html` hace dos `fetch` directos en vez de pasar por la capa de comunicación → ARQ-03 pasa a *parcial* (ver [requisitos.md](requisitos.md)).
- **PR:** ninguno.
- **Etiqueta:** no creada.

### Hito 3 (semana 3) — Persistencia y roles

- **Objetivo (apartado 10):** capa de acceso a datos contra una base de datos real, de modo que los datos sobrevivan a un reinicio, sustituyendo la implementación en memoria **sin modificar la capa lógica**; secretos fuera del código en variables de entorno; roles de usuario y administrador con las restricciones del §4.2 aplicadas en el servidor; registro (log) de la actividad relevante.
- **Qué se hizo (historial):**
  - 12/10, [944f3a8](https://github.com/Rizzzoos/procesos2627/commit/944f3a8) — "Hito 3 completado: Conexión a MongoDB Atlas y registro de usuarios": en `servidor/` solo toca `datos.js` e `index.js` — `logica.js` queda intacto, cumpliendo el objetivo de "sin modificar la capa lógica".
  - Secretos: [76a999f](https://github.com/Rizzzoos/procesos2627/commit/76a999f) añade `.gitignore` (12/10) y [8da5eb8](https://github.com/Rizzzoos/procesos2627/commit/8da5eb8) — "Seguridad: Eliminar .env del historial" (13/10).
  - Roles y cierre: [5ef8087](https://github.com/Rizzzoos/procesos2627/commit/5ef8087) — "Finalizado Sprint 1: Persistencia, Roles, Sesiones y Tests" (13/10); arreglo del admin en [473db47](https://github.com/Rizzzoos/procesos2627/commit/473db47) y [b78e523](https://github.com/Rizzzoos/procesos2627/commit/b78e523) (13/10); reglas de borrado del §4.2 revisadas en el PR #4 (15/10).
  - Marcadores `[LOG - …]` por todo el backend.
- **PR:** [PR #4](https://github.com/Rizzzoos/procesos2627/pull/4) (reglas de borrado y protección). El refactor de capas de esa época se revisó en el PR #3, aunque su contenido entró en `main` por el merge local `f585bc4` (ver desviaciones).
- **Etiqueta:** no creada.

### Hito 4 (semana 4) — Servicios externos y cierre

- **Objetivo (apartado 10):** inicio de sesión con un proveedor externo mediante OAuth (§4.1); confirmación de cuenta por correo electrónico (§4.1) —ambas tareas requieren configurar un servicio externo con la URL pública y la especificación recomienda empezar por ahí—; manejo de errores con feedback claro al usuario; README completo y revisión final de la entrega.
- **Qué se hizo:** [PR #5](https://github.com/Rizzzoos/procesos2627/pull/5) — OAuth con Google y confirmación de cuenta (2026-10-21) — y [PR #6](https://github.com/Rizzzoos/procesos2627/pull/6) — correo con Brevo y reenvío de confirmación (2026-10-21), con los mensajes de feedback en la portada. README ampliado: tecnologías, ejecución, pruebas, variables de entorno (solo nombres), despliegue y manejo de errores. Alcance documentado en el [README §Hito 4: confirmación de cuenta por correo](../README.md#hito-4-confirmación-de-cuenta-por-correo).
- **Falta para cerrarlo:** credenciales reales del proveedor de correo y del cliente OAuth, verificación de extremo a extremo, despliegue y etiqueta `hito-4` → pasa al [Sprint 2](sprint-2.md).
- **PR:** #5 y #6, fusionados el 2026-10-21.
- **Etiqueta:** no creada.

### Desviaciones del flujo

1. **10 commits llegaron a `main` sin PR:** `3143dec`, `76a999f`, `944f3a8`, `231414b`, `5ef8087`, `8da5eb8`, `f585bc4` (merge local que introduce `4c9f63e`, sin PR propio), `473db47` y `b78e523` — fase inicial del 11 al 13/10, antes de montar el flujo con PR. La spec §7.1 pide no trabajar directamente sobre `main`.
2. **Ninguna etiqueta de hito:** `git tag` está vacío (`hito-1` a `hito-4` sin crear); el apartado 10 recomienda marcar cada hito y el [README §Versionado por hitos](../README.md#versionado-por-hitos) lo exige.
3. **El fondo de estelas no tiene PR propio:** su contenido entró en GitHub dentro del squash del PR #5.
4. **El PR #3 se abrió contra la rama equivocada:** su base fue `feature/hito-1-esqueleto`, no `main` (dato de la API de GitHub), así que su merge (`188a408`) no es ancestro de `main` — solo esa rama lo contiene, y su punta queda sin fusionar. El contenido del refactor (`59ba52f`) sí está en `main`, pero entró por el merge local `f585bc4`, no por el PR.
5. **El PR #3 se integró con el CI en rojo:** su única ejecución de CI terminó en rojo (la primera de las 10) y aun así se fusionó; la spec §7.2 dice "No se integra un pull request con el CI en rojo". A partir de esa fecha, todas las ejecuciones están en verde.
6. **Ediciones directas en GitHub:** Por verificar: haría falta el historial de auditoría (pestaña *Insights → Audit log* o la API de GitHub).

### Retrospectiva

**Hechos** (recuento por comandos):

- `git log --first-parent main`: **12 commits** en la línea principal, del 2026-10-11 al 2026-10-21.
- **4 PR** (#3 a #6), los 4 con estado fusionado en la API de GitHub (bases: `main` en #4, #5 y #6; `feature/hito-1-esqueleto` en #3).
- CI: **10 ejecuciones** — 9 en verde, 1 en roja (la primera, en la rama del PR #3, que se fusionó igualmente — desviación 5).
- `node --test servidor/logica.test.js`: **tests 22, pass 22, fail 0**.
- `git tag`: **0 etiquetas**.
- `git branch -a`: 5 ramas `feature/*` en el remoto, más `main`.
- Rama en curso `feature/pwa-y-modulos` (PWA instalable y motor de módulos), todavía sin PR.

**Qué funcionó:**

- El ritmo de rama pequeña → PR → CI en verde antes de mergear.
- Escribir las pruebas al mismo tiempo que la lógica.
- Que el asistente ejecutara y yo revisara los resultados.
- Ir dejando el README al día mientras avanzaba.

**Qué cambiaría:**

- No tocar `main` directamente: todo por PR desde el primer día.
- Etiquetar cada hito al terminarlo (con CI verde y la aplicación funcionando).
- Empezar antes por los servicios externos (Brevo y Google), que es lo que más tarda en configurarse.
- Haber abierto el PR #3 contra `main` y con el CI en verde antes de fusionarlo.
