---
type: Decisiones
title: Decisiones de diseño
description: Qué se decidió, por qué y en qué estado está cada decisión.
timestamp: 2026-10-28
---

Las decisiones D-01 a D-05 recogen las tecnologías; D-06 y D-07 registran un cambio de enfoque en el proveedor de correo (queda la antigua, sustituida); D-08 a D-13, decisiones del producto y del proceso. Los motivos de D-06, D-08, D-12 y D-13 los aportó la persona responsable del proyecto.

### D-01 — Express + Node.js para la API
- **Qué se decidió:** montar la API REST con Express sobre Node.js.
- **Por qué:** fuente: README, *Tecnologías elegidas* — "eficiencia y rapidez para construir la API REST", con JavaScript unificado en cliente y servidor.
- **Estado:** vigente.

### D-02 — MongoDB Atlas con Mongoose
- **Qué se decidió:** persistir en MongoDB Atlas usando Mongoose.
- **Por qué:** fuente: README, *Tecnologías elegidas* — "base de datos NoSQL flexible, ideal para persistir datos y evolucionar la estructura sin esquemas rígidos iniciales".
- **Estado:** vigente.

### D-03 — bcrypt para las contraseñas
- **Qué se decidió:** guardar contraseñas solo como hash con bcrypt.
- **Por qué:** fuente: README, *Tecnologías elegidas* — "alta seguridad y robustez frente a ataques".
- **Estado:** vigente.

### D-04 — Sesión con JWT en cookie httpOnly
- **Qué se decidió:** la sesión viaja en una cookie httpOnly con un JWT, no en almacenamiento del navegador.
- **Por qué:** fuente: README, *Tecnologías elegidas* — "mantener la sesión del usuario de forma segura entre recargas de página".
- **Estado:** vigente.

### D-05 — Frontend en HTML/CSS/JS vanilla
- **Qué se decidió:** sin frameworks de interfaz; diseño *glassmorphism* a mano.
- **Por qué:** fuente: README, *Tecnologías elegidas* — "mantener el control total de la capa de presentación y aplicar el diseño *glassmorphism* sin la sobrecarga de un framework complejo".
- **Estado:** vigente.

### D-06 — Resend como proveedor de correo (primera opción)
- **Qué se decidió:** enviar el correo de confirmación con Resend: el PR #5 introdujo `servidor/correo.js` con la variable `RESEND_API_KEY` y la llamada a la API de Resend.
- **Por qué:** parecía lo más sencillo de integrar de los dos al empezar (motivo aportado por la persona responsable).
- **Estado:** **sustituida por D-07** (evidencia: el PR #6 reescribe `correo.js` para usar Brevo y deja Resend como alternativa).

### D-07 — Brevo como proveedor de correo (opción vigente)
- **Qué se decidió:** Brevo como proveedor principal de correo, con Resend como alternativa por variable de entorno.
- **Por qué:** fuente: README — "El modo gratuito de Resend solo permite enviar al correo de la cuenta" y "Brevo permite usar un correo normal como remitente verificado, sin dominio y sin coste".
- **Estado:** vigente.

### D-08 — OAuth de Google con *authorization code* y fetch nativo
- **Qué se decidió:** flujo de authorization code + intercambio por perfil con `fetch` de Node, sin librerías de OAuth (`servidor/oauth.js`).
- **Por qué:** mantener el mínimo de dependencias: menos librerías de terceros en algo tan sensible (motivo aportado por la persona responsable).
- **Estado:** vigente.

### D-09 — Las cuentas creadas con Google nacen confirmadas
- **Qué se decidió:** quien entra con Google no recibe correo de confirmación; su cuenta se crea ya activa (o se activa si estaba pendiente).
- **Por qué:** fuente: README, sección OAuth — "Google ha verificado el correo".
- **Estado:** vigente.

### D-10 — Registro con cuenta pendiente y token de un solo uso (24 h)
- **Qué se decidió:** al registrarse la cuenta nace `confirmada: false` con un token aleatorio de un solo uso que caduca en 24 h; `GET /api/confirmar` lo valida, activa y consume.
- **Por qué:** fuente: la spec §4.1 exige que "hasta que confirma su correo, la cuenta queda en estado pendiente y no puede iniciar sesión"; el mecanismo está descrito en el README.
- **Estado:** vigente.

### D-11 — Reenvío automático si la cuenta sigue pendiente
- **Qué se decidió:** registrarse de nuevo con un correo que ya tiene cuenta pendiente no bloquea: se genera un token nuevo y se reenvía el correo.
- **Por qué:** fuente: README — "nadie se queda sin salida si un envío falla".
- **Estado:** vigente.

### D-12 — Administrador inicial creado automáticamente al arrancar
- **Qué se decidió:** al arrancar el servidor se asegura la existencia del administrador inicial (con reintento si la base de datos tarda), a partir de variables de entorno.
- **Por qué:** era la opción más simple, y la spec §4.2 admite expresamente la vía de variable de entorno entre las posibles (motivo aportado por la persona responsable).
- **Estado:** vigente.

### D-13 — Despliegue manual en Cloud Run
- **Qué se decidió:** el deploy se lanza a mano con `gcloud` (no hay paso de despliegue en el workflow de CI).
- **Por qué:** la persona responsable no sabía todavía cómo enganchar GitHub con Cloud Run, así que se quedó manual de momento.
- **Estado:** vigente hoy, **pero contraria a la spec §7.2** (despliegue continuo, "no se despliega a mano"): al automatizar el paso de despliegue esta decisión queda sustituida — ver PRO-03 en [requisitos.md](requisitos.md).
