# Dasna - Proyecto Procesos 26-27 (Sprint 1)

Estructura base de una aplicación tipo SaaS organizada en capas y con gestión de usuarios.

## Tecnologías elegidas
* **Node.js + Express:** Elegidos por su eficiencia y rapidez para construir la API REST, permitiendo usar JavaScript unificado tanto en el cliente como en el servidor.
* **MongoDB Atlas + Mongoose:** Elegido por ser una base de datos NoSQL flexible, ideal para persistir datos y evolucionar la estructura sin esquemas rígidos iniciales.
* **Bcrypt:** Función de hash elegida por su alta seguridad y robustez frente a ataques para almacenar contraseñas.
* **HTML/CSS/JS Vainilla (Frontend):** Elegido para mantener el control total de la capa de presentación y aplicar el diseño *glassmorphism* sin la sobrecarga de un framework complejo.

## Ejecución en local
1. Clona este repositorio en tu equipo.
2. Abre la terminal en la carpeta del proyecto e instala las dependencias: `npm install`
3. Arranca el servidor ejecutando: `node servidor/index.js`
4. Abre `http://localhost:3000` en tu navegador.

## Pruebas automatizadas
Para ejecutar la batería de pruebas unitarias sobre las reglas de gestión de usuarios, ejecuta el comando:
`npm test`

## Variables de entorno necesarias
El proyecto requiere un archivo `.env` en la raíz (ver `.env.example`) con las siguientes variables:
* `MONGO_URI`
* `PORT` (Opcional)

## Acceso Administrador (Revisión)
Para evaluar las funciones reservadas al rol de administrador, se ha configurado la siguiente cuenta:
* **Email:** sandra12@universo.com
* **Contraseña:** *(Por motivos de seguridad y cumpliendo los requisitos, esta contraseña no se publica en el repositorio. Se adjunta en el archivo de texto de la entrega en el campus).*c