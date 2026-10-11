// servidor/index.js
const express = require('express');
const { crearRepositorio } = require('./datos');
const { crearServicio } = require('./logic');
const { crearRouter } = require('./api');

const app = express();
app.use(express.json());

// Servir los archivos estáticos del cliente (misma origen)
app.use(express.static('cliente'));

// Inyección de dependencias entre capas
const repo = crearRepositorio();
const servicio = crearServicio(repo);

// Conectar las rutas de la API
app.use('/api/usuarios', crearRouter(servicio));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});