# Dasna - Proyecto Procesos 26-27 (Sprint 1)

Estructura base de una aplicación tipo SaaS organizada en capas y con gestión de usuarios.

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
* **Capa de lógica de negocio**: `servidor/logica.js` contiene las reglas de gestión de usuarios (registro, login, roles admin/usuario, permisos de borrado). No conoce HTTP.
* **Capa de acceso a datos**: `servidor/datos.js` es el único módulo que habla con MongoDB (Mongoose).
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
* `MONGO_URI`
* `JWT_SECRET`
* `PORT` (opcional)

## Despliegue en la nube (Google Cloud Run)
La aplicación está desplegada en Google Cloud Run, que la ejecuta en un contenedor (ver `Dockerfile`).
Cloud Run inyecta automáticamente la variable `PORT`; el servidor la lee en `servidor/index.js`.
Las variables `MONGO_URI` y `JWT_SECRET` se configuran como variables de entorno del servicio en la consola de Cloud Run, nunca en el repositorio.

## Acceso Administrador (Revisión)
Para evaluar las funciones reservadas al rol de administrador, se ha configurado la siguiente cuenta:
* **Email:** sandra12@universo.com
* **Contraseña:** *(Por motivos de seguridad y cumpliendo los requisitos, esta contraseña no se publica en el repositorio. Se adjunta en el archivo de texto de la entrega en el campus.)*
