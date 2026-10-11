// Capa de Datos: Repositorio en memoria (para Hito 1 y 2)
class RepositorioMemoria {
    constructor() {
        this.usuarios = [];
        this.id = 1;
    }

    crear(email, rol = 'usuario') {
        const u = { id: this.id++, email, rol, estado: 'pendiente' };
        this.usuarios.push(u);
        return u;
    }

    listar() {
        return this.usuarios;
    }

    buscarPorEmail(email) {
        return this.usuarios.find(u => u.email === email);
    }
}

module.exports = { crearRepositorio: () => new RepositorioMemoria() };
