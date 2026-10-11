// Capa Lógica de negocio
class ServicioUsuarios {
    constructor(repo) {
        this.repo = repo;
    }

    async registrar(email) {
        if (!email) throw new Error('El correo es obligatorio');
        const existe = this.repo.buscarPorEmail(email);
        if (existe) throw new Error('El usuario ya existe');
        return this.repo.crear(email);
    }

    async listar() {
        return this.repo.listar();
    }
}

module.exports = { crearServicio: (repo) => new ServicioUsuarios(repo) };
