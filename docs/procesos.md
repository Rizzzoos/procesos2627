---
type: Proceso
title: Procesos de trabajo
description: Flujo de trabajo con GitHub, integración continua y despliegue.
timestamp: 2026-10-28
---

## Flujo de trabajo (GitHub Flow)

1. Rama desde `main`: `feature/...` para código, `docs/...` para documentación.
2. Commits con sus pruebas en la misma rama.
3. Push y *pull request*.
4. CI en verde y fusión (merge o squash); la rama se elimina.

**Evidencia:** 4 PR — #3 (2026-10-13), #4 (2026-10-15), #5 y #6 (2026-10-21) — los 4 con estado fusionado en la API de GitHub (misma fuente que `gh pr list --state all`). Base de los PR: #4, #5 y #6 contra `main`; **#3 contra `feature/hito-1-esqueleto`** (su merge no acabó en `main`, ver [sprint-1.md](sprint-1.md)). Hasta el 13/10 hubo commits directos en `main`, también registrados como desviación.

## Integración continua

Fichero `.github/workflows/ci.yml`:

- **Cuándo se dispara:** en cada PR y en cada push a `main`.
- **Pasos:** checkout → Node.js 20 con caché de npm → `npm ci` → `npm test`.
- **Secretos del workflow** (solo nombres; los valores están en *Settings → Secrets and variables → Actions*): `MONGO_URI` y `JWT_SECRET`.

**Evidencia:** 10 ejecuciones registradas (API de GitHub `actions/runs`, misma fuente que `gh run list --limit 50`): **9 en verde y 1 en roja**. La única en roja es la primera ejecución, en la rama del PR #3, y ese PR se fusionó igualmente: la spec §7.2 pide "No se integra un pull request con el CI en rojo", y queda registrado como desviación en [sprint-1.md](sprint-1.md).

## Despliegue

- La app corre en un contenedor (ver `Dockerfile` en la raíz) desplegado en **Google Cloud Run** (servicio `procesos2627`, región `europe-west1`).
- El despliegue es **manual**: se lanza `gcloud run deploy` desde la máquina local indicando las variables de entorno del servicio (solo nombres en el [README §Variables de entorno](../README.md#variables-de-entorno-necesarias)).
- La spec §7.2 exige despliegue continuo: "cada cambio que llega a main se despliega automáticamente… No se despliega a mano". Aquí **no hay paso de despliegue en el workflow**: por eso PRO-03 (despliegue continuo) está **pendiente** en [requisitos.md](requisitos.md).
- Detalle del contenedor y de la configuración de Cloud Run: [README §Despliegue en la nube](../README.md#despliegue-en-la-nube-google-cloud-run).
