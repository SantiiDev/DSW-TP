// Acceso a datos de la feature auth: todas las consultas a la tabla users que
// necesita el circuito de registro e inicio de sesión. Es la única capa que
// habla con Sequelize.
import { User } from '../../entities';
import { UserRole } from '../../shared/types/enums';

type CreateUserData = {
  username: string;
  email: string;
  /** Ya hasheado con bcrypt: acá nunca llega una contraseña en texto plano. */
  password: string;
  rol: UserRole;
};

export const authRepository = {
  findById: (id_user: number) => User.findByPk(id_user),

  findByEmail: (email: string) => User.findOne({ where: { email } }),

  findByUsername: (username: string) => User.findOne({ where: { username } }),

  /**
   * Igual que findByEmail pero trayendo el hash de la contraseña.
   * Es la ÚNICA consulta del sistema que lo necesita (para compararlo en el login):
   * el scope por defecto de la entidad lo excluye de todas las demás.
   */
  findByEmailWithPassword: (email: string) =>
    User.scope('withPassword').findOne({ where: { email } }),

  create: (data: CreateUserData) => User.create(data),
};
