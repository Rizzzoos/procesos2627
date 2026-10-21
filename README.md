# Dasna - Proyecto Procesos 26-27

Aplicación SaaS organizada en capas, con gestión de usuarios, inicio de sesión con Google (OAuth) y confirmación de cuenta por correo.

## Tecnologías elegidas
* **Node.js + Express:** Elegidos por su eficiencia y rapidez para construir la API REST, permitiendo usar JavaScript unificado tanto en el cliente como en el servidor.
* **MongoDB Atlas + Mongoose:** Elegido por ser una base de datos NoSQL flexible, ideal para persistir datos y evolucionar la estructura sin esquemas rígidos iniciales.
* **Bcrypt:** Función de hash elegida por su alta seguridad y robustez frente a ataques para almacenar contraseñas.
* **JSON Web Token (JWT) + Cookies httpOnly:** Elegidos para mantener la sesión del usuario de forma segura entre recargas de página.
* **HTML/CSS/JS Vainilla (Frontend):** Elegido para mantener el control total de la capa de presentación y aplicar el diseño *glassmorphism* sin la sobrecarga de un framework complejo.

## Arquitectura en capas

El proyecto separa claramente la frontera entre capas:

* **Frontend** (presentación + comunicación): `cliente/index.html` y `cliente/dashboard.html` son la capa de presentación (GUI). `cliente/rest.js` es la capa de comunicación del cliente con la API.
* **Capa API** (HTTP): `servidor/api.js` define los endpoints REST, las cookies y el JWT. Único módulo que conoce Express.
* **Capa de lógica de negocio**: `servidor/logica.js` contiene las reglas de gestión de usuarios (registro, login, confirmación de cuentas, acceso con Google, roles admin/usuario, permisos de borrado). No conoce HTTP.
* **Capa de acceso a datos**: `servidor/datos.js` es el único módulo que habla con MongoDB (Mongoose).
* **Servicios externos** (Hito 4): `servidor/oauth.js` habla con Google (OAuth 2.0) y `servidor/correo.js` con Resend (envío de correos). Solo estos dos módulos conocen a los proveedores externos.
* **Punto de entrada**: `servidor/index.js` monta la aplicación y conecta las capas.

La comunicación cliente-servidor es exclusivamente vía API, y el backend sirve el frontend (mismo origen).

## Ejecución en local
1. Clona este repositorio en tu equipo.
2. Copia `.env.example` a `.env` y rellena tus valores reales (ver sección siguiente).
3. Abre la terminal en la carpeta del proyecto e instala las dependencias: `npm install`
4. Arranca el servidor ejecutando: `npm start` (o `node servidor/index.js`)
5. Abre `http://localhost:3000` en tu navegador.

## Pruebas automatizadas
Para ejecutar la batería de pruebas unitarias sobre las reglas de gestión de usuarios, ejecuta el comando:
`npm test`

## Variables de entorno necesarias
El proyecto requiere un archivo `.env` en la raíz (ver `.env.example`) con las siguientes variables:

**Base de datos y sesión**
* `MONGO_URI`
* `JWT_SECRET`
* `PORT` (opcional)

**Hito 4 - Confirmación de correo (Resend)**
* `RESEND_API_KEY` — clave de API de [Resend](https://resend.com). Sin ella, el servidor no envía correos y deja el enlace de confirmación en el registro (modo desarrollo/CI).
* `EMAIL_FROM` (opcional) — remitente que aparece en el correo (`Dasna <onboarding@resend.dev>` por defecto).

**Hito 4 - Inicio de sesión con Google (OAuth 2.0)**
* `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` — credenciales del *OAuth Client ID* de Google Cloud. Sin ellas, el botón de Google responde con un error claro.
* `URL_PUBLICA` — URL pública de la app (por ejemplo `https://procesos2627-817509698728.europe-west1.run.app`). Se usa para construir el enlace de confirmación y la *redirect URI* de Google. En local vale `http://localhost:3000`.

> Las claves reales **nunca se suben al repositorio**: en Cloud Run se configuran como variables de entorno del servicio.

## Hito 4: confirmación de cuenta por correo
1. Al registrarse, la cuenta nace **pendiente** (`confirmada: false`) y se genera un **token de un solo uso** con caducidad de 24 h.
2. `servidor/correo.js` envía un correo con Resend que enlaza a `GET /api/confirmar?token=...`.
3. El servidor valida el token (que exista, que no haya caducado y que no se haya usado), activa la cuenta y **borra el token** (no se puede reutilizar).
4. Hasta confirmar, el login se rechaza con el mensaje: *"Tu cuenta aún no está confirmada. Revisa tu correo y abre el enlace de confirmación."*
5. Las cuentas existentes antes de este hito y las creadas con Google quedan confirmadas por defecto.

### Configurar Resend
1. Crea la cuenta en https://resend.com y verifica tu correo.
2. Pestaña **API Keys** → **Create API Key** → copia la clave (`re_...`).
3. Configúrala como `RESEND_API_KEY` en el `.env` local y en Cloud Run.

## Hito 4: inicio de sesión con Google (OAuth 2.0)
Se usa el flujo de *authorization code* con `servidor/oauth.js`:
1. `GET /api/oauth/google` redirige a la pantalla de consentimiento de Google.
2. Google vuelve a `GET /api/oauth/google/callback` con un código.
3. El servidor canjea el código por un *access_token* y pide el perfil a Google (`openid email profile`).
4. Si el correo no existe, se crea la cuenta **ya confirmada** (Google ha verificado el correo); si existía pendiente, se activa. Después se crea la sesión JWT igual que con contraseña.

### Configurar el OAuth en Google Cloud
1. Consola de Google Cloud → **APIs & Services → OAuth consent screen** (External, nombre "Dasna", tu correo).
2. **Credentials → Create credentials → OAuth client ID → Web application**.
3. Añade estas *Authorized redirect URIs*:
   * `https://procesos2627-817509698728.europe-west1.run.app/api/oauth/google/callback`
   * `http://localhost:3000/api/oauth/google/callback`
4. Copia el *Client ID* y el *Client Secret* a las variables `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.
5. Si la app está en modo **Testing**, añade las cuentas que vayan a probar en **Test users** (incluida la del evaluador).

## Manejo de errores
Todos los errores devuelven un campo `error` con un mensaje claro en castellano, que la interfaz pinta en pantalla (rojo para fallos, verde para éxitos). El enlace del correo redirige a `/?resultado=...` con un motivo que la portada traduce en un mensaje legible (cuenta confirmada, enlace caducado, OAuth cancelado/no configurado, etc.).

## Pruebas automatizadas
Ejecuta la batería de pruebas con `npm test` (21 pruebas):
* 7 de gestión de usuarios (registro, duplicado, login, roles).
* 5 del Hito 4 sobre confirmación de cuentas (pendiente, token inválido, sin token, confirmación real, token de un solo uso).
* 3 del Hito 4 sobre acceso con Google (cuenta confirmada, sin duplicados, activación de pendientes).
* 5 etiquetadas `variante5` sobre la regla pura `puedeEliminar()`.
* Si falta `RESEND_API_KEY`, el envío de correo no rompe las pruebas: el enlace se imprime en el registro (útil en CI).

## Versionado por hitos
Cada hito se marca con una **etiqueta git** en el último commit de `main`, con el CI en verde y la aplicación desplegada funcionando: `hito-1`, `hito-2`, `hito-3`, `hito-4`.

## Despliegue en la nube (Google Cloud Run)
La aplicación está desplegada en Google Cloud Run, que la ejecuta en un contenedor (ver `Dockerfile`).
Cloud Run inyecta automáticamente la variable `PORT`; el servidor la lee en `servidor/index.js`.
Las variables `MONGO_URI`, `JWT_SECRET`, `RESEND_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `URL_PUBLICA` se configuran como variables de entorno del servicio en Cloud Run, nunca en el repositorio.

## Acceso Administrador (Revisión)
Para evaluar las funciones reservadas al rol de administrador, se ha configurado la siguiente cuenta:
* **Email:** sandra12@universo.com
* **Contraseña:** *(Por motivos de seguridad y cumpliendo los requisitos, esta contraseña no se publica en el repositorio. Se adjunta en el archivo de texto de la entrega en el campus.)*
