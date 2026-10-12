const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const datos = require('./datos.js'); // Importamos nuestra lógica de base de datos

const app = express();

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, '../cliente')));

// Conexión a MongoDB Atlas
const uri = "mongodb+srv://sandragaralcolea_db_user:4NfTyzkxJmdJkis1@dasnacluster.dvtntci.mongodb.net/dasnaDB?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(() => console.log('¡Conectado con éxito a MongoDB Atlas!'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// Ruta para registrarse
app.post('/api/registro', async (req, res) => {
    const { email, password } = req.body;
    const resultado = await datos.registrarUsuario(email, password);
    
    if (resultado.exito) res.status(200).json({ mensaje: resultado.mensaje });
    else res.status(400).json({ error: resultado.error });
});

// Ruta para iniciar sesión
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const resultado = await datos.loginUsuario(email, password);
    
    if (resultado.exito) res.status(200).json({ mensaje: resultado.mensaje });
    else res.status(400).json({ error: resultado.error });
});

// Arrancar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Dasna vibrando en http://localhost:${PORT}`);
});