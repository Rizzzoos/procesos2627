// Capa API: Endpoints REST
const express = require('express');

function crearRouter(servicio) {
    const router = express.Router();

    router.post('/', async (req, res) => {
        try {
            const { email } = req.body;
            const usuario = await servicio.registrar(email);
            res.status(201).json(usuario);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    router.get('/', async (req, res) => {
        try {
            const usuarios = await servicio.listar();
            res.json(usuarios);
        } catch (err) {
            res.status(403).json({ error: err.message });
        }
    });

    return router;
}

module.exports = { crearRouter };
