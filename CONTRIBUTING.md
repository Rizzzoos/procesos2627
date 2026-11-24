# Cómo colaborar en Dasna

¡Gracias por pasarte! Toda ayuda es bienvenida: probar la app, leer el código, proponer ideas o arreglar algo.

- **App desplegada:** https://procesos2627-817509698728.europe-west1.run.app
- **Arquitectura y decisiones:** [docs/arquitectura.md](docs/arquitectura.md) y [docs/decisiones.md](docs/decisiones.md)

## Formas de participar

| Quieres… | Dónde |
|---|---|
| Proponer una idea o preguntar algo | [Discussions](https://github.com/Rizzzoos/procesos2627/discussions) (categorías *Ideas* y *Q&A*) |
| Comentar un cambio ya hecho | Comentario en un commit o en una línea |
| Proponer una mejora concreta | Issue con la plantilla **Mejora** |
| Reportar un fallo | Issue con la plantilla **Fallo (bug)**, con los pasos para reproducirlo |
| Revisar un cambio | Pull requests con la etiqueta [`se-busca-revisión`](https://github.com/Rizzzoos/procesos2627/labels/se-busca-revisi%C3%B3n); se aceptan *suggested changes* |
| Arreglarlo tú | Fork + pull request a `main` (ver abajo) |

Antes de abrir una issue, mira si ya existe; si es así, añade tu información en la que hay.

## Tu propio pull request

1. Haz un fork y crea una rama con nombre claro: `fix/...` o `feature/...`.
2. Instala y prueba en local (ver [README](README.md#ejecución-en-local)): `npm install` y `npm test`.
3. Respeta las capas: solo `servidor/api.js` conoce Express, solo `servidor/datos.js` habla con MongoDB y en el cliente solo `cliente/rest.js` hace `fetch`.
4. Si cambias lógica o reglas, añade o actualiza una prueba en `servidor/*.test.js`.
5. Abre el PR contra `main` de este repositorio, explica qué cambia y cómo probarlo y enlaza la issue (`Closes #N`).

Los PR se quedan abiertos al menos 48 horas antes de integrarse, para que dé tiempo a revisarlos (salvo que ya tengan una revisión). Contesto a todas las sugerencias: las útiles las aplico con *Commit suggestion* y, si no aplico alguna, explico por qué.

## Normas

- Nunca subas secretos (`.env`, claves, contraseñas): van en variables de entorno.
- Comentarios sobre el código, no sobre las personas.
