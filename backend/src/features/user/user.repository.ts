// Acceso a datos de la feature user: consultas a la tabla users para el CRUD de
// perfiles (no confundir con auth.repository, que es específico del circuito de
// registro/login). Es la única capa que habla con Sequelize.
import { User } from '../../entities';
import { UserRole, UserState } from '../../shared/types/enums';

type CreateUserData = {
  username: string;
  email: string;
  /** Ya hasheado con bcrypt: acá nunca llega una contraseña en texto plano. */
  password: string;
  rol: UserRole;
  url_avatar?: string | null;
};

type UpdateUserData = {
  username?: string;
  email?: string;
  rol?: UserRole;
  state?: UserState;
  url_avatar?: string | null;
};

export const userRepository = {
  findAll: () => User.findAll(),

  create: (data: CreateUserData) => User.create(data),

  findById: (id_user: number) => User.findByPk(id_user),

  findByEmail: (email: string) => User.findOne({ where: { email } }),

  findByUsername: (username: string) => User.findOne({ where: { username } }),

  update: async (user: User, data: UpdateUserData): Promise<User> => user.update(data),

  /**
   * Cambia el estado de la cuenta: es la baja (y el alta) lógica.
   *
   * No existe un delete acá a propósito. Borrar la fila se llevaría puestas las
   * reseñas y los pagos del usuario, que la referencian por FK.
   */
  updateState: async (user: User, state: UserState): Promise<User> => user.update({ state }),
};
